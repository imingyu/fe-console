import { FcProduct, FcProductFilter } from "./provider";

/**
 * 数据原料（生产者生成）的数据类型
 */
export const enum FcProductType {
    /** console相关方法执行时产生 */
    Console = 1,
    /** 系统中UI事件执行时产生 */
    Event = 2,
    /** 小程序中api方法执行时产生 */
    MpApi = 3,
    /** 小程序中创建app/page/component实例，或其实例方法执行时产生 */
    MpView = 4,
}

/**
 * 小程序数据生产者监听作用域
 */
export const enum FcMpProducerScope {
    Console = 1,
    ConsoleLog = 2,
    ConsoleWarn = 3,
    ConsoleError = 4,
    ConsoleInfo = 5,
    ConsoleDir = 6,
    View = 7,
    App = 8,
    Page = 9,
    Component = 10,
    ViewLife = 11,
    AppLife = 13,
    PageLife = 14,
    ComponentLife = 15,
}

export interface FcProducerRange<T extends FcCommonProduct = FcCommonProduct> {
    type: FcProductType;
    disabled?: boolean;
    filter?: FcProductFilter<T, FcProductType>;
}

/**
 *  生产者配置，可配置哪些数据可以被生成
 */
export interface FcProducerOptions<
    T extends FcCommonProduct = FcCommonProduct
> {
    /**
     * 数据范围，未在范围或者在范围中但是未通过range[x].filter的数据将不被生成
     * undefiend|不设置=代表监控系统中所有可被监控的范围
     * 空数组=所有都不监控
     * like true=代表监控系统中所有可被监控的范围
     * like false=所有都不监控
     * 其他=按条件监控
     */
    range?: boolean | Array<FcProducerRange<T> | FcProductType>;
    /**
     * 数据筛选函数，决定数据是否可被生成，如果range中也存在filter，则会先经过range.filter然后在经过此筛选，都通过后方可生成
     */
    filter?: FcProductFilter<T, FcProductType>;
    /**
     * 代表配置对象是否可变。如果不可变，生产者向系统中注入的监控代码在range配置项的范围内；如果可变，生产者向系统中注入的监控代码将是全范围的
     */
    immutable?: boolean;
}

export interface FcCommonProduct<C = string, G = string> extends FcProduct {
    /** 大类 */
    type: FcProductType;
    /** 小类 */
    category?: C;
    /** 分组 */
    group?: G;
}

export enum FcMethodExecStatus {
    Executed = 1,
    Success = 2,
    Fail = 3,
}

export interface FcResponseProduct<T = any, K = any>
    extends FcRequestProduct<T> {
    status: FcMethodExecStatus;
    endTime?: number;
    response?: K[];
}

export interface FcRequestProduct<T = any> {
    request: T[];
}

export interface FcConsoleProduct
    extends FcCommonProduct<string, string>,
        FcRequestProduct {
    type: FcProductType.Console;
}
