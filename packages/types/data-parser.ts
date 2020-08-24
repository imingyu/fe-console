export interface DpItem {
    openable: boolean;
    opened?: boolean;
    value?: any;
    feature?: {
        [prop: string]: boolean;
    };
}
export interface DpChunk extends DpItem {
    type: DpItemType;
    children?: DpChild[];
    rows?: DpRow[];
}
export interface DpChild {
    type: DpItemType;
    value?: any;
    feature?: {
        [prop: string]: boolean;
    };
}
export enum DpItemType {
    number = "number",
    string = "string",
    boolean = "boolean",
    function = "function",
    object = "object",
    array = "array",
    undefined = "undefined",
    symbol = "symbol",
    length = "length",
    bracket = "bracket",
    ellipsisObject = "ellipsisObject",
    ellipsisFcuntion = "ellipsisFcuntion",
    ellipsisArray = "ellipsisArray",
    prop = "prop",
    br = "br",
    separator = "separator",
}
export interface DpRow extends DpChunk {
    prop: string;
}
