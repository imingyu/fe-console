import { MixinStore, MkApi } from "@mpkit/mixin";
import { getMpInitLifeName } from "@mpkit/util";
import { MpViewType } from "@mpkit/types";
import MpRunConfig from "./config";
import {
    FcMpAjaxStorager,
    FcMpMemoryObserver,
    FcMpMemoryStorager,
    FcMpObserver,
    FcMpProducer,
} from "@fe-console/core";
import {
    FcConsoleProduct,
    FcMpApiProduct,
    FcMpViewProduct,
    IFcStorager,
} from "@fe-console/types";

if (MpRunConfig) {
    let MpObserver: FcMpMemoryObserver;
    const setFcValues = (target: any) => {
        if (typeof Object.defineProperties === "function") {
            Object.defineProperties(target, {
                $fcRunConfig: {
                    get() {
                        return MpRunConfig;
                    },
                },
                $fcObserver: {
                    get() {
                        return MpObserver;
                    },
                },
            });
        } else {
            target.$fcRunConfig = MpRunConfig;
            target.$fcObserver = MpObserver;
        }
    };
    const runConfigMixin = (type: MpViewType) => {
        const mixin = {
            [getMpInitLifeName(type)]: {
                before() {
                    setFcValues(this);
                },
            },
        };
        if (type === MpViewType.Component) {
            mixin.observer = {
                before() {
                    setFcValues(this);
                },
            };
        }
        return mixin;
    };
    Object.defineProperty(MkApi, "$fcRunConfig", {
        get() {
            return MpRunConfig;
        },
    });
    MixinStore.addHook(MpViewType.App, runConfigMixin(MpViewType.App));
    MixinStore.addHook(MpViewType.Page, runConfigMixin(MpViewType.Page));
    MixinStore.addHook(
        MpViewType.Component,
        runConfigMixin(MpViewType.Component)
    );

    type ObserverMap = {
        [prop: string]: {
            storager: IFcStorager<
                FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
            >;
            observer?: FcMpObserver;
        };
    };
    if (MpRunConfig && MpRunConfig.observer && MpRunConfig.observer.length) {
        const producer = new FcMpProducer(MpRunConfig.producerOptions);
        const observerMap: ObserverMap = {};
        MpRunConfig.observer.map((item) => {
            if (item === "local") {
                if (!observerMap[item]) {
                    const storager = new FcMpMemoryStorager();
                    const observer = new FcMpMemoryObserver(storager);
                    observerMap[item] = {
                        storager: storager,
                        observer,
                    };
                }
            } else {
                let url = Array.isArray(item) ? item[0] : item;
                let filter =
                    Array.isArray(item) && typeof item[1] === "function"
                        ? item[1]
                        : null;
                observerMap[item] = {
                    storager: new FcMpAjaxStorager(url, filter),
                };
            }
        });

        producer.on("data", (type, data) => {
            for (let prop in observerMap) {
                if (observerMap[prop].storager) {
                    observerMap[prop].storager.emit("data", data);
                }
            }
        });
        producer.on("change", (type, data) => {
            for (let prop in observerMap) {
                if (observerMap[prop].storager) {
                    observerMap[prop].storager.emit("change", data);
                }
            }
        });

        for (let prop in observerMap) {
            if (observerMap[prop].storager) {
                observerMap[prop].storager.on("data", (t, data) => {
                    observerMap[prop].observer &&
                        observerMap[prop].observer.emit("data", data);
                });
                observerMap[prop].storager.on("change", (t, data) => {
                    observerMap[prop].observer &&
                        observerMap[prop].observer.emit("change", data);
                });
            }
        }
        if (observerMap.local && observerMap.local.observer) {
            MpObserver = observerMap.local.observer as FcMpMemoryObserver;
        }
    }
}
