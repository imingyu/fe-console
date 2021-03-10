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
    PartialBy,
} from "@fe-console/types";
import MpConfig from "../config";

interface FcMpProductFilter {
    (data: Partial<MpProduct>): boolean;
}
type MpProduct = FcMpApiProduct | FcMpViewProduct | FcConsoleProduct;
class FcMpFilterProducer extends FcMpProducer {
    constructor(public filter: FcMpProductFilter) {
        super();
    }
    change(id: string, data?: Partial<MpProduct>) {
        data = data || ({} as Partial<MpProduct>);
        data.id = id;
        if (this.filter(data)) {
            super.change(id, data);
        }
    }
    create(data: PartialBy<MpProduct, "id" | "time">): MpProduct | undefined {
        if (this.filter(data as Partial<MpProduct>)) {
            return super.create(data);
        }
    }
}

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
    let producer: FcMpFilterProducer;
    let localStorager: FcMpMemoryStorager;
    return (): FcMpMemoryObserver | undefined => {
        if (
            !observerMap &&
            MpConfig &&
            MpConfig.observer &&
            MpConfig.observer.length
        ) {
            producer = new FcMpFilterProducer((data): boolean => {
                if (typeof MpConfig.productFilter === "function") {
                    return MpConfig.productFilter(data);
                }
                return true;
            });
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
                        localStorager.on("change", (type, data) => {
                            observer.emit("change", data);
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
            producer.on("change", (type, data) => {
                for (let prop in observerMap) {
                    observerMap[prop].storager.emit("change", data);
                }
            });
        }
        return observerMap.local ? observerMap.local.observer : undefined;
    };
})();
