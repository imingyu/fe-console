import {
    uuid,
    IMap,
    each,
    getMpComponentPageNativeViewId,
    getMpNativeViewId,
    getMpViewElementSpec,
} from "./util";
import { getDataView, DataView, DataViewType } from "./viewer";
import { MpViewLike, MpViewElementSpec, MpViewType } from "./vars";

export const enum StorageType {
    NETWORK,
    API,
    VIEW,
    CONSOLE,
    EVENT,
}

type StorageMap = {
    [prop in StorageType]: StorageQueueItem[];
};
type StorageQueueItem = {
    id?: string;
    type?: StorageType;
    data: StorageQueueData;
    time: number;
};
type StorageQueueData = {
    name?: string;
    label?: string;
    args?: any[];
    view?: any;
    method?: string;
    category?: string;
    response?: any;
    result?: any;
};
export enum NetWorkType {
    xhr,
    downloadFile,
    uploadFile,
    webSocket,
}
type NetWorkDataItem = {
    detail: StorageQueueItem;
    urlPath: string;
    urlOrigin: string;
    statusCode: number;
    statusText: string;
    type: NetWorkType;
    requestSize: number;
    requestSizeText: number;
    responseSize: number;
    responseSizeText: number;
    totalTime: string;
    request: object;
    response: object;
};

export enum ConsoleMethod {
    log,
    dir,
    error,
    warn,
    info,
}
interface ConsoleDataItem {
    method: ConsoleMethod;
    views: DataView[];
}

