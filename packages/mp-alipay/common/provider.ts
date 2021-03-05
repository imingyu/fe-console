import {
    FcMpProducer,
    FcMpMemoryStorager,
    FcMpObserver,
    FcMpMemoryObserver,
    FcMpAjaxStorager,
} from "@fe-console/core";
import {
    FcMpViewProduct,
    FcConsoleProduct,
    FcMpApiProduct,
    IFcStorager,
} from "@fe-console/types";
import MpConfig from "../config";

export const getObserver = (() => {
    type ObserverMap = {
        [prop: string]: {
            storager: IFcStorager<
                FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
            >;
            observer?: FcMpObserver;
        };
    };
    let observerMap: ObserverMap;
    let producer: FcMpProducer;
    let localStorager: FcMpMemoryStorager;
    return (): FcMpMemoryObserver | undefined => {
        if (
            !observerMap &&
            MpConfig &&
            MpConfig.observer &&
            MpConfig.observer.length
        ) {
            producer = new FcMpProducer();
            observerMap = {};
            MpConfig.observer.map((item) => {
                if (item === "local") {
                    if (!observerMap[item]) {
                        localStorager = new FcMpMemoryStorager();
                        const observer = new FcMpMemoryObserver(localStorager);
                        observerMap[item] = {
                            storager: localStorager,
                            observer,
                        };
                        localStorager.on("data", (type, data) => {
                            observer.emit("data", data);
                        });
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
                    observerMap[prop].storager.emit("data", data);
                }
            });
        }
        return observerMap.local ? observerMap.local.observer : undefined;
    };
})();
