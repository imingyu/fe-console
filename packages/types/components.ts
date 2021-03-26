import {
    FcMpApiCategoryInfo,
    FcMpApiProduct,
    FcMpEvent,
    FcMpViewContextBase,
} from "./mp";
import { FcMpApiMaterial } from "./reader";
import { FcMpVirtualListComponent, FcRequireId } from "./virtual-list";

export interface FcDataGridCol {
    field: string;
    title: string;
    /**是否显示 */
    visable?: boolean;
    /**是否可换行 */
    wrap?: boolean;
    subTitle?: string;
    width?: number; // 只接受%单位
}

export interface FcMpComponentPropObserver<
    T extends FcMpViewContextBase = FcMpViewContextBase,
    S = any
> {
    (this: FcMpViewContextBase & T, newVal: S, oldVal: S);
}
export interface FcMpComponentPropSpec<
    T extends FcMpViewContextBase = FcMpViewContextBase,
    S = any
> {
    type: Function | null;
    value?: S;
    observer?: FcMpComponentPropObserver<T, S>;
}
export interface FcMpComponentMethod<
    T extends FcMpViewContextBase = FcMpViewContextBase
> {
    (this: T, ...args);
}

export interface FcMpComponentMethods<
    T extends FcMpViewContextBase = FcMpViewContextBase
> {
    [prop: string]: FcMpComponentMethod<T>;
}

export interface FcMpComponentDataAny {
    data?: {
        [prop: string]: any;
    };
}

export interface FcMpComponentSpec<
    T extends FcMpViewContextBase = FcMpViewContextBase
> {
    options?: {
        [prop: string]: any;
    };
    data?: {
        [prop: string]: any;
    };
    properties?: {
        [prop: string]: Function | FcMpComponentPropSpec<T>;
    };
    methods?: FcMpComponentMethods<T>;
    created?: FcMpComponentMethod<T>;
    ready?: FcMpComponentMethod<T>;
    attached?: FcMpComponentMethod<T>;
    detached?: FcMpComponentMethod<T>;
    $mixinEnd?: Function;
    deriveDataFromProps?: Function;
}

export interface FcMpApiReaderComponentData {
    categoryList: FcMpApiCategoryInfo[];
    activeCategory: string;
    detailMaterialId: string;
    readerCols: FcDataGridCol[];
    affixIds: string[];
}

export interface FcMpMaterialCategoryMap<T> {
    [prop: string]: T[];
}

export type PartialFcMpApiMaterial = Partial<FcMpApiMaterial> & FcRequireId;
export type PartialFcMpApiProduct = Partial<FcMpApiProduct> & FcRequireId;
export interface FcMpApiReaderComponentMethods {
    addMaterial(this: FcMpApiReaderComponent, data: PartialFcMpApiProduct);
    refreshCategory(this: FcMpApiReaderComponent, categoryVal?: string);
    addMaterialToCategory(
        this: FcMpApiReaderComponent,
        material: PartialFcMpApiMaterial,
        map?: FcMpMaterialCategoryMap<PartialFcMpApiMaterial>
    );
    initMaterialCategoryMap(
        this: FcMpApiReaderComponent,
        clear?: boolean,
        map?: FcMpMaterialCategoryMap<PartialFcMpApiMaterial>
    );
    syncNormalMaterialToFilter(this: FcMpApiReaderComponent);
    reloadVlList(this: FcMpApiReaderComponent, list: PartialFcMpApiMaterial[]);
    changeCategory(this: FcMpApiReaderComponent, activeCategory: string);
    clearMaterial(this: FcMpApiReaderComponent);
    setDetailMaterial(this: FcMpApiReaderComponent, id?: string, tab?: number);
    filterMaterial(this: FcMpApiReaderComponent, keyword: string);
    appendDataToGrid(
        this: FcMpApiReaderComponent,
        material: PartialFcMpApiMaterial
    );
    /**留存记录 */
    keepSaveMaterial(this: FcMpApiReaderComponent, id: string);
    /**取消留存记录，不传ID则代表全部取消 */
    cancelKeepSaveMaterial(this: FcMpApiReaderComponent, id?: string);
    /**标记记录，记录将放置在mark类型下 */
    markMaterial(this: FcMpApiReaderComponent, id: string);
    /**取消标记记录，不传ID则代表全部取消，取消后记录将从mark类型中移除 */
    cancelMarkMaterial(this: FcMpApiReaderComponent, id?: string);
    /**置顶记录，最多置顶3条记录 */
    topMaterial(this: FcMpApiReaderComponent, id: string);
    /**取消置顶记录，不传ID则代表全部取消 */
    cancelTopMaterial(this: FcMpApiReaderComponent, id?: string);
    /**向DataGrid组件同步置顶记录列表 */
    syncAffixList(this: FcMpApiReaderComponent);
}

export interface FcMpApiReaderComponent
    extends FcMpViewContextBase<FcMpApiReaderComponentData>,
        FcMpApiReaderComponentMethods {
    filterKeyword?: string;
    dataGridWaitMaterials?: Array<PartialFcMpApiMaterial>;
    materialExist?: {
        [prop: string]: string;
    };
    NormalMaterialCategoryMap?: FcMpMaterialCategoryMap<PartialFcMpApiMaterial>;
    FilterMaterialCategoryMap?: FcMpMaterialCategoryMap<PartialFcMpApiMaterial>;
    $DataGridMain?: FcMpDataGridComponentExports<PartialFcMpApiMaterial>;
    /**留存记录 */
    keepSaveMaterials?: {
        [prop: string]: number;
    };
    /**标记记录 */
    markMaterials?: {
        [prop: string]: number;
    };
    /**置顶记录ID */
    topMaterials?: string[];
    /**记录分类 */
    materialClassifyMap?: {
        [prop: string]: string[];
    };
}

export interface FcMpDataGridComponentData<
    T extends FcRequireId = FcRequireId
> {
    columns: FcDataGridCol[];
    columnWidthMap: {
        [prop: string]: number;
    };
    affixList?: T[];
    scrollMarginTop?: number;
}
export interface FcMpDataGridComponentMethods<
    T extends FcRequireId = FcRequireId
> {
    computeSelectMap(this: FcMpDataGridComponent<T>);
    computeAffixList(this: FcMpDataGridComponent<T>);
    computeColWidth(this: FcMpDataGridComponent<T>);
    fireCellEvent(this: FcMpDataGridComponent<T>, name: string, e: FcMpEvent);
}
export interface FcMpDataGridComponent<T extends FcRequireId = FcRequireId>
    extends FcMpVirtualListComponent<T, FcMpDataGridComponentData<T>>,
        FcMpDataGridComponentMethods<T> {
    computeSelectMapTimer?: any;
    computeColWidthTimer?: any;
    computeAffixAllListTimer?: any;
    affixAllList?: T[];
    affixItemHeightMap?: {
        [prop: string]: number;
    };
}

export interface FcMpDataGridComponentExports<
    T extends FcRequireId = FcRequireId
> extends Required<FcMpComponentId> {
    addItem(item: T);
    replaceAllList(list: T[]);
    reloadAffixList(allList?: T[]);
}

export interface FcMpComponentId {
    tid?: string;
    cid?: string;
    tidAlias?: string;
}

export interface FcMpDispatchEventData<
    T extends FcMpComponentId = FcMpComponentId,
    S = any
> {
    child: T;
    root: T;
    type: string;
    data?: S;
}
