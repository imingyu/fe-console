import { IMap } from "./util";

export default class VQuery<T> {
    private idMap: IMap<string, T> = {} as IMap<string, T>;
    private parentMap: IMap<string, T> = {} as IMap<string, T>;
    private childrenMap: IMap<string, T[]> = {} as IMap<string, T[]>;
    private idFiledName: string;
    constructor(idFiledName: string) {
        this.idFiledName = idFiledName;
    }
    add(el: T) {
        this.idMap[el[this.idFiledName]] = el;
    }

    getMpType() {
        if (typeof wx === "object") {
            return "wechat";
        } else if (typeof my === "object") {
            return "alipay";
        } else if (typeof swan === "object") {
            return "smart";
        } else if (typeof tt === "object") {
            return "tiktok";
        } else {
            return "unknown";
        }
    }

    getElType(el: T) {
        const mpType = this.getMpType();
    }

    queryRelation(el: T, refresh: boolean = false) {
        const id = el[this.idFiledName];
        if (!this.parentMap[id] || refresh) {
            const tsEl = el as any;
            if (typeof tsEl.selectOwnerComponent === "function") {
                // wechat
                const parent = tsEl.selectOwnerComponent() as void | T;
                if (parent) {
                    this.parentMap[id] = parent;
                    const parentId = parent[this.idFiledName];
                    if (!this.childrenMap[parentId]) {
                        this.childrenMap[parentId] = [] as T[];
                    }
                    this.childrenMap[parentId].push(el);
                }
            } else if (typeof tsEl.selectAllComponents === "function") {
                // tiktok
            }
        }
    }

    get(id: string): T {
        return this.idMap[id];
    }
    getElSelector(el: T) {
        const tsEl = el as any;
        let res = "";
        if (tsEl.id) {
            res += `#${tsEl.id}`;
        }
        if (tsEl.className) {
            res +=
                "." +
                tsEl.className
                    .split(" ")
                    .reduce((sum, item) => {
                        if ((item = item && item.trim())) {
                            sum.push(item);
                        }
                        return sum;
                    }, [])
                    .join(".");
        }
        return res;
    }
    getParent(id: string | T): Promise<void | T> {
        const tsId =
            typeof id === "string"
                ? id
                : ((id as T)[this.idFiledName] as string);
        return this.parentMap[tsId];
    }
    getChildren(id: string | T): Promise<T[]> {
        const tsId =
            typeof id === "string"
                ? id
                : ((id as T)[this.idFiledName] as string);
        return this.childrenMap[tsId];
    }
}
