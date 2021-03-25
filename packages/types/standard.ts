export interface FcWindowSize {
    /**窗口宽度*/
    windowWidth: number;
    /**窗口高度*/
    windowHeight: number;
}

export interface FcStandardCallback<T = any> {
    (res: T);
}

export interface FcStandardRequestOptions {
    url: string;
    method: string;
    data?: any;
    header: {
        [prop: string]: string | number;
    };
    dataType?: string;
}
export interface FcStandardRequestResponse<T = any> {
    data?: T;
    statusCode: number;
    header?: {
        [prop: string]: string | number;
    };
    cookies?: string[];
}

export interface FcStandardToastOptions {
    title: string;
    duration?: number;
    mask?: boolean;
}

export interface FcClientRect {
    width: number;
    height: number;
    top: number;
    left: number;
}

export interface FcActionSheetOptions {
    items: string[];
}

/**跨平台Api对象*/
export interface Fc {
    /**窗口尺寸变化事件的回调函数*/
    onWindowResize(callback: FcStandardCallback<FcWindowSize>);
    /**取消监听窗口尺寸变化事件*/
    offWindowResize(callback: FcStandardCallback<FcWindowSize>);
    // /**发起 HTTP 网络请求*/
    // request<T = any>(
    //     options: FcStandardRequestOptions
    // ): Promise<FcStandardRequestResponse<T>>;
    /**显示消息提示框*/
    showToast(title: string | FcStandardToastOptions);
    /**返回元素的大小及其相对于视口的位置*/
    getBoundingClientRect<T = string>(
        /**选择器或者元素本身*/
        selector: T,
        /**小程序平台时，此参数必选*/
        ctx?: any
    ): Promise<FcClientRect>;
    /**显示操作菜单*/
    showActionSheet(options: string[] | FcActionSheetOptions): Promise<number>;
}
