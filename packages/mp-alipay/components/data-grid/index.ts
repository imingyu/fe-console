/**
 * 功能列表：
 * 1.需传递cols，列数组，可包含字段：name,title,subTitle
 */

import { FcDataGridCol, FcMpEvent } from "@fe-console/types";
import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";

FcMpComponent(createLiaisonMixin(MpViewType.Component, "fc-data-grid"), {
    properties: {
        primaryField: {
            // 主键字段名
            type: String,
            value: "id",
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
        data: {
            type: Array,
            observer(list) {
                if (list && list.length) {
                    // 判断是否需要重置设置
                    if (this.firstItemId !== list[0].id) {
                        this.firstItemId = list[0].id;
                        this.clear();
                        this.setList(
                            0,
                            this.data.pageSize + this.data.bufferSize - 1,
                            {
                                itemStatus: {},
                                showList: [],
                                itemHeight: {},
                            }
                        );
                    }
                } else {
                    this.setData({
                        showList: [],
                        itemStatus: {},
                        itemHeight: {},
                    });
                }
            },
        },
    },
    data: {
        columns: [],
        affixList: [],
    },
    methods: {
        computeAffixList() {
            const rows = this.$fcGetProp("affixRows", []) as string[];
            const key = this.$fcGetProp("primaryField", "id") as string;
            this.setData({
                affixList: rows
                    .map((primaryFieldVal) => {
                        return (this.$fcGetProp("data", []) as any[]).find(
                            (item) => item[key] === primaryFieldVal
                        );
                    })
                    .filter((item) => item),
            });
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
                const columns: FcDataGridCol[] = [];
                cols.forEach((item, index) => {
                    const col: FcDataGridCol = {
                        field: item.field,
                        title: item.title,
                    };
                    if (item.subTitle) {
                        col.subTitle = item.subTitle;
                    }
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
                    columns.push(col);
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
                        const kfpWidth = 100 - notReadyIndexs.length * minWidth;
                        const oneWidth = parseInt(
                            (kfpWidth / readyIndexs.length).toString()
                        );
                        readyIndexs.forEach((item, index) => {
                            if (readyIndexs.length - 1 === index) {
                                columns[item].width = 100 - readyWidth;
                            } else {
                                columns[item].width -= oneWidth;
                                readyWidth -= oneWidth;
                            }
                        });
                    }
                }
                widthList.forEach((item, index) => {
                    columns[index].width = item;
                });
                this.setData({
                    columns,
                });
                delete this.computeColWidthTimer;
            });
        },
        fireCellEvent(name: string, e: FcMpEvent) {
            const data: any = {};
            const { row, col, type } = e.currentTarget.dataset;
            if (type === "affix") {
                data.affix = true;
            }
            if (row) {
                if (type === "affix") {
                    data.row = this.data.affixList[row];
                } else {
                    data.row = this.data.$vlShowList[row];
                }
            }
            if (col) {
                data.col = this.data.columns[col];
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
        longpressCell(e: FcMpEvent) {
            this.fireCellEvent("longpressCell", e);
        },
    },
});
