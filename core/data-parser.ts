import {
    DpChunk,
    DpChild,
    DpRow,
    DpItemType,
} from "@fe-console/types/data-parser";

const getDpType = (obj): DpItemType => {
    const type = typeof obj;
    if (type === "object") {
        if (Array.isArray(obj)) {
            return DpItemType.array;
        }
        return DpItemType.object;
    }
    return DpItemType[type];
};
const isBaseType = (type: DpItemType) => {
    return (
        type === DpItemType.boolean ||
        type === DpItemType.number ||
        type === DpItemType.string ||
        type === DpItemType.undefined
    );
};
const isOpenable = (type: DpItemType) => {
    return (
        type === DpItemType.array ||
        type === DpItemType.object ||
        type === DpItemType.function ||
        type === DpItemType.symbol
    );
};
const getFunHead = (fun) => {
    const str = fun.toString();
    const funName = fun.name;
    if (fun.name) {
    }
    let index;
    const index1 = str.indexOf("{");
    const index2 = str.indexOf("=>");
    if (index1 !== -1 && index2 !== -1) {
        index = index1 < index2 ? index1 : index2;
    } else if (index1 !== -1) {
        index = index1;
    } else {
        index = index2;
    }
    let head = str.substr(0, index);
    head.replace("function ", "");
    // TODO:待完善
    return head;
};
const notOpenPushChildren = (
    children: DpChild[],
    type: DpItemType,
    value: any,
    ellipsis?: boolean
): boolean => {
    if (isBaseType(type)) {
        children.push({
            type,
            value,
        });
        return true;
    }
    if (type === DpItemType.symbol) {
        children.push({
            type: DpItemType.symbol,
            value: value.toString(),
        });
        return true;
    }
    if (ellipsis) {
        if (type === DpItemType.function) {
            children.push({
                type: DpItemType.ellipsisFcuntion,
                value: "ƒ",
            });
            return true;
        }
        if (type === DpItemType.object) {
            children.push({
                type: DpItemType.ellipsisObject,
                value: "{...}",
            });
        } else if (type === DpItemType.array) {
            children.push({
                type: DpItemType.ellipsisArray,
                value: `Array(${value.length})`,
            });
        }
    }
    return false;
};
export default function parse(
    type: "chunk" | "child" | "row",
    ...source
): Array<DpChunk | DpChild | DpRow | void> {
    if (type === "chunk") {
        return source.reduce((sum, item) => {
            const valType = getDpType(item);
            if (valType === DpItemType.object || valType === DpItemType.array) {
                sum.push({
                    type: valType,
                    openable: true,
                    opened: false,
                    children: parse("child", item, valType),
                });
            } else if (valType === DpItemType.function) {
                sum.push({
                    type: valType,
                    value: item.toString().substr(0, 100),
                });
            } else {
                notOpenPushChildren(sum, valType, item, false);
            }
            return sum;
        }, []) as DpChunk[];
    } else if (type === "child") {
        const obj = source[0];
        const type = source[1] as DpItemType;
        const children: DpChild[] = [];
        if (!notOpenPushChildren(children, type, obj)) {
            if (type === DpItemType.object) {
                children.push({
                    type: DpItemType.bracket,
                    value: "{",
                });
                Object.keys(obj).forEach((key, index, arr) => {
                    children.push({
                        type: DpItemType.prop,
                        value: key,
                    });
                    children.push({
                        type: DpItemType.separator,
                        value: ":",
                    });
                    const value = obj[key];
                    notOpenPushChildren(
                        children,
                        getDpType(value),
                        value,
                        true
                    );
                    if (index < arr.length - 1) {
                        children.push({
                            type: DpItemType.separator,
                            value: ",",
                        });
                    }
                });
                children.push({
                    type: DpItemType.bracket,
                    value: "}",
                });
            } else if (type === DpItemType.array) {
                children.push({
                    type: DpItemType.length,
                    value: `(${obj.length})`,
                });
                children.push({
                    type: DpItemType.bracket,
                    value: "[",
                });
                obj.forEach((item) => {
                    notOpenPushChildren(children, getDpType(item), item, true);
                });
                children.push({
                    type: DpItemType.bracket,
                    value: "]",
                });
            }
        }
        if (children.length) {
            return children;
        }
        return;
    } else if (type === "row") {
        const obj = source[0];
        return Object.keys(obj).map((prop) => {
            const value = obj[prop];
            const type = getDpType(value);
            const dpRow: DpRow = {
                prop,
                type,
                openable: isOpenable(type),
            };
            if (isBaseType(type)) {
                dpRow.value = value;
            } else if (type === DpItemType.symbol) {
                dpRow.value = value.toString();
            } else if (type === DpItemType.function) {
                dpRow.value = getFunHead(value);
            }
            if (dpRow.openable) {
                dpRow.opened = false;
                const children = parse("child", value, type) as DpRow[];
                if (children && children.length) {
                    dpRow.children = children;
                }
            }
            return dpRow;
        }) as DpRow[];
    }
}
