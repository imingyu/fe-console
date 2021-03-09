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
            this.$vlUpdateShowList(scrollTop);
        },
        onVlScrollToUpper() {},
        onVlScrollToLower() {},
        // 同步虚拟列表每项高度
        $vlSyncItemHeight() {
            if (!this.$vlAllList || this.$vlAllList.length) {
                delete this.$vlItemHeightMap;
            } else {
                if (!this.$vlItemHeightMap) {
                    this.$vlItemHeightMap = {};
                }
                this.$vlAllList.forEach((item) => {
                    this.$vlItemHeightMap[item.id] =
                        item.$vlHeight || this.data.$vlItemHeight;
                });
            }
        },
        $vlUpdateShowList(scrollTop) {},
        $vlPushItem(item) {},
        // resetVlList() {
        //     if (list && list.length) {
        //         // 判断是否需要重置设置
        //         if (this.firstItemId !== list[0].id) {
        //             this.firstItemId = list[0].id;
        //             this.clear();
        //             this.setList(
        //                 0,
        //                 this.data.pageSize + this.data.bufferSize - 1,
        //                 {
        //                     itemStatus: {},
        //                     showList: [],
        //                     itemHeight: {},
        //                 }
        //             );
        //         }
        //     } else {
        //         this.setData({
        //             showList: [],
        //             itemStatus: {},
        //             itemHeight: {},
        //         });
        //     }
        // },
        // $destiryVirtualList() {
        //     if (this.$vlItemObserver) {
        //         Object.keys(this.$vlItemObserver).forEach((key) => {
        //             this.$vlItemObserver[key][1].disconnect();
        //             delete this.$vlItemObserver[key];
        //         });
        //     }
        //     delete this.$vlIndexMapItemList;
        //     if (this.$vlCheckAndFireRenderTimer) {
        //         clearTimeout(this.$vlCheckAndFireRenderTimer);
        //     }
        // },
        // setList(startIndex, endIndex, data) {
        //     data = data || {};
        //     if (!this.$vlIndexMapItemList) {
        //         this.$vlIndexMapItemList = [];
        //     }
        //     const list = this.data.value;
        //     this.startIndex = startIndex;
        //     this.endIndex = endIndex;
        //     const showList = list.slice(this.startIndex, this.endIndex + 1);
        //     const reanderAfterHandler = [];
        //     showList.forEach((item, index) => {
        //         if (data.itemStatus) {
        //             data.itemStatus[item.id] = "render";
        //         } else {
        //             data[`itemStatus.s${item.id}`] = "render";
        //         }
        //         item.index = startIndex + index;
        //         this.$vlIndexMapItemList[item.index] = item;
        //         if (data.showList) {
        //             data.showList[item.index] = item;
        //         } else {
        //             data[`showList[${item.index}]`] = item;
        //         }
        //         reanderAfterHandler.push(() => {
        //             if (!this.$vlItemObserver) {
        //                 this.$vlItemObserver = {};
        //             }
        //             if (!this.itemDomQuery) {
        //                 this.itemDomQuery = {};
        //             }
        //             if (!this.itemDomSizeReayd) {
        //                 this.itemDomSizeReayd = {};
        //             }
        //             if (!this.$vlItemObserver[item.id]) {
        //                 this.$vlItemObserver[item.id] = [
        //                     item.index,
        //                     this.createIntersectionObserver(),
        //                 ];
        //                 this.$vlItemObserver[item.id][1]
        //                     .relativeToViewport()
        //                     .observe(`.mp-item-${item.id}`, (res) => {
        //                         this.onItemVisableChange(item, res);
        //                     });
        //             }
        //             if (!this.itemDomQuery[item.id]) {
        //                 this.itemDomSizeReayd[item.id] = false;
        //                 this.itemDomQuery[item.id] = this.createSelectorQuery();
        //                 this.itemDomQuery[item.id]
        //                     .select(`.mp-item-${item.id}`)
        //                     .boundingClientRect();
        //                 this.itemDomQuery[item.id].exec((res) => {
        //                     delete this.itemDomQuery[item.id];
        //                     this.itemDomSizeReayd[item.id] = true;
        //                     this.pushRenderQueue({
        //                         [`itemHeight.s${item.id}`]: res[0].height,
        //                     });
        //                 });
        //             }
        //         });
        //     });
        //     this.pushRenderQueue(data, reanderAfterHandler, true);
        // },
        // onItemVisableChange(item, res) {
        //     const data = {};
        //     if (res.intersectionRatio > 0) {
        //         data[`itemStatus.s${item.id}`] = "show";
        //     } else {
        //         data[`itemStatus.s${item.id}`] = "hide";
        //     }
        //     console.log(
        //         `onItemVisableChange=${item.index}.${item.id}.${
        //             data[`itemStatus.s${item.id}`]
        //         }`
        //     );
        //     if (
        //         this.endIndex - item.index <= this.data.bufferSize &&
        //         res.intersectionRatio > 0
        //     ) {
        //         return this.setList(
        //             this.endIndex + 1,
        //             this.endIndex + this.data.pageSize + this.data.bufferSize,
        //             data
        //         );
        //     }
        //     this.pushRenderQueue(data);
        // },
        // pushRenderQueue(data, renderAfterHandlers, sync = false) {
        //     if (!this.renderQueue) {
        //         this.renderQueue = [];
        //     }
        //     this.renderQueue.push([data, renderAfterHandlers]);
        //     this.checkAndFireRender(sync);
        // },
        // checkAndFireRender(sync) {
        //     if (sync) {
        //         this.execUpdate();
        //     } else {
        //         if (this.$vlCheckAndFireRenderTimer) {
        //             clearTimeout(this.$vlCheckAndFireRenderTimer);
        //         }
        //         this.$vlCheckAndFireRenderTimer = setTimeout(() => {
        //             this.execUpdate();
        //         });
        //     }
        // },
        // execUpdate() {
        //     if (this.renderQueue.length) {
        //         const { data, renderAfterHandlers } = this.mergeData(
        //             this.renderQueue.splice(0, this.renderQueue.length)
        //         );
        //         this.checkAndUpdateStatus(data, renderAfterHandlers);
        //         this.setData(data, () => {
        //             renderAfterHandlers.forEach((item) => item());
        //         });
        //     }
        // },
        // mergeItemStatus(data, remove = false) {
        //     const itemStatus = JSON.parse(JSON.stringify(this.data.itemStatus));
        //     for (const prop in data) {
        //         if (prop.indexOf("itemStatus.s") === 0) {
        //             const id = prop.split(`itemStatus.s`)[1];
        //             itemStatus[`s${id}`] = data[prop];
        //             if (remove) {
        //                 delete data[prop];
        //             }
        //         }
        //         if (
        //             prop.indexOf("itemStatus") === 0 &&
        //             typeof data[prop] === "object"
        //         ) {
        //             for (const id in data.itemStatus) {
        //                 itemStatus[`s${id}`] = data[prop][id];
        //                 if (remove) {
        //                     delete data[prop][id];
        //                 }
        //             }
        //             if (remove) {
        //                 delete data[prop];
        //             }
        //         }
        //     }
        //     return itemStatus;
        // },
        // getSortRows(itemStatus) {
        //     return this.$vlIndexMapItemList
        //         .map((item) => {
        //             return {
        //                 index: item.index,
        //                 id: item.id,
        //                 status: itemStatus[`s${item.id}`],
        //                 orgItem: item,
        //             };
        //         })
        //         .sort((a, b) => a.index - b.index);
        // },
        // checkAndUpdateStatus(data, renderAfterHandlers) {
        //     const itemStatus = this.mergeItemStatus(data, true);
        //     const rows = this.getSortRows(itemStatus);
        //     const orgItemStatus = JSON.parse(JSON.stringify(itemStatus));
        //     /*
        //      * 1.firstShowIndex 前面的 bufferSize 个元素保持渲染状态，更前面的元素保持 weak 状态
        //      * 2.firstShowIndex 前面 weak 元素数量大于 weakSize 时，
        //      *      将从0开始至 firstShowIndex-bufferSize-weakSize 的所有元素设置为 recovery,
        //      *      并设置 startPlaceholderHeight 为 recovery 元素的总高度
        //      * 3.lastShowIndex 后面的 bufferSize 个元素保持渲染状态，更后面的元素保持 weak 状态
        //      * 4.lastShowIndex 后面 weak 元素数量大于 weakSize 时，
        //      *      将从 lastShowIndex+bufferSize+weakSize 后的所有元素设置为 recovery,
        //      *      并设置 endPlaceholderHeight 为 recovery 元素的总高度
        //      * 5.设置 weak/recovery前，一定是该元素的高度已经获取到了
        //      */

        //     let firstShowIndex = -1;
        //     let lastShowIndex = -1;
        //     rows.forEach((item) => {
        //         if (item.status === "show") {
        //             if (firstShowIndex === -1) {
        //                 firstShowIndex = item.index;
        //             }
        //             lastShowIndex = item.index;
        //         }
        //     });
        //     let startPlaceholderHeight = 0;
        //     let endPlaceholderHeight = 0;
        //     rows.forEach((item) => {
        //         if (item.index < firstShowIndex - this.data.bufferSize) {
        //             if (this.itemDomSizeReayd[item.id]) {
        //                 itemStatus[`s${item.id}`] = "weak";
        //                 if (
        //                     item.index <
        //                     firstShowIndex -
        //                         this.data.bufferSize -
        //                         this.data.weakSize
        //                 ) {
        //                     itemStatus[`s${item.id}`] = "recovery";
        //                     startPlaceholderHeight += this.data.itemHeight[
        //                         `s${item.id}`
        //                     ];
        //                     this.$vlItemObserver[item.id] &&
        //                         this.$vlItemObserver[item.id][1].disconnect();
        //                     delete this.$vlItemObserver[item.id];
        //                 }
        //             }
        //         } else if (
        //             item.index >= firstShowIndex - this.data.bufferSize &&
        //             item.index < firstShowIndex
        //         ) {
        //             itemStatus[`s${item.id}`] = isVisableStatus(
        //                 itemStatus[`s${item.id}`]
        //             )
        //                 ? itemStatus[`s${item.id}`]
        //                 : "render";
        //         } else if (item.index > firstShowIndex && firstShowIndex >= 0) {
        //             if (item.index <= lastShowIndex) {
        //             } else if (
        //                 item.index <
        //                 lastShowIndex + this.data.bufferSize
        //             ) {
        //                 itemStatus[`s${item.id}`] = isVisableStatus(
        //                     itemStatus[`s${item.id}`]
        //                 )
        //                     ? itemStatus[`s${item.id}`]
        //                     : "render";
        //             } else if (
        //                 item.index >
        //                 lastShowIndex + this.data.bufferSize
        //             ) {
        //                 if (this.itemDomSizeReayd[item.id]) {
        //                     itemStatus[`s${item.id}`] = "weak";
        //                     if (
        //                         item.index >
        //                         lastShowIndex +
        //                             this.data.bufferSize +
        //                             this.data.weakSize
        //                     ) {
        //                         itemStatus[`s${item.id}`] = "recovery";
        //                         endPlaceholderHeight += this.data.itemHeight[
        //                             `s${item.id}`
        //                         ];
        //                         this.$vlItemObserver[item.id] &&
        //                             this.$vlItemObserver[
        //                                 item.id
        //                             ][1].disconnect();
        //                         delete this.$vlItemObserver[item.id];
        //                     }
        //                 }
        //             }
        //         }
        //         // 从销毁状态恢复时，则重新监控dom的显示状态
        //         if (
        //             item.status === "recovery" &&
        //             itemStatus[`s${item.id}`] !== "recovery"
        //         ) {
        //             renderAfterHandlers.push(() => {
        //                 if (!this.$vlItemObserver[item.id]) {
        //                     this.$vlItemObserver[item.id] = [
        //                         item.index,
        //                         this.createIntersectionObserver(),
        //                     ];
        //                     this.$vlItemObserver[item.id][1]
        //                         .relativeToViewport()
        //                         .observe(`.mp-item-${item.id}`, (res) => {
        //                             this.onItemVisableChange(item.orgItem, res);
        //                         });
        //                 }
        //             });
        //         }
        //         item.status = itemStatus[`s${item.id}`];
        //     });
        //     data.startPlaceholderHeight = startPlaceholderHeight;
        //     data.endPlaceholderHeight = endPlaceholderHeight;
        //     // 对itemStatus进行数据对比，仅渲染更改部分
        //     for (const prop in itemStatus) {
        //         if (this.data.itemStatus[prop] !== itemStatus[prop]) {
        //             data[`itemStatus.${prop}`] = itemStatus[prop];
        //         }
        //     }
        // },
        // mergeData(queue) {
        //     const data = {};
        //     const renderAfterHandlers = [];
        //     const hasExpression = [false, false];
        //     queue.forEach((item) => {
        //         if (item[1] && item[1].length) {
        //             renderAfterHandlers.push(...item[1]);
        //         }
        //         for (const prop in item[0]) {
        //             if (prop.indexOf("showList[") === 0) {
        //                 hasExpression[0] = true;
        //             }
        //             if (prop.indexOf("itemStatus.s") === 0) {
        //                 hasExpression[1] = true;
        //             }
        //             data[prop] = item[0][prop];
        //         }
        //     });
        //     const needMerge = [];
        //     if (data.itemStatus && hasExpression[1]) {
        //         needMerge[1] = true;
        //     }
        //     if (data.showList && hasExpression[0]) {
        //         needMerge[0] = true;
        //     }
        //     if (needMerge[0] || needMerge[1]) {
        //         for (const prop in data) {
        //             if (needMerge[0] && prop.indexOf("showList[") === 0) {
        //                 const index = parseInt(prop.split("showList[")[1]);
        //                 data.showList[index] = data[prop];
        //                 delete data[prop];
        //             }
        //             if (needMerge[1] && prop.indexOf("itemStatus.s") === 0) {
        //                 const id = prop.split(`itemStatus.s`)[1];
        //                 data.itemStatus[id] = data[prop];
        //                 delete data[prop];
        //             }
        //         }
        //     }
        //     return {
        //         data,
        //         renderAfterHandlers,
        //     };
        // },
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
            this.clear();
        };
    }
    return mixin;
};
