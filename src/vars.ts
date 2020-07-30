import { Storage } from "./storage";
import { DataViewLike } from "./viewer";

export enum MpViewType {
    App = "App",
    Page = "Page",
    Component = "Component",
}
export enum MpPlatfrom {
    wechat = "wechat",
    alipay = "alipay",
    smart = "smart",
    tiktok = "tiktok",
    unknown = "unknown",
}
export interface ApiHandler {
    (res: any);
}
export interface ApiOptions {
    success: ApiHandler;
    fail: ApiHandler;
}
export interface MpViewSpec {
    data: any;
}
export interface MpViewComponetPropSpec {
    type: Function;
    default?: any;
    observer?: Function;
}
export interface MpViewComponentSpec extends MpViewSpec {
    properties?: {
        [prop: string]: Function | MpViewComponetPropSpec;
    };
    methods: {
        [prop: string]: Function;
    };
}
export interface MpViewLike {
    $viewSpec: MpViewSpec;
    $viewType: MpViewType;
    $mpcId: string;
    $mpcStorage: Storage;
    $mpcInitState: boolean;
    $isRewriteSetData?: boolean;
    $nativeSetData: SetDataHandler;
    data: any;
    setData: SetDataHandler;
}
export interface MpWechatSelectOwnerComponent {
    (): void | MpViewLike;
}
export interface MpWechatView extends MpViewLike {
    __wxExparserNodeId__: string;
    __wxWebviewId__: number;
    is: string;
    selectOwnerComponent: MpWechatSelectOwnerComponent;
}
export interface MpTiktokView extends MpViewLike {
    __webviewId__: number;
    __nodeId__: number;
    is: string;
}
export interface MpComponentPropObserver {
    (this: MpViewLike, oldValue: any, newVal: any): void;
}

export interface MpComponentPropSpec {
    type: Function;
    default: any;
    observer: MpComponentPropObserver;
}

export interface MpAlipayView extends MpViewLike {
    $id: number;
}

export interface MpAlipayViewPage extends MpAlipayView {
    $viewId: string;
    route: string;
}
export interface MpAlipayViewComponent extends MpAlipayView {
    $page: MpAlipayViewPage;
    is: string;
    props: {
        [prop: string]: any;
        __tag: string;
    };
}
export interface MpSmartViewPage extends MpViewLike {
    route: string;
}
export interface MpSmartViewComponent extends MpViewLike {
    componentName: string;
    nodeId: string;
    pageinstance: MpSmartViewPage;
    is: string;
}
export interface SetDataHandler {
    (data: any, callback?: Function): void;
}

export interface MpViewElementSpec {
    key: string;
    tag: string;
    is: string;
    active?: boolean;
    open?: boolean;
    openable?: boolean;
    view: MpViewLike;
    attrs?: DataViewLike[];
    events?: {
        [prop: string]: string;
    };
    children?: MpViewElementSpec[];
}
