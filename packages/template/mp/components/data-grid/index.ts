/**
 * 功能列表：
 * 1.需传递cols，列数组，可包含字段：name,title,subTitle
 */

import {
    FcDataGridCol,
    FcMpDataGridComponent,
    FcMpDataGridComponentExports,
    FcMpEvent,
    FcMpViewContextBase,
    FcMpVirtualListComponent,
} from "@fe-console/types";
import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { getMpInitLifeName, getMpMountLifeName } from "@mpkit/util";
import { createVirtualListMixin } from "../mixins/virtual-list";

FcMpComponent<FcMpDataGridComponent>(
    createLiaisonMixin(MpViewType.Component, "fc-data-grid"),
    createVirtualListMixin(MpViewType.Component) as any,
    {
        properties: {
            outerClass: String,
            rowClass: String,
            vlPageSize: {
                type: Number,
                value: 20,
                observer(val) {
                    this.setData({
                        $vlPageSize: val,
                    });
                    this.$vlComputeShowList();
                },
            },
            vlItemHeight: {
                type: null,
                observer(val) {
                    this.setData({
                        $vlItemStaticHeight: val,
                    });
                    this.$vlComputeShowList();
                },
            },
            affixable: {
                type: Boolean,
            },
            affixRows: {
                type: Array,
                observer() {
                    this.computeAffixList();
                },
            },
            colMinWidth: {
                type: Number,
                // 最小宽度 5%
                value: 5,
            },
            cols: {
                type: Array,
                observer() {
                    this.computeColWidth();
                },
            },
            /**尽量不要使用该属性进行数据更新，应该使用事件拿到本组件实例，然后手动$vlAddItem */
            data: {
                type: Array,
                observer(list) {
                    this.$vlAllList = list || [];
                    this.$vlListChange();
                },
            },
        },
        data: {
            columnWidthMap: {},
            affixList: [],
            scrollMarginTop: 0,
        },
        methods: {
            computeAffixList() {
                const rows = this.$fcGetProp("affixRows", []) as string[];
                let scrollMarginTop = this.data.scrollMarginTop || 0;
                const affixList = rows
                    .map((id) => {
                        return (this.$vlAllList || []).find(
                            (item) => item.id === id
                        );
                    })
                    .filter((item) => item)
                    .map((item, index) => {
                        return this.$vlMergeItem(
                            this.data.affixList
                                ? this.data.affixList[index]
                                : null,
                            item
                        );
                    });
                let vlItemHeight = this.$fcGetProp("vlItemHeight");
                const renderCallBacks = [];
                if (vlItemHeight) {
                    scrollMarginTop = vlItemHeight * affixList.length;
                } else {
                    scrollMarginTop = 0;
                    affixList.forEach((item) => {
                        if (
                            this.affixItemHeightMap &&
                            this.affixItemHeightMap[item.id]
                        ) {
                            scrollMarginTop += this.affixItemHeightMap[item.id];
                        } else {
                            renderCallBacks.push(() => {
                                return this.$fc
                                    .getBoundingClientRect(
                                        `.row${item.id}`,
                                        this
                                    )
                                    .then((res) => {
                                        if (!this.affixItemHeightMap) {
                                            this.affixItemHeightMap = {};
                                        }
                                        this.affixItemHeightMap[item.id] =
                                            res.height;
                                    })
                                    .catch(() => Promise.resolve());
                            });
                        }
                    });
                }
                this.setData(
                    {
                        affixList,
                        scrollMarginTop,
                    },
                    () => {
                        Promise.all(renderCallBacks.map((item) => item())).then(
                            () => {
                                if (
                                    this.data.affixList &&
                                    this.data.affixList.length
                                ) {
                                    let scrollMarginTop = 0;
                                    affixList.forEach((item) => {
                                        if (
                                            this.affixItemHeightMap &&
                                            this.affixItemHeightMap[item.id]
                                        ) {
                                            scrollMarginTop += this
                                                .affixItemHeightMap[item.id];
                                        }
                                    });
                                    this.setData({
                                        scrollMarginTop,
                                    });
                                }
                            }
                        );
                    }
                );
            },
            computeColWidth() {
                if (this.computeColWidthTimer) {
                    clearTimeout(this.computeColWidthTimer);
                }
                this.computeColWidthTimer = setTimeout(() => {
                    const widthList: Array<number> = [];
                    const cols = this.$fcGetProp("cols") as Array<
                        Partial<FcDataGridCol>
                    >;
                    let readyWidth = 0;
                    const notReadyIndexs: number[] = [];
                    const readyIndexs: number[] = [];
                    cols.forEach((item, index) => {
                        const widType = typeof item.width;
                        if (widType === "number") {
                            if (
                                isNaN(item.width as number) ||
                                item.width <= 0 ||
                                item.width > 100
                            ) {
                                notReadyIndexs.push(index);
                                widthList.push(0);
                            } else if (readyWidth + item.width > 100) {
                                notReadyIndexs.push(index);
                                widthList.push(0);
                            } else {
                                readyWidth += item.width;
                                widthList.push(item.width);
                                readyIndexs.push(index);
                            }
                        } else {
                            notReadyIndexs.push(index);
                            widthList.push(0);
                        }
                    });
                    if (readyWidth !== 100 || notReadyIndexs.length) {
                        const surplusWidth = 100 - readyWidth;
                        let minWidth = this.$fcGetProp("colMinWidth") as number;
                        if (typeof minWidth !== "number" || !minWidth) {
                            minWidth = 5;
                        }
                        if (notReadyIndexs.length * minWidth <= surplusWidth) {
                            notReadyIndexs.forEach((item, index) => {
                                readyWidth += 5;
                                widthList[item] = 5;
                                if (index === notReadyIndexs.length - 1) {
                                    widthList[item] = 100 - readyWidth;
                                }
                            });
                        } else {
                            notReadyIndexs.forEach((item, index) => {
                                readyWidth += 5;
                                widthList[item] = 5;
                            });
                            const kfpWidth =
                                100 - notReadyIndexs.length * minWidth;
                            const oneWidth = parseInt(
                                (kfpWidth / readyIndexs.length).toString()
                            );
                            readyIndexs.forEach((item, index) => {
                                if (readyIndexs.length - 1 === index) {
                                    widthList[item] = 100 - readyWidth;
                                } else {
                                    widthList[item] -= oneWidth;
                                    readyWidth -= oneWidth;
                                }
                            });
                        }
                    }
                    const columnWidthMap = {};
                    widthList.forEach((item, index) => {
                        columnWidthMap[cols[index].field] = item;
                    });
                    this.setData({
                        columnWidthMap,
                    });
                    delete this.computeColWidthTimer;
                });
            },
            fireCellEvent(name: string, e: FcMpEvent) {
                const data: any = {};
                const { rowid, col, type } = e.currentTarget.dataset;
                if (type === "affix") {
                    data.affix = true;
                }
                if (rowid) {
                    data.rowId = rowid;
                    if (type === "affix") {
                        data.row = this.data.affixList.find(
                            (item) => item.id === rowid
                        );
                    } else {
                        data.row = this.data.$vlShowList.find(
                            (item) => item.id === rowid
                        );
                    }
                }
                if (col) {
                    data.col = this.$fcGetProp("cols", [])[col];
                }
                this.$fcDispatch(name, data);
            },
            tapRow(e: FcMpEvent) {
                this.fireCellEvent("tapRow", e);
            },
            tapCell(e: FcMpEvent) {
                this.fireCellEvent("tapCell", e);
            },
            longpressRow(e: FcMpEvent) {
                this.fireCellEvent("longpressRow", e);
            },
        },
        [getMpMountLifeName(MpViewType.Component)](
            this: FcMpDataGridComponent
        ) {
            this.$fcExports = {
                ...this.$fcGetBaseExports(),
                addItem: this.$vlAddItem.bind(this),
                reloadAffixList: () => {
                    this.computeAffixList();
                },
                replaceAllList: (list) => {
                    this.$vlClear();
                    this.$vlAllList = [...list];
                    this.$vlListChange();
                },
            } as FcMpDataGridComponentExports;
            this.setData({
                $vlPageSize: this.$fcGetProp("vlPageSize"),
                $vlItemStaticHeight: this.$fcGetProp("vlItemHeight"),
            });
            this.$vlInit();
            this.$fcDispatch("ready");
        },
    }
);
