import { isEmptyObject } from "@mpkit/util";
import { MpViewType } from "@mpkit/types";
const isVisableStatus = (status) => {
    return status !== "hide" && status !== "weak" && status !== "recovery";
};
export const createVirtualListMixin = (type: MpViewType) => {
    const methods = {
        onVlTouchStart() {},
        onVlTouchEnd() {},
        onVlTouchMove() {},
        onVlTouchCancel() {},
        onVlScroll(event) {
            const { scrollTop } = event.detail;
            this.$vlCheckItemVisable(scrollTop);
        },
        onVlScrollToUpper() {},
        onVlScrollToLower() {},
        $vlAddItem(item) {
            if (!this.$vlAllList) {
                this.$vlAllList = [];
            }
            const readyItem = this.$vlAllList.findIndex(
                (it) => it.id === item.id
            );
            if (readyItem) {
                Object.assign(readyItem, item);
            }
            const readyShowIndex = this.$vlShowList.findIndex(
                (it) => it.id === item.id
            );
            if (readyShowIndex) {
                this.$vlMergeUpdate(item.id, item);
                return;
            }
            if (!readyItem) {
                item.$vlIndex = this.$vlAllList.length;
                this.$vlAllList.push(item);
                this.$vlCheckUpdateShowList();
            }
        },
        $vlTrySetShowList(startIndex, endIndex, otherData) {
            this.$vlStartIndex = startIndex;
            this.$vlEndIndex = endIndex;
            const showList = this.$vlAllList.slice(
                this.$vlStartIndex,
                this.$vlEndIndex + 1
            );
            this.$vlMergeUpdate(showList);
            showList.forEach((item) => {
                this.$vlMergeUpdate(item.id, "render");
            });
            if (otherData) {
                this.$vlMergeUpdate(otherData);
            }
        },
        $vlCheckUpdateShowList() {
            if (typeof this.$vlStartIndex === "undefined") {
                return this.$vlTrySetShowList(
                    0,
                    this.data.$vlPageSize + this.data.$vlBufferSize - 1
                );
            }
            const newList = this.$vlAllList.slice(
                this.$vlStartIndex,
                this.$vlEndIndex + 1
            );
            if (this.$vlShowList.length < newList.length) {
                this.$vlTrySetShowList(
                    0,
                    this.data.$vlPageSize + this.data.$vlBufferSize - 1
                );
            }
        },
        $vlCheckItemVisable(scrollTop) {
            const itemHeight = this.data.$vlItemHeight;
            let totalHeight = 0;
            let currentShowItemIndex = -1;
            for (let i = 0, len = this.$vlAllList.length; i < len; i++) {
                totalHeight += itemHeight;
                if (totalHeight >= scrollTop) {
                    currentShowItemIndex = i;
                    break;
                }
            }
            this.$vlCheckUpdateShowList();
        },
        $initVlIndex() {
            this.$vlStartIndex = 0;
            this.$vlEndIndex =
                this.data.$vlPageSize + this.data.$vlBufferSize - 1;
        },
        $vlFireUpdateQueue() {
            if (!this.$vlUpdateQueue || !this.$vlUpdateQueue.length) {
                return;
            }
            const queue = this.$vlUpdateQueue;
            delete this.$vlUpdateQueue;
            const result: any = {};
            queue.forEach(([id, data]) => {
                if (typeof id === "object") {
                    if (Array.isArray(id)) {
                        result.$vlShowList = id;
                    } else {
                        Object.assign(result, id);
                    }
                } else if (typeof data === "string") {
                    if (!result.$vlStatus) {
                        result.$vlStatus = {};
                    }
                    result.$vlStatus[id] = data;
                } else if (!result[id]) {
                    result["item_" + id] = data;
                } else {
                    Object.assign(result["item_" + id], data);
                }
            });
            const vlShowList = result.$vlShowList || this.data.$vlShowList;
            const isNewShowList =
                result.$vlShowList && result.$vlShowList.length;
            for (let prop in result) {
                if (prop.startsWith("item_")) {
                    const id = prop.substr(5);
                    const itemIndex = vlShowList.findIndex(
                        (it) => it.id === id
                    );
                    if (itemIndex !== -1 && isNewShowList) {
                        Object.assign(vlShowList[itemIndex], result[prop]);
                    }
                    if (!isNewShowList && itemIndex !== -1) {
                        result[`$vlShowList[${itemIndex}]`] = result[prop];
                    }
                    delete result[prop];
                }
            }
            if (!isEmptyObject(result)) {
                this.$vlDateSetting = true;
                this.setData(result, () => {
                    delete this.$vlDateSetting;
                    this.$vlMergeUpdate();
                });
            }
        },
        $vlMergeUpdate(id, data) {
            if (id === true) {
                this.$vlDateSetting = true;
                return this.setData(
                    {
                        $vlShowList: [],
                        $vlStatus: {},
                        $vlStartPlaceholderHeight: 0,
                        $vlEndPlaceholderHeight: 0,
                    },
                    () => {
                        delete this.$vlDateSetting;
                        this.$vlMergeUpdate();
                    }
                );
            }
            if (!this.$vlUpdateQueue) {
                this.$vlUpdateQueue = [];
            }
            if (id) {
                this.$vlUpdateQueue.push([id, data]);
            }
            if (this.$vlDateSetting) {
                return;
            }
            if (this.$vlUpdateQueue) {
                if (this.$vlUpdateQueue.length > this.$vlPageSize) {
                    this.$vlFireUpdateQueue();
                } else {
                    if (this.$vlUpdateTimer) {
                        clearTimeout(this.$vlUpdateTimer);
                    }
                    this.$vlUpdateTimer = setTimeout(() => {
                        this.$vlFireUpdateQueue();
                    }, 500);
                }
            }
        },
        $vlClear() {
            delete this.$vlFirstItemId;
            delete this.$vlAllList;
            delete this.$vlUpdateQueue;
            this.$initVlIndex();
            this.$vlMergeUpdate(true);
        },
        $vlDestory() {
            this.$vlClear();
        },
    };
    const destoryLife =
        type === MpViewType.Component
            ? '<%= (platform==="alipay"?"didUnmount":"detached") %>'
            : "onUnload";
    const mixin: any = {
        data: {
            // 显示的数据
            $vlShowList: [],
            // item的状态可选值：无=代表未渲染；render=已经渲染；
            // show=已经显示在视野中；hide=消失在视野中；
            // weak=已从视野中消失，dom处于销毁状态，但高度已经获得可快速重新渲染
            // recovery=回收状态，避免页面节点过多
            $vlStatus: {},
            // 每项高度（也可在list.item中给出$vlHeight字段），必须写死，不支持动态变化，支付宝小程序不支持组件内的createIntersectionObserver，坑逼
            $vlItemHeight: 0,
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
