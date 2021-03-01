import {
    FcMethodExecStatus,
    FcMpHookInfo,
    FcMpViewProduct,
    FcProductType,
    IFcProducer,
} from "@fe-console/types";
import { now } from "@fe-console/util";
import { MkApp, MkPage, MkComponent, MixinStore } from "@mpkit/mixin";
import { MpViewType, MpMethodHook } from "@mpkit/types";
import { uuid, getMpInitLifeName, getMpViewType } from "@mpkit/util";

export const hookMpView = (
    hookState: FcMpHookInfo,
    producer: IFcProducer<FcMpViewProduct>
) => {
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
            };
            hookState.productMap[id] = product;
            producer.create(product);
            if (isEvent(args[0])) {
                const wrapDetail = args[0].detail;
                if (
                    typeof wrapDetail === "object" &&
                    wrapDetail &&
                    wrapDetail._mpcWrap
                ) {
                    args[0].detail = wrapDetail.orgDetail;
                    product.eventTriggerPid = wrapDetail.id;
                    if (hookState.productMap[wrapDetail.id]) {
                        (hookState.productMap[
                            wrapDetail.id
                        ] as FcMpViewProduct).eventHandlePid = id;
                    }
                }
            }
        },
        after(name, args, result, id) {
            if (hookState.productMap[id]) {
                const product = hookState.productMap[id] as FcMpViewProduct;
                product.execEndTime = now();
                product.result = result;
                if (result && typeof result === "object" && "then" in result) {
                    result.then((res) => {
                        product.result = res;
                        product.endTime = now();
                        product.status = FcMethodExecStatus.Success;
                        delete hookState.productMap[id];
                    });
                } else {
                    delete hookState.productMap[id];
                }
            }
        },
        catch(name, args, error, errType, id) {
            if (hookState.productMap[id]) {
                const product = hookState.productMap[id] as FcMpViewProduct;
                product.status = FcMethodExecStatus.Fail;
                product.result = [error, errType];
                product.endTime = now();
                delete hookState.productMap[id];
            }
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
                };
                hookState.productMap[id] = product;
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
            };
            hookState.productMap[id] = product;
            producer.create(product);
            rewriteTrigger.call(this);
        },
        after(name, args, result, id) {
            if (hookState.productMap[id]) {
                const product = hookState.productMap[id] as FcMpViewProduct;
                product.execEndTime = now();
                product.result = result;
                delete hookState.productMap[id];
            }
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
