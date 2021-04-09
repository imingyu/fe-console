import { FcMpComponent } from "../../mixins/view";
import { createLiaisonMixin } from "../../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { getMpInitLifeName, isEmptyObject, clone } from "@mpkit/util";
import {
    FcConsoleProduct,
    FcMpApiProduct,
    FcMpApiReaderComponent,
    FcMpApiReaderComponentMethods,
    FcMpComponentMethods,
    FcMpDataGridComponentExports,
    FcMpDispatchEventData,
    FcMpViewProduct,
    FcProductType,
    PartialFcMpApiMaterial,
} from "@fe-console/types";
import { FcMpViewContextBase } from "@fe-console/types";
import { getApiCategoryList } from "../../../configure/index";
import { convertApiMaterial } from "../../../common/material";
import { computeTime } from "../../../common/util";
FcMpComponent<FcMpApiReaderComponent>(
    createLiaisonMixin(MpViewType.Component, "fc-api-reader"),
    {
        properties: {
            active: {
                type: Boolean,
                value: false,
            },
        },
        data: {
            categoryList: getApiCategoryList(),
            activeCategory: "all",
            detailMaterialId: null,
            affixIds: [],
            readerCols: [
                {
                    field: "name",
                    title: "Name",
                    width: 30,
                    wrap: false,
                },
                {
                    field: "status",
                    title: "Status",
                    width: 20,
                    wrap: false,
                },
                {
                    field: "type",
                    title: "Type",
                    width: 15,
                    wrap: false,
                },
                {
                    field: "initiator",
                    title: "Initiator",
                    width: 17.5,
                    wrap: false,
                },
                {
                    field: "time",
                    title: "Time",
                    width: 17.5,
                    wrap: false,
                },
            ],
        },
        methods: {
            addMaterial(data) {
                const material = convertApiMaterial(data, this.$fcRunConfig);
                material.type && this.refreshCategory(material.type);
                this.addMaterialToCategory(material);
            },
            addMaterialToCategory(material, map) {
                if (!map) {
                    this.initMaterialCategoryMap();
                    this.addMaterialToCategory(
                        material,
                        this.NormalMaterialCategoryMap
                    );
                    const readyItem = this.NormalMaterialCategoryMap.all.find(
                        (t) => t.id === material.id
                    );
                    const category = material.type
                        ? material.type
                        : readyItem
                        ? readyItem.type
                        : "";
                    if (this.filterKeyword) {
                        const filterFields: string[] = [
                            material.name
                                ? material.name
                                : readyItem && readyItem.name
                                ? readyItem.name
                                : "",
                            material.nameDesc
                                ? material.nameDesc
                                : readyItem && readyItem.nameDesc
                                ? readyItem.nameDesc
                                : "",
                            material.statusDesc
                                ? material.statusDesc
                                : readyItem && readyItem.statusDesc
                                ? readyItem.statusDesc
                                : "",
                        ];
                        if (
                            filterFields.some(
                                (item) =>
                                    item === this.filterKeyword ||
                                    item.indexOf(this.filterKeyword) !== -1
                            )
                        ) {
                            this.addMaterialToCategory(
                                material,
                                this.FilterMaterialCategoryMap
                            );
                            if (
                                category === this.data.activeCategory ||
                                this.data.activeCategory === "all"
                            ) {
                                this.appendDataToGrid(material);
                            }
                        }
                    } else {
                        delete this.FilterMaterialCategoryMap;
                        if (
                            category === this.data.activeCategory ||
                            this.data.activeCategory === "all"
                        ) {
                            this.appendDataToGrid(material);
                        }
                    }
                    return;
                }
                this.initMaterialCategoryMap(false, map);

                const readyItem = map.all
                    ? map.all.find((item) => item.id === material.id)
                    : null;
                if (readyItem) {
                    Object.assign(readyItem, material);
                    if (readyItem.endTime && readyItem.startTime) {
                        readyItem.time = computeTime(
                            readyItem.endTime - readyItem.startTime
                        );
                    }
                } else {
                    if (material.endTime && material.startTime) {
                        material.time = computeTime(
                            material.endTime - material.startTime
                        );
                    }
                    map.all.push(material);
                }
                if (material.type || readyItem) {
                    const category = material.type || readyItem.type;
                    if (map[category].length) {
                        const typeReadyItem = map[category].find(
                            (item) => item.id === material.id
                        );
                        if (typeReadyItem) {
                            Object.assign(typeReadyItem, material);
                        } else {
                            map[category].push(material);
                        }
                    } else {
                        map[category].push(material);
                    }
                }
            },
            initMaterialCategoryMap(clear?: boolean, map?: any) {
                if (!map) {
                    if (!this.NormalMaterialCategoryMap) {
                        this.NormalMaterialCategoryMap = {};
                    }
                    if (!this.FilterMaterialCategoryMap) {
                        this.FilterMaterialCategoryMap = {};
                    }
                    this.initMaterialCategoryMap(
                        clear,
                        this.NormalMaterialCategoryMap
                    );
                    this.initMaterialCategoryMap(
                        clear,
                        this.FilterMaterialCategoryMap
                    );
                    return;
                }
                this.data.categoryList.forEach((item) => {
                    if (!map[item.value] || clear) {
                        map[item.value] = [];
                    }
                });
            },
            syncNormalMaterialToFilter() {
                if (!this.NormalMaterialCategoryMap) {
                    return;
                }
                this.FilterMaterialCategoryMap = Object.keys(
                    this.NormalMaterialCategoryMap
                ).reduce((sum, category) => {
                    sum[category] = this.NormalMaterialCategoryMap[
                        category
                    ].filter((item) => {
                        const filterFields = [
                            item.name ? item.name : "",
                            item.nameDesc ? item.nameDesc : "",
                            item.statusDesc ? item.statusDesc : "",
                        ];
                        return filterFields.some(
                            (item) =>
                                item === this.filterKeyword ||
                                item.indexOf(this.filterKeyword) !== -1
                        );
                    });
                    return sum;
                }, {});
            },
            refreshCategory(categoryVal?: string) {
                if (!categoryVal) {
                    this.setData({
                        categoryList: getApiCategoryList(this.$fcRunConfig),
                    });
                } else if (
                    this.data.categoryList.every(
                        (item) => item.value !== categoryVal
                    )
                ) {
                    const list = getApiCategoryList();
                    list.splice(list.length - 2, 0, {
                        text: categoryVal,
                        value: categoryVal,
                    });
                    this.setData({
                        categoryList: list,
                    });
                }
            },
            reloadVlList(allList) {
                if (this.$DataGridMain) {
                    this.$DataGridMain.replaceAllList(allList);
                    this.$DataGridMain.reloadAffixList();
                }
            },
            filterMaterial(keyword: string) {
                this.filterKeyword = keyword;
                this.initMaterialCategoryMap();
                this.syncNormalMaterialToFilter();
                this.reloadVlList(
                    this.FilterMaterialCategoryMap[this.data.activeCategory]
                );
            },
            clearMaterial() {
                // 清空DataGrid操作缓存
                delete this.dataGridWaitMaterials;
                // 取消全部置顶
                this.cancelTopMaterial();
                // 把标记清空
                this.cancelMarkMaterial();

                // 将留存的id记录找出
                const keepSaveList =
                    !this.keepSaveMaterials ||
                    isEmptyObject(this.keepSaveMaterials)
                        ? []
                        : this.NormalMaterialCategoryMap.all.filter(
                              (item) => this.keepSaveMaterials[item.id]
                          );
                // 清空本地map
                this.initMaterialCategoryMap(true);
                // 将留存的记录重新插入本地map
                keepSaveList.forEach((item) => {
                    this.addMaterialToCategory(item);
                });
                if (this.filterKeyword) {
                    this.reloadVlList(
                        this.FilterMaterialCategoryMap[this.data.activeCategory]
                    );
                } else {
                    this.reloadVlList(
                        this.NormalMaterialCategoryMap[this.data.activeCategory]
                    );
                }
            },
            setDetailMaterial(
                this: FcMpViewContextBase,
                id?: string,
                tab?: number
            ) {
                this.setData({
                    detailMaterialId: id || "",
                    detailTab: tab || 0,
                });
            },
            changeCategory(activeCategory) {
                this.initMaterialCategoryMap();
                this.setData({
                    activeCategory,
                });
                delete this.dataGridWaitMaterials;
                let list: PartialFcMpApiMaterial[];
                if (this.filterKeyword) {
                    list = this.FilterMaterialCategoryMap[activeCategory];
                } else {
                    list = this.NormalMaterialCategoryMap[activeCategory];
                }

                if (activeCategory === "mark" && this.markMaterials) {
                    list = [];
                    Object.keys(this.markMaterials).forEach((id) => {
                        const item = this.NormalMaterialCategoryMap.all.find(
                            (it) => it.id === id
                        );
                        if (item) {
                            list.push(item);
                        }
                    });
                }
                this.reloadVlList(list || []);
            },
            onFcObserverEvent(
                type: string,
                data: FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
            ) {
                if (
                    data.type === FcProductType.MpApi ||
                    (this.materialExist && this.materialExist[data.id])
                ) {
                    if (!this.materialExist) {
                        this.materialExist = {};
                    }
                    if (data.category) {
                        this.materialExist[data.id] = data.category;
                    } else if (!this.materialExist[data.id]) {
                        this.materialExist[data.id] = "other";
                    }
                    this.addMaterial(data as FcMpApiProduct);
                }
            },
            appendDataToGrid(material) {
                if (this.$DataGridMain) {
                    this.$DataGridMain.addItem(material);
                    return;
                }
                if (!this.dataGridWaitMaterials) {
                    this.dataGridWaitMaterials = [];
                }
                this.dataGridWaitMaterials.push(material);
            },
            keepSaveMaterial(id: string) {
                if (!this.keepSaveMaterials) {
                    this.keepSaveMaterials = {};
                }
                this.keepSaveMaterials[id] = 1;
            },
            cancelKeepSaveMaterial(id?: string) {
                if (this.keepSaveMaterials) {
                    if (id) {
                        delete this.keepSaveMaterials[id];
                    } else {
                        delete this.keepSaveMaterials;
                    }
                }
            },
            markMaterial(id: string) {
                if (!this.markMaterials) {
                    this.markMaterials = {};
                }
                this.markMaterials[id] = 1;
            },
            cancelMarkMaterial(id?: string) {
                if (this.markMaterials) {
                    if (id) {
                        delete this.markMaterials[id];
                    } else {
                        delete this.markMaterials;
                    }
                    if (this.data.activeCategory === "mark") {
                        this.changeCategory("mark");
                    }
                }
            },
            topMaterial(id: string) {
                if (!this.topMaterials) {
                    this.topMaterials = [];
                }
                this.topMaterials.unshift(id);
                // 最多置顶3条
                this.topMaterials.length = 3;
                this.syncAffixList();
            },
            cancelTopMaterial(id?: string) {
                if (this.topMaterials) {
                    if (id) {
                        const index = this.topMaterials.indexOf(id);
                        if (index !== -1) {
                            this.topMaterials.splice(index, 1);
                        }
                    } else {
                        delete this.topMaterials;
                    }
                }
                this.syncAffixList();
            },
            syncAffixList() {
                this.setData({
                    affixIds: clone(this.topMaterials || []),
                });
                this.$DataGridMain.reloadAffixList(
                    this.NormalMaterialCategoryMap.all
                );
            },
        } as FcMpApiReaderComponentMethods &
            FcMpComponentMethods<FcMpApiReaderComponent>,
        [getMpInitLifeName(MpViewType.Component)](
            this: FcMpApiReaderComponent
        ) {
            setTimeout(() => {
                this.refreshCategory();
            }, 400);
            this.$fcOn(
                `Dispatch.${this.$cid}`,
                (type, data: FcMpDispatchEventData) => {
                    if (data.child.tid === "fc-filter-bar") {
                        type = data.type;
                        if (type === "category") {
                            this.changeCategory(data.data);
                        } else if (type === "clear") {
                            this.clearMaterial();
                        } else if (type === "filter") {
                            this.filterMaterial(data.data);
                        }
                    } else if (data.child.tid === "fc-api-detail") {
                        type = data.type;
                        if (type === "close") {
                            this.setDetailMaterial();
                        } else if (type === "changeTab") {
                            this.setData({
                                detailTab: data.data,
                            });
                        }
                    } else if (data.child.tidAlias === "ApiReaderDataGrid") {
                        type = data.type;
                        if (type === "ready") {
                            this.$DataGridMain = data.child as FcMpDataGridComponentExports<PartialFcMpApiMaterial>;
                            if (this.dataGridWaitMaterials) {
                                this.dataGridWaitMaterials.forEach((item) => {
                                    this.$DataGridMain.addItem(item);
                                });
                                delete this.dataGridWaitMaterials;
                            }
                        } else if (type === "tapCell") {
                            const { rowId, col } = data.data;
                            if (rowId) {
                                this.setDetailMaterial(
                                    rowId,
                                    col &&
                                        col.field &&
                                        col.field === "initiator"
                                        ? 3
                                        : 0
                                );
                            }
                        } else if (type === "longpressRow") {
                            const { rowId, col } = data.data;
                            if (rowId) {
                                const row = this.NormalMaterialCategoryMap.all.find(
                                    (item) => item.id === rowId
                                );
                                if (!row) {
                                    return;
                                }
                                const isTop =
                                    this.topMaterials &&
                                    this.topMaterials.some(
                                        (item) => item === rowId
                                    );
                                const isMark =
                                    this.markMaterials &&
                                    this.markMaterials[rowId];
                                const isKeppSave =
                                    this.keepSaveMaterials &&
                                    this.keepSaveMaterials[rowId];
                                // this.$fc.showToast(
                                //     `正在对【${row.name}】进行操作`
                                // );
                                this.$fc
                                    .showActionSheet([
                                        `${isTop ? "取消" : ""}置顶显示`,
                                        `分类为...`,
                                        `${isMark ? "取消" : ""}标记`,
                                        "取消全部标记",
                                        `${isKeppSave ? "取消" : ""}留存`,
                                        "取消全部留存",
                                    ])
                                    .then((index) => {
                                        if (index === 0) {
                                            if (isTop) {
                                                this.cancelTopMaterial(rowId);
                                            } else {
                                                this.topMaterial(rowId);
                                            }
                                            return;
                                        }
                                        if (index === 1) {
                                            this.$fc.showToast(
                                                "TODO:分类为..."
                                            );
                                            return;
                                        }
                                        if (index === 2) {
                                            if (isMark) {
                                                this.cancelMarkMaterial(rowId);
                                            } else {
                                                this.markMaterial(rowId);
                                            }
                                            return;
                                        }
                                        if (index === 3) {
                                            this.cancelMarkMaterial();
                                            return;
                                        }
                                        if (index === 4) {
                                            if (isKeppSave) {
                                                this.cancelKeepSaveMaterial(
                                                    rowId
                                                );
                                            } else {
                                                this.keepSaveMaterial(rowId);
                                            }
                                            return;
                                        }
                                        if (index === 5) {
                                            this.cancelKeepSaveMaterial();
                                            return;
                                        }
                                    });
                            }
                        }
                    }
                }
            );
        },
    }
);
