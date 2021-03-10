import {
    FcMethodExecStatus,
    FcMpHookInfo,
    FcMpViewProduct,
    FcProductType,
    IFcProducer,
} from "@fe-console/types";
import { now, $$getStack } from "@fe-console/util";
import { MkApp, MkPage, MkComponent, MixinStore } from "@mpkit/mixin";
import { MpViewType, MpMethodHook } from "@mpkit/types";
import { uuid, getMpInitLifeName, getMpViewType } from "@mpkit/util";

export const hookMpView = (producer: IFcProducer<FcMpViewProduct>) => {
    const isEvent = (obj) =>
        typeof obj === "object" &&
        obj &&
        "type" in obj &&
        obj.type &&
        "currentTarget" in obj &&
        obj.currentTarget;
    const viewHook: MpMethodHook = {
        before(name, args, handler, id) {
            const product: FcMpViewProduct = {
                id,
                type: FcProductType.MpView,
                category: getMpViewType(this),
                group: name,
                time: now(),
                request: args,
                status: FcMethodExecStatus.Executed,
                stack: $$getStack(),
            };
            producer.create(product);
            if (isEvent(args[0])) {
                const wrapDetail = args[0].detail;
                if (
                    typeof wrapDetail === "object" &&
                    wrapDetail &&
                    wrapDetail._mpcWrap
                ) {
                    args[0].detail = wrapDetail.orgDetail;
                    producer.change(id, {
                        eventTriggerPid: wrapDetail.id,
                    });
                    producer.change(wrapDetail.id, {
                        eventHandlePid: id,
                    });
                }
            }
        },
        after(name, args, result, id) {
            if (result && typeof result === "object" && "then" in result) {
                result.then((res) => {
                    producer.change(id, {
                        status: FcMethodExecStatus.Success,
                        result: res,
                        endTime: now(),
                    });
                });
            } else {
                producer.change(id, {
                    result,
                    endTime: now(),
                });
            }
        },
        catch(name, args, error, errType, id) {
            producer.change(id, {
                status: FcMethodExecStatus.Fail,
                result: [error, errType],
                endTime: now(),
            });
        },
    };
    MixinStore.addHook(MpViewType.App, viewHook);
    MixinStore.addHook(MpViewType.Page, viewHook);
    MixinStore.addHook(MpViewType.Component, viewHook);
    function rewriteTrigger() {
        if ("triggerEvent" in this) {
            this.$nativeTriggerEvent = this.triggerEvent;
            this.triggerEvent = function (...args) {
                const orgDetail = args[1];
                const id = uuid();
                args[1] = {
                    id,
                    _mpcWrap: true,
                    orgDetail,
                };
                const product: FcMpViewProduct = {
                    id,
                    type: FcProductType.MpView,
                    category: getMpViewType(this),
                    group: "triggerEvent",
                    time: now(),
                    request: args,
                    status: FcMethodExecStatus.Executed,
                    eventTriggerView: this,
                stack: $$getStack(),
                };
                producer.create(product);
                return this.$nativeTriggerEvent.apply(this, args);
            };
        }
    }

    const initLifeMixin = {
        before(name, args, handler, id) {
            const product: FcMpViewProduct = {
                id,
                type: FcProductType.MpView,
                category: getMpViewType(this),
                group: name,
                time: now(),
                request: args,
                status: FcMethodExecStatus.Executed,
                stack: $$getStack(),
            };
            producer.create(product);
            rewriteTrigger.call(this);
        },
        after(name, args, result, id) {
            producer.change(id, {
                execEndTime: now(),
                result,
            });
        },
    };
    MixinStore.addHook(MpViewType.App, {
        [getMpInitLifeName(MpViewType.App)]: initLifeMixin,
    });
    MixinStore.addHook(MpViewType.Page, {
        [getMpInitLifeName(MpViewType.Page)]: initLifeMixin,
    });
    MixinStore.addHook(MpViewType.Component, {
        [getMpInitLifeName(MpViewType.Component)]: initLifeMixin,
    });
    const wrapView = (native, mkView, type: MpViewType) => {
        return (spec) => {
            const id = uuid();
            const targetSpec = mkView(spec);
            const product: FcMpViewProduct = {
                id,
                type: FcProductType.MpView,
                category: type,
                group: "$register$",
                time: now(),
                request: [spec, targetSpec],
                status: FcMethodExecStatus.Executed,
            };
            producer.create(product);
            const res = native(targetSpec);
            product.execEndTime = now();
            product.result = res;
            return res;
        };
    };
    App = wrapView(App, MkApp, MpViewType.App);
    Page = wrapView(Page, MkPage, MpViewType.Page);
    Component = wrapView(Component, MkComponent, MpViewType.Component);
};
