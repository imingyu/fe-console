import { boundingClientRect } from "../../common/util";
import { MpViewType } from "@mpkit/types";
import {
    FcMpVirtualListComponentData,
    FcMpVirtualListComponentMethods,
    FcMpVirtualListComponentSpec,
    FcRequireId,
} from "@fe-console/types";
import { isEmptyObject } from "@mpkit/util";
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
                this.$vlAllList.reduce((sum, item) => {
                    if (!sum[item.id]) {
                        sum[item.id] = 0;
                    }
                    if (sum[item.id] > 0) {
                        debugger;
                    }
                    sum[item.id]++;
                    return sum;
                }, {});
            }
            const readyShowIndex = this.data.$vlShowList.findIndex(
                (it) => it.id === item.id
            );
            if (readyShowIndex !== -1) {
                this.setData({
                    [`$vlShowList[${readyShowIndex}]`]: item,
                });
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
            if (this.$vlSetDataTimer) {
                clearTimeout(this.$vlSetDataTimer);
                delete this.$vlSetDataTimer;
            }
            if (this.$vlComputeShowListTimer) {
                clearTimeout(this.$vlComputeShowListTimer);
                delete this.$vlComputeShowListTimer;
            }
            delete this.$vlItemSelectQueryMap;
            this.$vlScrollTop = 0;
            this.$vlOldScrollTop = 0;
            delete this.$vlAllList;
            delete this.$vlItemHeightMap;
            delete this.$vlContainerHeightComputeing;
            delete this.$vlContainerHeightComputeQueue;
            this.setData({
                $vlTotalCount: 0,
                $vlShowList: [],
                $vlStartPlaceholderHeight: 0,
                $vlEndPlaceholderHeight: 0,
            });
        },
        $vlComputeContainerHeight(callback) {
            if (this.$vlContainerHeightComputeing) {
                this.$vlContainerHeightComputeQueue.push(callback);
                return;
            }
            this.$vlContainerHeightComputeing = true;
            this.$vlContainerHeightComputeQueue = [];
            boundingClientRect(this, this.data.$vlContainerSelector).then(
                (res) => {
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
                }
            );
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
                if (oldStart !== newStart || oldEnd !== newEnd) {
                    console.log(
                        `${oldStart},${oldEnd} | ${newStart},${newEnd}`
                    );
                    this.$vlSetShowList(newStart, newEnd);
                }
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
            const expIds = list.map((item) => item.id).join(",");
            const readyIds = this.data.$vlShowList
                .map((item) => item.id)
                .join(",");
            const renderData: Partial<FcMpVirtualListComponentData> = {};
            const renderCallbacks = [];
            if (this.data.$vlStartPlaceholderHeight !== startHeight) {
                renderData.$vlStartPlaceholderHeight = startHeight;
            }
            if (this.data.$vlEndPlaceholderHeight !== endHeight) {
                renderData.$vlEndPlaceholderHeight = endHeight;
            }
            if (expIds !== readyIds) {
                renderData.$vlShowList = list;
                if (!this.vlItemSelectQueryMap) {
                    this.vlItemSelectQueryMap = {};
                }
                list.forEach((item) => {
                    if (!this.vlItemSelectQueryMap[item.id]) {
                        this.vlItemSelectQueryMap[item.id] = () => {
                            return new Promise<void>((resolve) => {
                                if (
                                    !this.vlItemSelectQueryMap ||
                                    !this.vlItemSelectQueryMap[item.id]
                                ) {
                                    return resolve();
                                }
                                boundingClientRect(this, `.vl-item-${item.id}`)
                                    .then((res) => {
                                        if (
                                            !this.vlItemSelectQueryMap ||
                                            !this.vlItemSelectQueryMap[item.id]
                                        ) {
                                            return resolve();
                                        }
                                        this.$vlSetItemHeight(
                                            item.id,
                                            res.height
                                        );
                                        return resolve();
                                    })
                                    .catch(() => {
                                        resolve();
                                    });
                            });
                        };
                        renderCallbacks.push(
                            this.vlItemSelectQueryMap[item.id]
                        );
                    }
                });
            }
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
            ? 'didUnmount'
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
    if (type !== MpViewType.App) {
        mixin[destoryLife] = function () {
            this.$vlClear();
        };
    }
    return mixin;
};
