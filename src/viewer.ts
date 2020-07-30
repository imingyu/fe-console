import { isArray, uuid, IMap } from "./util";
export enum DataViewType {
    number = "number",
    string = "string",
    boolean = "boolean",
    function = "function",
    object = "object",
    ellipsisObject = "ellipsisObject",
    null = "null",
    array = "array",
    undefined = "undefined",
    key = "key",
    row = "row",
    getter = "getter",
    protectKey = "protectKey",
    br = "br",
    symbol = "symbol",
}
export interface DataViewLike {
    name?: string;
    key?: string;
    type: DataViewType;
    value?: any;
    chilren?: DataView[];
    length?: number;
    original?: any;
    open?: boolean;
    objectKey?: boolean;
    arrayKey?: boolean;
}
export interface DataView extends DataViewLike {
    key: string;
}

export interface DataViewResult {
    detail: DataView | DataView[];
    map: IMap<string, DataView>;
}

export interface ParseDataViewOptions {
    convertBr?: boolean;
    getChilren?: boolean;
    ellipsisObject?: boolean;
    maxArrShowItemCount: number;
    arrShowItemCount: number;
    maxObjectShowKeysCount: number;
    objectShowKeysCount: number;
}
const DEFAULT_ITEM_COUNT = 10;
export const getDataView = (
    obj,
    options: ParseDataViewOptions = {
        maxArrShowItemCount: DEFAULT_ITEM_COUNT,
        arrShowItemCount: DEFAULT_ITEM_COUNT,
        maxObjectShowKeysCount: DEFAULT_ITEM_COUNT,
        objectShowKeysCount: DEFAULT_ITEM_COUNT,
    },
    map?: IMap<string, DataView>,
    objName?: string
): DataViewResult => {
    const {
        convertBr,
        ellipsisObject,
        getChilren,
        maxArrShowItemCount,
        arrShowItemCount,
        maxObjectShowKeysCount,
        objectShowKeysCount,
    } = options;
    const subOptions: ParseDataViewOptions = JSON.parse(
        JSON.stringify(options)
    );
    subOptions.convertBr = false;
    subOptions.getChilren = !subOptions.getChilren;
    let detail;
    if (!map) {
        map = {} as IMap<string, DataView>;
    }
    const newView = (dt: DataViewLike): DataView => {
        const key = uuid();
        dt.key = key;
        const original = dt.original;
        delete dt.original;
        map[key] = {
            ...dt,
            original,
        };
        return dt as DataView;
    };

    const argType = typeof obj;
    if (argType === "string") {
        if (obj.indexOf("\n") !== -1 && convertBr) {
            detail = [] as DataView[];
            obj.split("\n").forEach((str) => {
                detail.push(
                    newView({
                        type: DataViewType.string,
                        value: str,
                    })
                );
                detail.push(
                    newView({
                        type: DataViewType.br,
                    })
                );
            });
        } else {
            detail = newView({
                type: DataViewType.string,
                value: obj,
            });
        }
    } else if (
        argType === "boolean" ||
        argType === "undefined" ||
        argType === "number" ||
        argType === "symbol" ||
        obj === null
    ) {
        detail = newView({
            type: obj === null ? DataViewType.null : DataViewType[argType],
            value: argType === "symbol" ? obj.toString() : obj,
        });
    } else if (argType === "function") {
        detail = newView({
            type: DataViewType.function,
            original: obj,
        });
    } else if (isArray(obj)) {
        subOptions.ellipsisObject = true;
        subOptions.convertBr = false;
        detail = newView({
            type: DataViewType.array,
            length: obj.length,
            original: obj,
            [`${getChilren ? "children" : "value"}`]: obj
                .slice(0, getChilren ? maxArrShowItemCount : arrShowItemCount)
                .reduce((sum, item, index): DataView[] => {
                    const res = getDataView(item, subOptions, map).detail;
                    if (getChilren) {
                        sum.push(
                            newView({
                                type: DataViewType.row,
                                value: [
                                    newView({
                                        type: DataViewType.key,
                                        value: index,
                                        arrayKey: true,
                                    }),
                                    ...(isArray(res)
                                        ? (res as DataView[])
                                        : [res]),
                                ],
                            })
                        );
                    } else {
                        sum.push(
                            newView({
                                type: DataViewType.key,
                                value: index,
                                arrayKey: true,
                            })
                        );
                        sum.push(
                            ...(isArray(res) ? (res as DataView[]) : [res])
                        );
                    }
                    return sum;
                }, []),
        });
    } else {
        if (ellipsisObject) {
            detail = newView({
                type: DataViewType.ellipsisObject,
                original: obj,
            });
        } else {
            subOptions.ellipsisObject = true;
            detail = newView({
                type: DataViewType.object,
                original: obj,
                [`${getChilren ? "children" : "value"}`]: Object.keys(obj)
                    .slice(
                        0,
                        getChilren
                            ? maxObjectShowKeysCount
                            : objectShowKeysCount
                    )
                    .reduce((sum, key) => {
                        const res = getDataView(obj[key], subOptions, map)
                            .detail;
                        if (getChilren) {
                            sum.push(
                                newView({
                                    type: DataViewType.row,
                                    value: [
                                        newView({
                                            type: DataViewType.key,
                                            value: key,
                                        }),
                                        ...(isArray(res)
                                            ? (res as DataView[])
                                            : [res]),
                                    ],
                                })
                            );
                        } else {
                            sum.push(
                                newView({
                                    type: DataViewType.key,
                                    value: key,
                                    objectKey: true,
                                })
                            );
                            sum.push(
                                ...(isArray(res) ? (res as DataView[]) : [res])
                            );
                        }
                        return sum;
                    }, []),
            });
        }
    }
    return {
        detail: detail as DataView | DataView[],
        map,
    };
};
