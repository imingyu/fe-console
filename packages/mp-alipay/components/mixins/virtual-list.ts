import {
    createIntersectionObserver,
    createSelectorQuery,
} from "../../common/util";
import { MpViewType } from "@mpkit/types";
const isVisableStatus = (status) => {
    return status !== "hide" && status !== "weak" && status !== "recovery";
};
// TODO: 有BUG，向showList中插入数据的时候，有index不连续的情况
export const createVirtualListMixin = (type: MpViewType) => {
    const methods = {
        $vlAddItem(item) {
            if (!this.$vlAllList) {
                this.$vlAllList = [];
            }
            const readyItem = this.$vlAllList.find((it) => it.id === item.id);
            if (readyItem) {
                Object.assign(readyItem, item);
            }
            const readyShowIndex = this.data.$vlShowList.findIndex(
                (it) => it.id === item.id
            );
            if (readyShowIndex !== -1) {
                this.$vlPushRenderQueue({
                    [`$vlShowList[${readyShowIndex}]`]: item,
                });
                return;
            }
            if (!readyItem) {
                this.$vlAllList.push(item);
            }
            if (typeof this.$vlStartIndex === "undefined") {
                this.$vlTrySetShowList(
                    0,
                    this.data.$vlPageSize + this.data.$vlBufferSize - 1
                );
            } else if (this.$vlStartIndex === 0) {
                if (
                    this.data.$vlShowList.length !==
                    this.$vlAllList.slice(
                        this.$vlStartIndex,
                        this.$vlEndIndex + 1
                    ).length
                ) {
                    this.$vlTrySetShowList(
                        0,
                        this.data.$vlPageSize + this.data.$vlBufferSize - 1
                    );
                }
            }
        },
        $vlTrySetShowList(startIndex, endIndex, data) {
            data = data || {};
            if (!this.$vlIndexMapItemList) {
                this.$vlIndexMapItemList = [];
            }
            const list = this.$vlAllList;
            this.$vlStartIndex = startIndex;
            this.$vlEndIndex = endIndex;
            const $vlShowList = list.slice(
                this.$vlStartIndex,
                this.$vlEndIndex + 1
            );
            console.log(
                `startIndex=${startIndex}, endIndex=${endIndex}, oldLen=${this.data.$vlShowList.length}, len=${$vlShowList.length}`
            );

            const reanderAfterHandler = [];
            $vlShowList.forEach((item, index) => {
                if (data.$vlItemStatus) {
                    data.$vlItemStatus[item.id] = "render";
                } else {
                    data[`$vlItemStatus.s${item.id}`] = "render";
                }
                item.index = startIndex + index;
                this.$vlIndexMapItemList[item.index] = item;
                if (data.$vlShowList) {
                    data.$vlShowList[item.index] = item;
                } else {
                    data[`$vlShowList[${item.index}]`] = item;
                }
                reanderAfterHandler.push(() => {
                    if (!this.$vlItemUIObserver) {
                        this.$vlItemUIObserver = {};
                    }
                    if (!this.$vlItemDomQuery) {
                        this.$vlItemDomQuery = {};
                    }
                    if (!this.$vlItemDomSizeReady) {
                        this.$vlItemDomSizeReady = {};
                    }
                    if (!this.$vlItemUIObserver[item.id]) {
                        this.$vlItemUIObserver[item.id] = [
                            item.index,
                            createIntersectionObserver(this),
                        ];
                        this.$vlItemUIObserver[item.id][1].then((obs) => {
                            if (
                                this.$vlItemUIObserver &&
                                this.$vlItemUIObserver[item.id]
                            ) {
                                this.$vlItemUIObserver[item.id][2] = obs;
                                obs.relativeToViewport().observe(
                                    `.vl-item-${item.id}`,
                                    (res) => {
                                        if (
                                            this.$vlItemUIObserver &&
                                            this.$vlItemUIObserver[item.id] &&
                                            this.data.$vlShowList.find(
                                                (it) => it.id === item.id
                                            )
                                        ) {
                                            this.$vlOnItemVisableChange(
                                                item,
                                                res
                                            );
                                        }
                                    }
                                );
                            } else {
                                obs.disconnect();
                            }
                        });
                    }
                    if (!this.$vlItemDomQuery[item.id]) {
                        this.$vlItemDomSizeReady[item.id] = false;
                        if (!this.data.$vlItemStaticHeight) {
                            createSelectorQuery(this).then((query) => {
                                if (
                                    this.$vlItemDomQuery &&
                                    this.$vlItemDomQuery[item.id]
                                ) {
                                    this.$vlItemDomQuery[item.id] = query;
                                    this.$vlItemDomQuery[item.id]
                                        .select(`.vl-item-${item.id}`)
                                        .boundingClientRect();
                                    this.$vlItemDomQuery[item.id].exec(
                                        (res) => {
                                            if (
                                                this.$vlItemDomQuery &&
                                                this.$vlItemDomQuery[item.id]
                                            ) {
                                                delete this.$vlItemDomQuery[
                                                    item.id
                                                ];
                                                this.$vlItemDomSizeReady[
                                                    item.id
                                                ] = true;
                                                this.$vlPushRenderQueue({
                                                    [`$vlItemHeight.s${item.id}`]: res[0]
                                                        .height,
                                                });
                                            }
                                        }
                                    );
                                }
                            });
                        } else {
                            this.$vlItemDomSizeReady[item.id] = true;
                            this.$vlPushRenderQueue({
                                [`$vlItemHeight.s${item.id}`]: this.data
                                    .$vlItemStaticHeight,
                            });
                        }
                    }
                });
            });
            this.$vlPushRenderQueue(data, reanderAfterHandler, true);
        },
        $vlOnItemVisableChange(item, res) {
            const data = {};
            if (res.intersectionRatio > 0) {
                data[`$vlItemStatus.s${item.id}`] = "show";
            } else {
                data[`$vlItemStatus.s${item.id}`] = "hide";
            }
            if (
                this.$vlEndIndex - item.index <= this.data.$vlBufferSize &&
                res.intersectionRatio > 0
            ) {
                return this.$vlTrySetShowList(
                    this.$vlEndIndex + 1,
                    this.$vlEndIndex +
                        this.data.$vlPageSize +
                        this.data.$vlBufferSize,
                    data
                );
            } else if (
                this.data.$vlShowList.length !==
                this.$vlAllList.slice(this.$vlStartIndex, this.$vlEndIndex + 1)
                    .length
            ) {
                return this.$vlTrySetShowList(
                    this.$vlStartIndex,
                    this.$vlStartIndex +
                        this.data.$vlPageSize +
                        this.data.$vlBufferSize -
                        1,
                    data
                );
            }
            this.$vlPushRenderQueue(data);
        },
        $vlPushRenderQueue(data, renderAfterHandlers, sync = false) {
            if (!this.$vlRenderQueue) {
                this.$vlRenderQueue = [];
            }
            this.$vlRenderQueue.push([data, renderAfterHandlers]);
            this.$vlCheckAndFireRender(sync);
        },
        $vlCheckAndFireRender(sync) {
            if (sync) {
                this.$vlExecUpdate();
            } else {
                if (this.$vlCheckAndFireRenderTimer) {
                    clearTimeout(this.$vlCheckAndFireRenderTimer);
                }
                this.$vlCheckAndFireRenderTimer = setTimeout(() => {
                    this.$vlExecUpdate();
                }, 200);
            }
        },
        $vlExecUpdate() {
            if (this.$vlRenderQueue.length) {
                const { data, renderAfterHandlers } = this.$vlMergeData(
                    this.$vlRenderQueue.splice(0, this.$vlRenderQueue.length)
                );
                this.$vlCheckAndUpdateStatus(data, renderAfterHandlers);
                this.setData(data, () => {
                    renderAfterHandlers.forEach((item) => item());
                });
            }
        },
        $vlMergeItemStatus(data, remove = false) {
            const $vlItemStatus = JSON.parse(
                JSON.stringify(this.data.$vlItemStatus)
            );
            for (const prop in data) {
                if (prop.indexOf("$vlItemStatus.s") === 0) {
                    const id = prop.split(`$vlItemStatus.s`)[1];
                    $vlItemStatus[`s${id}`] = data[prop];
                    if (remove) {
                        delete data[prop];
                    }
                }
                if (
                    prop.indexOf("$vlItemStatus") === 0 &&
                    typeof data[prop] === "object"
                ) {
                    for (const id in data.$vlItemStatus) {
                        $vlItemStatus[`s${id}`] = data[prop][id];
                        if (remove) {
                            delete data[prop][id];
                        }
                    }
                    if (remove) {
                        delete data[prop];
                    }
                }
            }
            return $vlItemStatus;
        },
        $vlGetSortRows($vlItemStatus) {
            return (this.$vlIndexMapItemList || [])
                .map((item) => {
                    return {
                        index: item.index,
                        id: item.id,
                        status: $vlItemStatus[`s${item.id}`],
                        orgItem: item,
                    };
                })
                .sort((a, b) => a.index - b.index);
        },
        $vlCheckAndUpdateStatus(data, renderAfterHandlers) {
            const $vlItemStatus = this.$vlMergeItemStatus(data, true);
            const rows = this.$vlGetSortRows($vlItemStatus);
            const orgItemStatus = JSON.parse(JSON.stringify($vlItemStatus));
            /*
             * 1.firstShowIndex 前面的 $vlBufferSize 个元素保持渲染状态，更前面的元素保持 weak 状态
             * 2.firstShowIndex 前面 weak 元素数量大于 $vlWeakSize 时，
             *      将从0开始至 firstShowIndex-$vlBufferSize-$vlWeakSize 的所有元素设置为 recovery,
             *      并设置 $vlStartPlaceholderHeight 为 recovery 元素的总高度
             * 3.lastShowIndex 后面的 $vlBufferSize 个元素保持渲染状态，更后面的元素保持 weak 状态
             * 4.lastShowIndex 后面 weak 元素数量大于 $vlWeakSize 时，
             *      将从 lastShowIndex+$vlBufferSize+$vlWeakSize 后的所有元素设置为 recovery,
             *      并设置 $vlEndPlaceholderHeight 为 recovery 元素的总高度
             * 5.设置 weak/recovery前，一定是该元素的高度已经获取到了
             */

            let firstShowIndex = -1;
            let lastShowIndex = -1;
            rows.forEach((item) => {
                if (item.status === "show") {
                    if (firstShowIndex === -1) {
                        firstShowIndex = item.index;
                    }
                    lastShowIndex = item.index;
                }
            });
            let $vlStartPlaceholderHeight = 0;
            let $vlEndPlaceholderHeight = 0;
            rows.forEach((item) => {
                if (item.index < firstShowIndex - this.data.$vlBufferSize) {
                    if (this.$vlItemDomSizeReady[item.id]) {
                        $vlItemStatus[`s${item.id}`] = "weak";
                        if (
                            item.index <
                            firstShowIndex -
                                this.data.$vlBufferSize -
                                this.data.$vlWeakSize
                        ) {
                            $vlItemStatus[`s${item.id}`] = "recovery";
                            $vlStartPlaceholderHeight += this.data
                                .$vlItemHeight[`s${item.id}`];
                            this.$vlItemUIObserver[item.id] &&
                                this.$vlItemUIObserver[item.id][2].disconnect();
                            delete this.$vlItemUIObserver[item.id];
                        }
                    }
                } else if (
                    item.index >= firstShowIndex - this.data.$vlBufferSize &&
                    item.index < firstShowIndex
                ) {
                    $vlItemStatus[`s${item.id}`] = isVisableStatus(
                        $vlItemStatus[`s${item.id}`]
                    )
                        ? $vlItemStatus[`s${item.id}`]
                        : "render";
                } else if (item.index > firstShowIndex && firstShowIndex >= 0) {
                    if (item.index <= lastShowIndex) {
                    } else if (
                        item.index <
                        lastShowIndex + this.data.$vlBufferSize
                    ) {
                        $vlItemStatus[`s${item.id}`] = isVisableStatus(
                            $vlItemStatus[`s${item.id}`]
                        )
                            ? $vlItemStatus[`s${item.id}`]
                            : "render";
                    } else if (
                        item.index >
                        lastShowIndex + this.data.$vlBufferSize
                    ) {
                        if (this.$vlItemDomSizeReady[item.id]) {
                            $vlItemStatus[`s${item.id}`] = "weak";
                            if (
                                item.index >
                                lastShowIndex +
                                    this.data.$vlBufferSize +
                                    this.data.$vlWeakSize
                            ) {
                                $vlItemStatus[`s${item.id}`] = "recovery";
                                $vlEndPlaceholderHeight += this.data
                                    .$vlItemHeight[`s${item.id}`];
                                this.$vlItemUIObserver[item.id] &&
                                    this.$vlItemUIObserver[
                                        item.id
                                    ][2].disconnect();
                                delete this.$vlItemUIObserver[item.id];
                            }
                        }
                    }
                }
                // 从销毁状态恢复时，则重新监控dom的显示状态
                if (
                    item.status === "recovery" &&
                    $vlItemStatus[`s${item.id}`] !== "recovery"
                ) {
                    renderAfterHandlers.push(() => {
                        if (!this.$vlItemUIObserver[item.id]) {
                            this.$vlItemUIObserver[item.id] = [
                                item.index,
                                createIntersectionObserver(this),
                            ];
                            this.$vlItemUIObserver[item.id][1].then((res) => {
                                this.$vlItemUIObserver[item.id][2] = res;
                                res.relativeToViewport().observe(
                                    `.vl-item-${item.id}`,
                                    (res) => {
                                        this.$vlOnItemVisableChange(
                                            item.orgItem,
                                            res
                                        );
                                    }
                                );
                            });
                        }
                    });
                }
                item.status = $vlItemStatus[`s${item.id}`];
            });
            data.$vlStartPlaceholderHeight = $vlStartPlaceholderHeight;
            data.$vlEndPlaceholderHeight = $vlEndPlaceholderHeight;
            // 对itemStatus进行数据对比，仅渲染更改部分
            for (const prop in $vlItemStatus) {
                if (this.data.$vlItemStatus[prop] !== $vlItemStatus[prop]) {
                    data[`$vlItemStatus.${prop}`] = $vlItemStatus[prop];
                }
            }
        },
        $vlMergeData(queue) {
            const data: any = {};
            const renderAfterHandlers = [];
            const hasExpression = [false, false];
            queue.forEach((item) => {
                if (item[1] && item[1].length) {
                    renderAfterHandlers.push(...item[1]);
                }
                for (const prop in item[0]) {
                    if (prop.indexOf("$vlShowList[") === 0) {
                        hasExpression[0] = true;
                    }
                    if (prop.indexOf("$vlItemStatus.s") === 0) {
                        hasExpression[1] = true;
                    }
                    data[prop] = item[0][prop];
                }
            });
            const needMerge = [];
            if (data.$vlItemStatus && hasExpression[1]) {
                needMerge[1] = true;
            }
            if (data.$vlShowList && hasExpression[0]) {
                needMerge[0] = true;
            }
            if (needMerge[0] || needMerge[1]) {
                for (const prop in data) {
                    if (needMerge[0] && prop.indexOf("$vlShowList[") === 0) {
                        const index = parseInt(prop.split("$vlShowList[")[1]);
                        data.$vlShowList[index] = data[prop];
                        delete data[prop];
                    }
                    if (needMerge[1] && prop.indexOf("$vlItemStatus.s") === 0) {
                        const id = prop.split(`$vlItemStatus.s`)[1];
                        data.$vlItemStatus[id] = data[prop];
                        delete data[prop];
                    }
                }
            }
            return {
                data,
                renderAfterHandlers,
            };
        },
        $vlClear() {
            delete this.$vlAllList;
            delete this.$vlRenderQueue;
            delete this.$vlStartIndex;
            delete this.$vlEndIndex;
            delete this.$vlIndexMapItemList;
            delete this.$vlItemDomSizeReady;
            delete this.$vlItemDomQuery;
            if (this.$vlItemUIObserver) {
                Object.keys(this.$vlItemUIObserver).forEach((key) => {
                    this.$vlItemUIObserver[key][2].disconnect();
                    delete this.$vlItemUIObserver[key];
                });
            }
            delete this.$vlIndexMapItemList;
            if (this.$vlCheckAndFireRenderTimer) {
                clearTimeout(this.$vlCheckAndFireRenderTimer);
            }
            this.setData({
                $vlShowList: [],
                $vlItemStatus: {},
                $vlItemHeight: {},
                $vlStartPlaceholderHeight: 0,
                $vlEndPlaceholderHeight: 0,
            });
        },
        $vlDestory() {
            this.$vlClear();
        },
    };
    const destoryLife =
        type === MpViewType.Component
            ? 'didUnmount'
            : "onUnload";
    const mixin: any = {
        data: {
            // 显示的数据
            $vlShowList: [],
            // item的状态可选值：无=代表未渲染；render=已经渲染；
            // show=已经显示在视野中；hide=消失在视野中；
            // weak=已从视野中消失，dom处于销毁状态，但高度已经获得可快速重新渲染
            // recovery=回收状态，避免页面节点过多
            $vlItemStatus: {},
            // 每项高度（也可在list.item中给出$vlHeight字段）
            $vlItemHeight: {},
            // 可以指定是否需要计算item高度避免频繁计算
            $vlItemStaticHeight: 0,
            $vlStartPlaceholderHeight: 0,
            $vlEndPlaceholderHeight: 0,
            // 每页显示多少条数据
            $vlPageSize: 10,
            // 缓冲区的数据条数
            $vlBufferSize: 5,
            // 当weak数量达到多少时进行回收
            $vlWeakSize: 5,
        },
    };
    if (type === MpViewType.Component) {
        mixin.methods = methods;
    } else {
        Object.assign(mixin, methods);
    }
    if (type !== MpViewType.App) {
        mixin[destoryLife] = function () {
            this.$vlDestory();
        };
    }
    return mixin;
};
