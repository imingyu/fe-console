import { MpView, EBus, MkMap } from "@mpkit/types";
export enum MpcStorageType {
    Api = "Api",
    View = "View",
    Method = "Method",
    Console = "Console",
    Event = "Event",
}
export interface MpcStorageDataLike {
    id?: string;
    type: MpcStorageType;
    time?: number;
}
export interface MpcStorageData extends MpcStorageDataLike {
    id: string;
    time: number;
}
interface MethodData extends MpcStorageData {
    name: string;
    args: any[];
    result?: any;
    status: MpcMethodStatus;
    endTime?: number;
    error?: Error;
    errorType?: string;
}
export interface MpcStorageMethodData extends MethodData {
    view: MpView;
}
export interface MpcStorageViewData extends MpcStorageData {
    view: MpView;
}
export enum MpcMethodStatus {
    Executed = "Executed",
    Success = "Success",
    Fail = "Fail",
}
export enum MpcHasTaskApi {
    request = "request",
    downloadFile = "downloadFile",
    uploadFile = "uploadFile",
    connectSocket = "connectSocket",
    createUDPSocket = "createUDPSocket",
}
export interface MpcStorageApiData extends MethodData {
    response?: any;
    children?: MpcStorageApiData[];
}
export interface MpcEventTarget {
    dataset: any;
}
export interface MpcEvent {
    type: string;
    target: MpcEventTarget;
    currentTarget: MpcEventTarget;
    detail: any;
}
export interface MpcStorageEventData extends MpcStorageData {
    name: string;
    args: any[];
    event: MpcEvent;
    triggerView: MpView;
    handleView: MpView;
}
export interface MpcStorageConsoleData extends MpcStorageData {
    args: any[];
}
export interface MpcStorageFinder<T> {
    (item: T, index: number, arr: T[]): boolean;
}

export interface MpcStorageLike extends EBus {
    push(data: MpcStorageDataLike);
    pushApiTask(apiData: MpcStorageApiData);
    removeApiTask(apiName: MpcHasTaskApi, dataId: string);
    getApiTaskMap(apiName: MpcHasTaskApi): MkMap<MpcStorageApiData>;
    get(id: string): MpcStorageData;
    getAll(): MpcStorageData[];
    getType(type: MpcStorageType): MpcStorageData[];
    findType(
        type: MpcStorageType,
        finder: MpcStorageFinder<MpcStorageData>
    ): null | MpcStorageData;
    filterType(
        type: MpcStorageType,
        finder: MpcStorageFinder<MpcStorageData>
    ): MpcStorageData[];
}
