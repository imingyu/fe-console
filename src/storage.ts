import { uuid } from "./util";

export const enum StorageType {
    NETWORK,
    API,
    VIEW,
    CONSOLE,
}

type StorageMap = {
    [prop in StorageType]: StorageQueueItem[];
};
type IDMap = {
    [prop: string]: StorageQueueItem[];
};
type StorageQueueItem = {
    id?: string;
    type?: StorageType;
    data: any;
    time: number;
};

export class Storage {
    private queue: StorageQueueItem[] = [];
    private map: StorageMap = {
        [StorageType.NETWORK]: [],
        [StorageType.API]: [],
        [StorageType.VIEW]: [],
        [StorageType.CONSOLE]: [],
    } as StorageMap;
    private idMap: IDMap = {};
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
        this.idMap[id].push({
            data,
            time,
        });
    }
}
