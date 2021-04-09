import { MixinStore, MkApi } from "@mpkit/mixin";
import { getMpInitLifeName } from "@mpkit/util";
import { MpViewType } from "@mpkit/types";
import {
    FcMpAjaxStorager,
    FcMpMemoryObserver,
    FcMpMemoryStorager,
    FcMpObserver,
    FcMpProducer,
    MpFc,
} from "@fe-console/core";
import {
    FcConsoleProduct,
    FcMpApiProduct,
    FcMpRunConfig,
    FcMpViewProduct,
    IFcStorager,
} from "@fe-console/types";
import { DefaultConfig } from "./configure/index";
export { DefaultConfig } from "./configure/index";

export const init = (MpRunConfig?: FcMpRunConfig) => {
    if (typeof MpRunConfig === "undefined") {
        MpRunConfig = DefaultConfig;
    }
    if (typeof MpRunConfig !== "object" || !MpRunConfig) {
        console.warn("Config对象无效，无法初始化FeConsole");
        return;
    }
    let MpObserver: FcMpMemoryObserver;
    const setFcValues = (
        target: any,
        observer: boolean = true,
        fc: boolean = true
    ) => {
        if ("$fcRunConfig" in target) {
            return;
        }
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
                $fc: {
                    get() {
                        return MpFc;
                    },
                },
            });
        } else {
            target.$fcRunConfig = MpRunConfig;
            target.$fcObserver = MpObserver;
            target.$fc = MpFc;
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
    setFcValues(MkApi, false, false);
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
        (global as any).observerMap=observerMap;
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
                    observerMap[prop].storager.push(data);
                }
            }
        });
        producer.on("change", (type, data) => {
            for (let prop in observerMap) {
                if (observerMap[prop].storager) {
                    observerMap[prop].storager.change(data.id, data);
                }
            }
        });

        for (let prop in observerMap) {
            if (observerMap[prop].storager && observerMap[prop].observer) {
                observerMap[prop].storager.on("data", (t, data) => {
                    observerMap[prop].observer.emit("data", data);
                });
                observerMap[prop].storager.on("change", (t, data) => {
                    observerMap[prop].observer.emit("change", data);
                });
            }
        }
        if (observerMap.local && observerMap.local.observer) {
            MpObserver = observerMap.local.observer as FcMpMemoryObserver;
        }
    }
};
