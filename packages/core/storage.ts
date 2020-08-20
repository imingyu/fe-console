import {
    MpcStorageLike,
    MpcStorageData,
    MpcStorageDataLike,
    MpcStorageType,
    MpcStorageFinder,
    MpcStorageApiData,
    MpcHasTaskApi,
} from "@mp-console/types";
import { EventEmitter } from "@mpkit/ebus";
import { MkEnumMap, MkMap } from "@mpkit/types";
import { uuid } from "@mpkit/util";
export default class MpcStorage extends EventEmitter implements MpcStorageLike {
    private dataMap: MkEnumMap<MpcStorageType, MpcStorageData[]>;
    private idMap: MkMap<MpcStorageData>;
    private apiTaskMap: MkEnumMap<MpcHasTaskApi, MkMap<MpcStorageApiData>>;
    constructor() {
        super();
        this.idMap = {} as MkMap<MpcStorageData>;
        this.apiTaskMap = {} as MkEnumMap<
            MpcHasTaskApi,
            MkMap<MpcStorageApiData>
        >;
        this.dataMap = {} as MkEnumMap<MpcStorageType, MpcStorageData[]>;
        for (let prop in MpcStorageType) {
            this.dataMap[prop] = [];
        }
        for (let prop in MpcHasTaskApi) {
            this.apiTaskMap[prop] = {};
        }
    }
    push(data: MpcStorageDataLike) {
        if (!data.id) {
            data.id = uuid();
        }
        if (!data.time) {
            data.time = Date.now();
        }
        this.dataMap[data.type].push(data as MpcStorageData);
        this.emit(`Push${data.type}`, data);
    }
    pushApiTask(apiData: MpcStorageApiData) {
        this.apiTaskMap[apiData.name][apiData.id] = apiData;
    }
    removeApiTask(apiName: MpcHasTaskApi, dataId: string) {
        const map = this.apiTaskMap[apiName];
        if (map) {
            delete map[dataId];
        }
    }

    getApiTaskMap(apiName: MpcHasTaskApi): MkMap<MpcStorageApiData> {
        return this.apiTaskMap[apiName];
    }
    get(id: string) {
        return this.idMap[id];
    }
    getAll(): MpcStorageData[] {
        return Object.keys(this.dataMap).reduce((sum, item) => {
            return sum.concat(this.dataMap[item]);
        }, []);
    }
    getType(type: MpcStorageType): MpcStorageData[] {
        return this.dataMap[type];
    }
    findType(
        type: MpcStorageType,
        finder: MpcStorageFinder<MpcStorageData>
    ): MpcStorageData {
        return this.dataMap[type].find(finder);
    }
    filterType(
        type: MpcStorageType,
        finder: MpcStorageFinder<MpcStorageData>
    ): MpcStorageData[] {
        return this.dataMap[type].filter(finder);
    }
}
