import {
    FecStorageLike,
    FecStorageData,
    FecStorageDataLike,
    FecStorageType,
    FecStorageFinder,
    FecStorageApiData,
    MpHasTaskApi,
} from "@fe-console/types";
import { EventEmitter } from "@mpkit/ebus";
import { MkEnumMap, MkMap } from "@mpkit/types";
import { uuid } from "@mpkit/util";
export default class FecStorage extends EventEmitter implements FecStorageLike {
    private dataMap: MkEnumMap<FecStorageType, FecStorageData[]>;
    private idMap: MkMap<FecStorageData>;
    private apiTaskMap: MkEnumMap<MpHasTaskApi, MkMap<FecStorageApiData>>;
    constructor() {
        super();
        this.idMap = {} as MkMap<FecStorageData>;
        this.apiTaskMap = {} as MkEnumMap<
            MpHasTaskApi,
            MkMap<FecStorageApiData>
        >;
        this.dataMap = {} as MkEnumMap<FecStorageType, FecStorageData[]>;
        for (let prop in FecStorageType) {
            this.dataMap[prop] = [];
        }
        for (let prop in MpHasTaskApi) {
            this.apiTaskMap[prop] = {};
        }
    }
    push(data: FecStorageDataLike) {
        if (!data.id) {
            data.id = uuid();
        }
        if (!data.time) {
            data.time = Date.now();
        }
        this.dataMap[data.type].push(data as FecStorageData);
        this.emit(`Push.${data.type}`, data);
    }
    pushApiTask(apiData: FecStorageApiData) {
        this.apiTaskMap[apiData.name][apiData.id] = apiData;
        this.emit(`Push.ApiTask`, apiData);
    }
    removeApiTask(apiName: MpHasTaskApi, dataId: string) {
        const map = this.apiTaskMap[apiName];
        if (map) {
            const apiData = map[dataId];
            delete map[dataId];
            this.emit(`Remove.ApiTask`, apiData);
        }
    }
    getApiTaskMap(apiName: MpHasTaskApi): MkMap<FecStorageApiData> {
        return this.apiTaskMap[apiName];
    }
    get(id: string) {
        return this.idMap[id];
    }
    getAll(): FecStorageData[] {
        return Object.keys(this.dataMap).reduce((sum, item) => {
            return sum.concat(this.dataMap[item]);
        }, []);
    }
    getType(type: FecStorageType): FecStorageData[] {
        return this.dataMap[type];
    }
    findType(
        type: FecStorageType,
        finder: FecStorageFinder<FecStorageData>
    ): FecStorageData {
        return this.dataMap[type].find(finder);
    }
    filterType(
        type: FecStorageType,
        finder: FecStorageFinder<FecStorageData>
    ): FecStorageData[] {
        return this.dataMap[type].filter(finder);
    }
}
