export const enum FcRendererType {
    number = 1,
    string = 2,
    boolean = 3,
    func = 4,
    obj = 5,
    array = 6,
    undefined = 7,
    null = 8,
    symbol = 9,
    regExp = 10,
    date = 10,
    prop = 11,
    attr = 12,
    name = 13,
    // ƒ
    funcSymbol = 14,
    length = 15,
    bracketLeft = 16,
    bracketRight = 17,
    ellipsisObject = 18,
    ellipsisFunc = 19,
    ellipsisArray = 20,
    br = 21,
    separator = 22,
    ellipsis = 23,
    bigint = 24,
    readonlyProp = 25,
    computeProp = 26,
}

export interface FcRendererProduct {
    type: FcRendererType;
    addr?: string;
    value?: string;
    summary?: FcRendererProduct[];
    children?: FcRendererProduct[];
    openable?: boolean;
}

export const enum FcRendererLevel {
    summary = 1,
    symbol = 2,
    head = 3,
    ellipsis = 4,
    detail = 5,
}
