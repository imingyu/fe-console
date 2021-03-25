import { FcMpEvent, FcMpScrollEventDetail, FcMpViewContextBase } from "./mp";

export interface FcMpVirtualListComponentData<
    T extends FcRequireId = FcRequireId
> {
    $vlContainerSelector: string;
    /** 显示的数据*/
    $vlShowList: T[];
    $vlItemStaticHeight?: number;
    /** 起始站位高度*/
    $vlStartPlaceholderHeight: number;
    /** 尾端站位高度*/
    $vlEndPlaceholderHeight: number;
    /** 每页显示多少条数据*/
    $vlPageSize: number;
    $vlTotalCount: number;
    $vlUpdateDelay: number;
    $vlDebug?: boolean;
}

export interface FcMpVirtualListComponent<
    T extends FcRequireId = FcRequireId,
    S = any
> extends FcMpViewContextBase<FcMpVirtualListComponentData<T> & S>,
        FcMpVirtualListComponentMethods<T> {
    $vlContainerHeight?: number;
    $vlContainerHeightComputeing?: boolean;
    $vlContainerHeightComputeQueue?: Function[];
    $vlIsLock?: boolean;
    $vlHasListUpdate?: boolean;
    $vlAllList?: T[];
    $vlOldScrollTop?: number;
    $vlScrollTop?: number;
    $vlSetDataTimer?: any;
    $vlClearing?: boolean;
    $vlComputeShowListTimer?: any;
    $vlItemClientRectQueryMap?: {
        [prop: string]: Function;
    };
    $vlItemHeightMap: {
        [prop: string]: number;
    };
    $vlStartIndex?: number;
    $vlEndIndex?: number;
}

export interface FcRequireId<T = string> {
    id: T;
}

export interface FcMpVirtualListComponentMethods<
    T extends FcRequireId = FcRequireId
> {
    /**初始化虚拟列表*/
    $vlInit(this: FcMpVirtualListComponent<T>);
    /**当滚动发生时*/
    $vlOnScroll(
        this: FcMpVirtualListComponent<T>,
        e: FcMpEvent<FcMpScrollEventDetail>
    );
    /**向虚拟列表中添加数据*/
    $vlAddItem(this: FcMpVirtualListComponent<T>, item: T);
    /**清空虚拟列表中的所有数据*/
    $vlClear(this: FcMpVirtualListComponent<T>);
    /**获取每项高度的函数，如果返回0则代表此项需要动态观察其高度*/
    $vlGetItemHeight?(this: FcMpVirtualListComponent<T>, index: number): number;
    /**计算并生成要显示的列表数据*/
    $vlComputeShowList(this: FcMpVirtualListComponent<T>);
    $vlOnContainerHeightComputed?(this: FcMpVirtualListComponent<T>);
    /**计算容器高度/可视区域高度*/
    $vlComputeContainerHeight(
        this: FcMpVirtualListComponent<T>,
        callback?: Function
    );
    /**当列表发生变化时，执行该函数*/
    $vlListChange(this: FcMpVirtualListComponent<T>);
    /**重新计算容器高度，并计算showList*/
    $vlReload(this: FcMpVirtualListComponent<T>);
    /**锁住列表更新*/
    $vlLock(this: FcMpVirtualListComponent<T>);
    /**解锁列表更新*/
    $vlUnLock(this: FcMpVirtualListComponent<T>);
    /**设置显示列表数据*/
    $vlSetShowList(
        this: FcMpVirtualListComponent<T>,
        startIndex: number,
        endIndex: number
    );
    /**设置某项高度，并触发列表计算*/
    $vlSetItemHeight(
        this: FcMpVirtualListComponent<T>,
        itemId: string,
        height: number
    );
    $vlMergeItem(this: FcMpVirtualListComponent<T>, source: T, target: T): T;
}

export interface FcMpVirtualListComponentSpec<
    T extends FcRequireId = FcRequireId
> {
    data: FcMpVirtualListComponentData<T>;
    methods?: FcMpVirtualListComponentMethods<T>;
}