export class Storage {
    private queue: StorageQueueItem[] = [];
    private map: StorageMap = {
        [StorageType.NETWORK]: [],
        [StorageType.API]: [],
        [StorageType.VIEW]: [],
        [StorageType.CONSOLE]: [],
        [StorageType.EVENT]: [],
    } as StorageMap;
    private idMap: IMap<string, StorageQueueItem[]> = {} as IMap<
        string,
        StorageQueueItem[]
    >;
    private nativeViewIdMap: IMap<string, MpViewLike> = {} as IMap<
        string,
        MpViewLike
    >;
    private nativePageComponentsMap: IMap<string, MpViewLike[]> = {} as IMap<
        string,
        MpViewLike[]
    >;
    private viewIdMap: IMap<string, MpViewLike> = {} as IMap<
        string,
        MpViewLike
    >;
    private dataStatusChangeHandlers = {};
    private arrShowItemCount: number;
    private objectShowKeysCount: number;
    private maxArrShowItemCount: number;
    private maxObjectShowKeysCount: number;
    private dataViewMap: IMap<string, DataView> = {} as IMap<string, DataView>;
    constructor(
        maxArrShowItemCount: number = 10,
        maxObjectShowKeysCount: number = 5
    ) {
        this.maxArrShowItemCount = maxArrShowItemCount;
        this.maxObjectShowKeysCount = maxObjectShowKeysCount;
    }
    push(type: StorageType, data: any, id: string = uuid()) {
        const time = Date.now();
        this.queue.push({
            id,
            type,
            data,
            time,
        });
        this.map[type].push({
            id,
            data,
            time,
        });
        if (!this.idMap[id]) {
            this.idMap[id] = [];
        }
        this.idMap[id].push({
            data,
            time,
        });
        if (
            type === StorageType.VIEW &&
            data.view &&
            !this.viewIdMap[data.view.$mpcId]
        ) {
            const mpView: MpViewLike = data.view as MpViewLike;
            if (mpView.$viewType === "Component") {
                const pageId = getMpComponentPageNativeViewId(data.view);
                if (pageId) {
                    if (!this.nativePageComponentsMap[pageId]) {
                        this.nativePageComponentsMap[pageId] = [];
                    }
                    this.nativePageComponentsMap[pageId].push(data.view);
                }
            }
            this.nativeViewIdMap[
                getMpNativeViewId(mpView, mpView.$viewType)
            ] = this.viewIdMap[mpView.$mpcId] = mpView;
        }
        if (this.dataStatusChangeHandlers[id]) {
            this.dataStatusChangeHandlers[id].forEach((item) => {
                item[1](id, type, data, time);
            });
        }
        if (this.dataStatusChangeHandlers["all"]) {
            this.dataStatusChangeHandlers["all"].forEach((item) => {
                item[1](id, type, data, time);
            });
        }
    }
    onDataStatusChange(id: string, handler: Function, handlerName: string) {
        if (!this.dataStatusChangeHandlers[id]) {
            this.dataStatusChangeHandlers[id] = [];
        }
        if (
            !this.dataStatusChangeHandlers[id].some(
                (item) => item[0] === handlerName
            )
        ) {
        } else {
            this.dataStatusChangeHandlers[id].push([handlerName, handler]);
        }
    }
    offDataStatusChange(id: string, handlerName: string) {
        if (this.dataStatusChangeHandlers[id]) {
            const index = this.dataStatusChangeHandlers[id].findIndex(
                (item) => item[0] === handlerName
            );
            index >= 0 && this.dataStatusChangeHandlers[id].splice(index, 1);
        }
    }
    // 分页获取数据
    getPageList(pageIndex: number, type?: StorageType, pageSize: number = 30) {
        const allList = type ? this.map[type] : this.queue;
        const pageCount = Math.ceil(allList.length / pageSize);
        if (pageIndex >= pageCount) {
            return [];
        }
        return this.convertList(
            allList.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
            type
        );
    }
    getMpViewDetail(mpcId: string): MpViewLike {
        return this.viewIdMap[mpcId];
    }
    getMpViewChildrenSpec(mpcId: string): MpViewElementSpec[] {
        const children = [] as MpViewElementSpec[];

        if (mpcId === "app") {
            const activePages = getCurrentPages() as MpViewLike[];
            const unactivePage: MpViewLike[] = [];
            each<MpViewLike>(this.viewIdMap, (view, id) => {
                if (
                    view.$viewType === "Page" &&
                    activePages.every((item) => item.$mpcId !== view.$mpcId)
                ) {
                    unactivePage.push(view);
                }
            });
            [
                [true, activePages],
                [false, unactivePage],
            ].forEach(([isActive, pages]) => {
                const tsPages = pages as MpViewLike[];
                tsPages.forEach((page) => {
                    const pageSpec = getMpViewElementSpec(
                        page,
                        MpViewType.Page
                    );
                    pageSpec.active = isActive as boolean;
                    children.push(pageSpec);
                });
            });
        } else if (this.viewIdMap[mpcId]) {
            const view = this.viewIdMap[mpcId];
            if (view.$viewType === MpViewType.Page) {
            }
        }
        return children;
    }
    getMpViewElementSpec(mpcId: string): MpViewElementSpec {
        const view: MpViewLike = this.getMpViewDetail(mpcId);
        return getMpViewElementSpec(view, view.$viewType);
    }
    getItems(type: StorageType) {
        if (type === StorageType.VIEW) {
            const app = getApp() as MpViewLike;
            const activePages = getCurrentPages() as MpViewLike[];
            const unactivePage: MpViewLike[] = [];
            each<MpViewLike>(this.viewIdMap, (view, id) => {
                if (
                    view.$viewType === "Page" &&
                    activePages.every((item) => item.$mpcId !== view.$mpcId)
                ) {
                    unactivePage.push(view);
                }
            });
            const appViewSpec: MpViewElementSpec = getMpViewElementSpec(
                app,
                MpViewType.App
            );
            return appViewSpec;
        }
    }
    convertList(
        list: StorageQueueItem[],
        type?: StorageType
    ): ConsoleDataItem[] | NetWorkDataItem[] {
        if (type === StorageType.NETWORK) {
            const result: NetWorkDataItem[] = [];
            list.forEach((item) => {});
        } else if (type === StorageType.CONSOLE) {
            const result: ConsoleDataItem[] = [];
            list.forEach((item) => {
                result.push({
                    method: ConsoleMethod[item.data && item.data.name],
                    views:
                        item.data &&
                        item.data.args &&
                        item.data.args.reduce((sum, arg) => {
                            const dtResult = getDataView(arg, {
                                convertBr: typeof arg === "string",
                                maxArrShowItemCount: this.maxArrShowItemCount,
                                arrShowItemCount: this.arrShowItemCount,
                                maxObjectShowKeysCount: this
                                    .maxObjectShowKeysCount,
                                objectShowKeysCount: this.objectShowKeysCount,
                            });
                            return sum;
                        }, []),
                });
            });
            return result;
        }
    }
}
