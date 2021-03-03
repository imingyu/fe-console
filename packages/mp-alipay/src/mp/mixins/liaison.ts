import { MpViewType } from "@mpkit/types";
import { getMpInitLifeName, uuid, getMpPlatform } from "@mpkit/util";
import { FcEventHandler, FcMpViewContextBase } from "@fe-console/types";
import { once, emit, on, off } from "../../ebus";
export const createLiaisonMixin = (() => {
    const viewMap: any = {};
    return (type: MpViewType, tid: string) => {
        const methods = {
            $fcOn(name: string, handler: FcEventHandler) {
                if (!this.$fcEvents) {
                    this.$fcEvents = {};
                }
                if (!this.$fcEvents[name]) {
                    this.$fcEvents[name] = [];
                }
                this.$fcEvents[name].push(handler);
                on(name, handler);
            },
            $fcOnce(name: string, handler: FcEventHandler) {
                if (!this.$fcEvents) {
                    this.$fcEvents = {};
                }
                if (!this.$fcEvents[name]) {
                    this.$fcEvents[name] = [];
                }
                this.$fcEvents[name].push(handler);
                once(name, handler);
            },
            $fcEmit(name: string, data?: any) {
                emit(name, data);
            },
            $fcOff(name: string, handler?: FcEventHandler) {
                if (this.$fcEvents && this.$fcEvents[name]) {
                    if (handler) {
                        let index = this.$fcEvents[name].indexOf(handler);
                        this.$fcEvents[name].splice(index, 1);
                    } else {
                        delete this.$fcEvents[name];
                    }
                }
                off(name, handler);
            },
            $fcDispatch(
                type: string,
                data: any,
                root: FcMpViewContextBase = this
            ) {
                const parentCid = this.$fcGetParentCid();
                if (parentCid) {
                    this.$fcEmit(`Dispatch.${parentCid}`, {
                        child: this,
                        root,
                        type,
                        data,
                    });
                    return;
                }
                if (!this.$fcUnDispatchEvents) {
                    this.$fcUnDispatchEvents = [];
                }
                this.$fcUnDispatchEvents.push([type, data, root]);
            },
            $fcGetProp<T = any>(prop: string): T {
                return this['props'][
                    prop
                ] as T;
            },
            $fcGetParentTid(): string {
                return this.$fcGetProp("parentTid");
            },
            $fcGetParentCid(): string {
                return this.$fcGetProp("parentCid");
            },
        };
        const destoryLife =
            type === MpViewType.Component
                ? 'didUnmount'
                : "onUnload";
        const mixin: any = {
            data: {
                $tid: tid,
            },
            [getMpInitLifeName(type)](this: FcMpViewContextBase) {
                const tid = this.data.$tid;
                this.$tid = tid;
                const cid = uuid();
                this.$cid = cid;
                if (!viewMap[tid]) {
                    viewMap[tid] = {};
                }
                viewMap[tid][cid] = this;
                viewMap[cid] = this;
                setTimeout(() => {
                    this.setData(
                        {
                            $cid: cid,
                        },
                        () => {
                            setTimeout(() => {
                                this.$fcEmit("ComponentCidReady", {
                                    cid,
                                    tid,
                                });
                            });
                        }
                    );
                }, 500);
                const onCidReady = (type, data) => {
                    if (
                        data &&
                        data.tid === this.$fcGetParentTid() &&
                        data.cid === this.$fcGetParentCid()
                    ) {
                        if (
                            this.$fcUnDispatchEvents &&
                            this.$fcUnDispatchEvents.length
                        ) {
                            this.$fcUnDispatchEvents.forEach((item) => {
                                this.$fcDispatch(item[0], item[1], item[2]);
                            });
                            delete this.$fcUnDispatchEvents;
                        }
                        this.$fcOff("ComponentCidReady", onCidReady);
                    }
                };
                this.$fcOn("ComponentCidReady", onCidReady);

                this.$fcOn(`Dispatch.${cid}`, (type, data) => {
                    this.$fcDispatch(data.type, data.data, data.root);
                });
            },
        };
        if (type === MpViewType.Component) {
            mixin.properties = {
                parentCid: String,
                parentTid: String,
            };
            mixin.methods = methods;
        } else {
            Object.assign(mixin, methods);
        }
        if (type !== MpViewType.App) {
            mixin[destoryLife] = function () {
                if (this.$fcEvents) {
                    for (let name in this.$fcEvents) {
                        this.$fcOff(name);
                    }
                }
                setTimeout(() => {
                    delete viewMap[this.data.$cid];
                    if (
                        viewMap[this.data.$tid] &&
                        viewMap[this.data.$tid][this.data.$cid]
                    ) {
                        delete viewMap[this.data.$tid][this.data.$cid];
                    }
                }, 1.5 * 1000);
            };
        }
        return mixin;
    };
})();
