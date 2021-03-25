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
    visable?:boolean;
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
}

export interface FcMpMaterialCategoryMap<T> {
    [prop: string]: T[];
}

export interface FcMpApiReaderComponentMethods {
    addMaterial(data: Partial<FcMpApiProduct> & FcRequireId);
    refreshCategory(categoryVal?: string);
    addMaterialToCategory(
        material: Partial<FcMpApiMaterial> & FcRequireId,
        map?: FcMpMaterialCategoryMap<Partial<FcMpApiMaterial> & FcRequireId>
    );
    initMaterialCategoryMap(
        clear?: boolean,
        map?: FcMpMaterialCategoryMap<Partial<FcMpApiMaterial> & FcRequireId>
    );
    syncNormalMaterialToFilter();
    reloadVlList(list: FcMpApiMaterial[]);
    changeCategory(activeCategory: string);
    clearMaterial();
    setDetailMaterial(id?: string, tab?: number);
    filterMaterial(keyword: string);
    appendDataToGrid(material: Partial<FcMpApiMaterial> & FcRequireId);
}

export interface FcMpApiReaderComponent
    extends FcMpViewContextBase<FcMpApiReaderComponentData>,
        FcMpApiReaderComponentMethods {
    filterKeyword?: string;
    dataGridWaitMaterials?: FcMpApiMaterial[];
    materialMark?: {
        [prop: string]: string;
    };
    NormalMaterialCategoryMap?: FcMpMaterialCategoryMap<FcMpApiMaterial>;
    FilterMaterialCategoryMap?: FcMpMaterialCategoryMap<FcMpApiMaterial>;
    $DataGridMain?: FcMpDataGridComponent;
}

export interface FcMpDataGridComponentData {
    columns: FcDataGridCol[];
    columnWidthMap: {
        [prop: string]: number;
    };
    affixList?: FcMpApiMaterial[];
}
export interface FcMpDataGridComponentMethods {
    computeAffixList();
    computeColWidth();
    fireCellEvent(name: string, e: FcMpEvent);
}
export interface FcMpDataGridComponent
    extends FcMpVirtualListComponent<
            FcMpApiMaterial,
            FcMpDataGridComponentData
        >,
        FcMpDataGridComponentMethods {
    computeColWidthTimer?: any;
}
