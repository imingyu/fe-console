import { MpViewType } from "@mpkit/types";
import {
    FcMpVirtualListComponentData,
    FcMpVirtualListComponentMethods,
    FcMpVirtualListComponentSpec,
    FcRequireId,
} from "@fe-console/types";
import { getMpInitLifeName, isEmptyObject } from "@mpkit/util";
export const createVirtualListMixin = <T extends FcRequireId = FcRequireId>(
    type: MpViewType
): FcMpVirtualListComponentSpec<T> => {
    const methods: FcMpVirtualListComponentMethods<T> = {
        $vlReload() {
            this.$vlComputeContainerHeight(() => {
                this.$vlComputeShowList();
            });
        },
        $vlInit() {
            if (!this.$vlScrollTop) {
                this.$vlScrollTop = this.$vlOldScrollTop = 0;
            }
            if (!this.$vlAllList) {
                this.$vlAllList = [];
            }
            delete this.$vlContainerHeightComputeing;
            delete this.$vlContainerHeightComputeQueue;
            this.setData({
                $vlShowList: [],
                $vlStartPlaceholderHeight: 0,
                $vlEndPlaceholderHeight: 0,
            });
            this.$vlSetShowList(0, this.data.$vlPageSize);
            this.$vlReload();
        },
        $vlOnScroll(e) {
            if (this.$vlClearing) {
                return;
            }
            const { scrollTop } = e.detail;
            this.$vlOldScrollTop = this.$vlScrollTop;
            this.$vlScrollTop = scrollTop;
            this.$vlComputeShowList();
        },
        $vlAddItem(item) {
            if (!this.$vlAllList) {
                this.$vlAllList = [];
            }
            const readyItem = this.$vlAllList.find((it) => it.id === item.id);
            if (readyItem) {
                Object.assign(readyItem, item);
            } else {
                this.$vlAllList.push(item);
            }
            const readyShowIndex = this.data.$vlShowList.findIndex(
                (it) => it.id === item.id
            );
            if (readyShowIndex !== -1) {
                this.$vlLock();
                this.setData(
                    {
                        [`$vlShowList[${readyShowIndex}]`]: this.$vlMergeItem(
                            this.data.$vlShowList[readyShowIndex],
                            readyItem
                        ),
                    },
                    () => {
                        this.$vlUnLock();
                    }
                );
                return this.$vlListChange();
            }
            this.$vlListChange();
        },
        $vlListChange() {
            this.setData({
                $vlTotalCount: this.$vlAllList.length,
            });
            this.$vlComputeShowList();
        },
        $vlClear() {
            this.$vlClearing = true;
            if (this.$vlSetDataTimer) {
                clearTimeout(this.$vlSetDataTimer);
                delete this.$vlSetDataTimer;
            }
            if (this.$vlComputeShowListTimer) {
                clearTimeout(this.$vlComputeShowListTimer);
                delete this.$vlComputeShowListTimer;
            }
            delete this.$vlItemClientRectQueryMap;
            this.$vlScrollTop = 0;
            this.$vlOldScrollTop = 0;
            delete this.$vlAllList;
            delete this.$vlItemHeightMap;
            delete this.$vlContainerHeightComputeing;
            delete this.$vlContainerHeightComputeQueue;
            this.setData(
                {
                    $vlTotalCount: 0,
                    $vlShowList: [],
                    $vlStartPlaceholderHeight: 0,
                    $vlEndPlaceholderHeight: 0,
                },
                () => {
                    delete this.$vlClearing;
                }
            );
        },
        $vlComputeContainerHeight(callback) {
            if (this.$vlContainerHeightComputeing) {
                this.$vlContainerHeightComputeQueue.push(callback);
                return;
            }
            this.$vlContainerHeightComputeing = true;
            this.$vlContainerHeightComputeQueue = [];
            this.$fc
                .getBoundingClientRect(this.data.$vlContainerSelector, this)
                .then((res) => {
                    this.$vlContainerHeight = res.height;
                    this.$vlOnContainerHeightComputed &&
                        this.$vlOnContainerHeightComputed();
                    callback && callback(res.height);
                    if (!this.$vlContainerHeightComputeing) {
                        return;
                    }
                    delete this.$vlContainerHeightComputeing;
                    if (
                        this.$vlContainerHeightComputeQueue &&
                        this.$vlContainerHeightComputeQueue.length
                    ) {
                        const last = this.$vlContainerHeightComputeQueue.pop();
                        this.$vlContainerHeightComputeQueue.forEach((item) => {
                            item && item(res.height);
                        });
                        this.$vlComputeContainerHeight(last);
                    }
                });
        },
        $vlComputeShowList() {
            if (this.$vlIsLock) {
                this.$vlHasListUpdate = true;
                return;
            }
            if (this.$vlComputeShowListTimer) {
                clearTimeout(this.$vlComputeShowListTimer);
            }
            this.$vlComputeShowListTimer = setTimeout(() => {
                const vlGetItemHeight = this.$vlGetItemHeight
                    ? this.$vlGetItemHeight.bind(this)
                    : (index) => {};
                let firstIntersectIndex = -1;
                let visableHeight = 0;
                let lastIntersectIndex = -1;
                let top = 0;
                if (!this.$vlItemHeightMap) {
                    this.$vlItemHeightMap = {};
                }
                this.$vlAllList.forEach((item, index) => {
                    (item as any).$vlIndex = index;
                    if (
                        !this.data.$vlItemStaticHeight ||
                        typeof this.data.$vlItemStaticHeight !== "number"
                    ) {
                        this.$vlItemHeightMap[item.id] =
                            vlGetItemHeight(index) ||
                            this.$vlItemHeightMap[item.id] ||
                            0;
                    } else {
                        this.$vlItemHeightMap[
                            item.id
                        ] = this.data.$vlItemStaticHeight;
                    }
                    top += this.$vlItemHeightMap[item.id];
                    if (top >= this.$vlScrollTop) {
                        if (firstIntersectIndex === -1) {
                            firstIntersectIndex = index;
                        }
                        if (
                            firstIntersectIndex !== -1 &&
                            lastIntersectIndex === -1
                        ) {
                            visableHeight += this.$vlItemHeightMap[item.id];
                        }
                        if (
                            visableHeight >= this.$vlContainerHeight &&
                            lastIntersectIndex === -1
                        ) {
                            lastIntersectIndex = index;
                        }
                    }
                });
                const oldStart = this.$vlStartIndex;
                const oldEnd = this.$vlEndIndex;
                let newStart = oldStart;
                let newEnd = oldEnd;
                if (
                    oldStart === 0 &&
                    this.data.$vlShowList.length < this.data.$vlPageSize &&
                    this.$vlAllList.length < this.data.$vlPageSize &&
                    this.data.$vlShowList.length !== this.$vlAllList.length
                ) {
                    newEnd = newStart + this.data.$vlPageSize;
                    newEnd =
                        newEnd <= this.$vlAllList.length
                            ? newEnd
                            : this.$vlAllList.length;
                } else if (
                    lastIntersectIndex !== -1 &&
                    firstIntersectIndex !== -1
                ) {
                    const sizeOneThird = Math.floor(this.data.$vlPageSize / 3);
                    const downSet = () => {
                        if (lastIntersectIndex >= oldEnd - sizeOneThird) {
                            newStart = firstIntersectIndex - 2;
                            newStart = newStart < 0 ? 0 : newStart;
                            newEnd = newStart + this.data.$vlPageSize;
                            newEnd =
                                newEnd < this.$vlAllList.length
                                    ? newEnd
                                    : this.$vlAllList.length;
                        }
                    };
                    if (this.$vlScrollTop < this.$vlOldScrollTop) {
                        if (firstIntersectIndex <= oldStart + sizeOneThird) {
                            newEnd = lastIntersectIndex + 2;
                            newEnd =
                                newEnd <= this.$vlAllList.length
                                    ? newEnd
                                    : this.$vlAllList.length;
                            newStart = newEnd - this.data.$vlPageSize;
                            newStart = newStart < 0 ? 0 : newStart;
                            newEnd =
                                newEnd - newStart !== this.data.$vlPageSize
                                    ? newStart + this.data.$vlPageSize
                                    : newEnd;
                        } else {
                            downSet();
                        }
                    } else {
                        downSet();
                    }
                    if (newStart < 0) {
                        newStart = 0;
                    }
                }
                this.$vlSetShowList(newStart, newEnd);
            }, this.data.$vlUpdateDelay);
        },
        $vlLock() {
            this.$vlIsLock = true;
        },
        $vlUnLock() {
            delete this.$vlIsLock;
            if (this.$vlHasListUpdate) {
                delete this.$vlHasListUpdate;
                this.$vlComputeShowList();
            }
        },
        $vlMergeItem(source: T, target: T): T {
            const res: T = {
                id: target.id,
            } as T;
            Object.keys(target).forEach((key) => {
                if (key in target) {
                    res[key] =
                        typeof target[key] === "undefined" ? null : target[key];
                }
            });
            if (source) {
                Object.keys(source).forEach((key) => {
                    if (!(key in res)) {
                        res[key] = null;
                    }
                });
            }
            return res;
        },
        $vlSetShowList(startIndex, endIndex) {
            this.$vlLock();
            this.$vlStartIndex =
                startIndex < 0
                    ? 0
                    : startIndex < this.$vlAllList.length
                    ? startIndex
                    : this.$vlAllList.length
                    ? this.$vlAllList.length - 1
                    : 0;
            this.$vlEndIndex =
                endIndex < 0 || endIndex > this.$vlAllList.length
                    ? this.$vlAllList.length
                    : endIndex;
            if (
                this.$vlEndIndex - this.$vlStartIndex < this.data.$vlPageSize &&
                this.$vlAllList.length < this.data.$vlPageSize
            ) {
                this.$vlStartIndex = 0;
                this.$vlEndIndex = this.$vlAllList.length;
            }
            let startHeight = 0;
            let endHeight = 0;
            let list = [];
            this.$vlAllList.forEach((item, index) => {
                if (index < this.$vlStartIndex) {
                    startHeight += this.$vlItemHeightMap[item.id] || 0;
                } else if (
                    index >= this.$vlStartIndex &&
                    index < this.$vlEndIndex
                ) {
                    list.push(item);
                } else {
                    endHeight += this.$vlItemHeightMap[item.id] || 0;
                }
            });
            const renderData: Partial<FcMpVirtualListComponentData> = {};
            const renderCallbacks = [];
            if (this.data.$vlStartPlaceholderHeight !== startHeight) {
                renderData.$vlStartPlaceholderHeight = startHeight;
            }
            if (this.data.$vlEndPlaceholderHeight !== endHeight) {
                renderData.$vlEndPlaceholderHeight = endHeight;
            }
            if (!this.$vlItemClientRectQueryMap) {
                this.$vlItemClientRectQueryMap = {};
            }
            const mergeList = [];
            list.forEach((item, index) => {
                if (!this.$vlItemClientRectQueryMap[item.id]) {
                    this.$vlItemClientRectQueryMap[item.id] = () => {
                        return new Promise<void>((resolve) => {
                            if (
                                !this.$vlItemClientRectQueryMap ||
                                !this.$vlItemClientRectQueryMap[item.id]
                            ) {
                                return resolve();
                            }
                            this.$fc
                                .getBoundingClientRect(
                                    `.vl-item-${item.id}`,
                                    this
                                )
                                .then((res) => {
                                    if (
                                        !this.$vlItemClientRectQueryMap ||
                                        !this.$vlItemClientRectQueryMap[item.id]
                                    ) {
                                        return resolve();
                                    }
                                    this.$vlSetItemHeight(item.id, res.height);
                                    return resolve();
                                })
                                .catch(() => {
                                    resolve();
                                });
                        });
                    };
                    renderCallbacks.push(
                        this.$vlItemClientRectQueryMap[item.id]
                    );
                }
                mergeList.push(
                    this.$vlMergeItem(this.data.$vlShowList[index], item)
                );
            });
            renderData.$vlShowList = mergeList;
            if (!isEmptyObject(renderData)) {
                this.setData(renderData, () => {
                    Promise.all(renderCallbacks.map((item) => item())).then(
                        () => {
                            setTimeout(() => {
                                this.$vlUnLock();
                            });
                        }
                    );
                });
            } else if (renderCallbacks.length) {
                Promise.all(renderCallbacks.map((item) => item())).then(() => {
                    setTimeout(() => {
                        this.$vlUnLock();
                    });
                });
            } else {
                setTimeout(() => {
                    this.$vlUnLock();
                });
            }
        },
        $vlSetItemHeight(itemId: string, height: number) {
            if (!this.$vlItemHeightMap) {
                this.$vlItemHeightMap = {};
            }
            this.$vlItemHeightMap[itemId] = height;
            this.$vlComputeShowList();
        },
    };
    const destoryLife =
        type === MpViewType.Component
            ? '<%= (platform==="alipay"?"didUnmount":"detached") %>'
            : "onUnload";
    const mixin: FcMpVirtualListComponentSpec<T> = {
        data: {
            $vlContainerSelector: ".vl-scroller",
            $vlTotalCount: 0,
            $vlShowList: [],
            $vlStartPlaceholderHeight: 0,
            $vlEndPlaceholderHeight: 0,
            $vlPageSize: 10,
            $vlUpdateDelay: 0,
        },
    };
    if (type === MpViewType.Component) {
        mixin.methods = methods;
    } else {
        Object.assign(mixin, methods);
    }
    mixin[getMpInitLifeName(type)] = function () {
        this.$fcOn("FcConatinerSizeChange", () => {
            this.$vlReload();
        });
    };
    if (type !== MpViewType.App) {
        mixin[destoryLife] = function () {
            this.$vlClear();
        };
    }
    return mixin;
};
