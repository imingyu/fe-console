import { FcMpComponent } from "../../mixins/view";
import { createLiaisonMixin } from "../../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { getMpInitLifeName } from "@mpkit/util";
import {
    FcConsoleProduct,
    FcMpApiProduct,
    FcMpApiReaderComponent,
    FcMpApiReaderComponentMethods,
    FcMpComponentMethods,
    FcMpDataGridComponentMethods,
    FcMpViewProduct,
    FcMpVirtualListComponent,
    FcProductType,
    FcRequireId,
} from "@fe-console/types";
import { FcMpApiMaterial, FcMpViewContextBase } from "@fe-console/types";
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
            addMaterial(data: Partial<FcMpApiProduct>) {
                const material = convertApiMaterial(data, this.$fcRunConfig);
                material.type && this.refreshCategory(material.type);
                this.addMaterialToCategory(material);
            },
            addMaterialToCategory(
                material: Partial<FcMpApiMaterial> & FcRequireId,
                map
            ) {
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
                    this.$DataGridMain.$vlClear();
                    this.$DataGridMain.$vlAllList = [...allList];
                    this.$DataGridMain.$vlListChange();
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
                this.initMaterialCategoryMap(true);
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
                if (this.filterKeyword) {
                    this.reloadVlList(
                        this.FilterMaterialCategoryMap[activeCategory]
                    );
                } else {
                    this.reloadVlList(
                        this.NormalMaterialCategoryMap[activeCategory]
                    );
                }
            },
            onFcObserverEvent(
                type: string,
                data: FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
            ) {
                if (
                    data.type === FcProductType.MpApi ||
                    (this.materialMark && this.materialMark[data.id])
                ) {
                    if (!this.materialMark) {
                        this.materialMark = {};
                    }
                    if (data.category) {
                        this.materialMark[data.id] = data.category;
                    } else if (!this.materialMark[data.id]) {
                        this.materialMark[data.id] = "other";
                    }
                    this.addMaterial(data as FcMpApiProduct);
                }
            },
            appendDataToGrid(material) {
                if (this.$DataGridMain) {
                    this.$DataGridMain.$vlAddItem(material);
                    return;
                }
                if (!this.dataGridWaitMaterials) {
                    this.dataGridWaitMaterials = [];
                }
                this.dataGridWaitMaterials.push(material);
            },
        } as FcMpApiReaderComponentMethods &
            FcMpComponentMethods<FcMpApiReaderComponent>,
        [getMpInitLifeName(MpViewType.Component)](
            this: FcMpApiReaderComponent
        ) {
            setTimeout(() => {
                this.refreshCategory();
            }, 400);
            this.$fcOn(`Dispatch.${this.$cid}`, (type, data) => {
                if (data.child.$tid === "fc-filter-bar") {
                    type = data.type;
                    if (type === "category") {
                        this.changeCategory(data.data);
                    } else if (type === "clear") {
                        this.clearMaterial();
                    } else if (type === "filter") {
                        this.filterMaterial(data.data);
                    }
                } else if (data.child.$tid === "fc-api-renderer") {
                    type = data.type;
                    if (type === "tap") {
                        this.setDetailMaterial(data.data, 0);
                    } else if (type === "tapInitiator") {
                        this.setDetailMaterial(data.data, 3);
                    }
                } else if (data.child.$tid === "fc-api-detail") {
                    type = data.type;
                    if (type === "close") {
                        this.setDetailMaterial();
                    } else if (type === "changeTab") {
                        this.setData({
                            detailTab: data.data,
                        });
                    }
                } else if (data.child.$tid === "fc-data-grid") {
                    type = data.type;
                    if (type === "ready") {
                        this.$DataGridMain = data.child;
                        if (this.dataGridWaitMaterials) {
                            this.dataGridWaitMaterials.forEach((item) => {
                                this.$DataGridMain.$vlAddItem(item);
                            });
                            delete this.dataGridWaitMaterials;
                        }
                    }
                }
            });
        },
    }
);
