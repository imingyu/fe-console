import { FcMpComponent } from "../../mixins/view";
import { createLiaisonMixin } from "../../mixins/liaison";
import { createVirtualListMixin } from "../../mixins/virtual-list";
import { MpViewType } from "@mpkit/types";
import { getMpInitLifeName } from "@mpkit/util";
import {
    FcConsoleProduct,
    FcMpApiProduct,
    FcMpComponentDataAny,
    FcMpComponentMethods,
    FcMpViewProduct,
    FcMpVirtualListComponent,
    FcMpVirtualListComponentMethods,
    FcProductType,
    FcRequireId,
} from "@fe-console/types";
import { FcMpApiMaterial, FcMpViewContextBase } from "@fe-console/types";
import { getApiCategoryList } from "../../../configure/index";
import { convertApiMaterial } from "../../../common/material";
FcMpComponent<FcMpVirtualListComponent & FcMpComponentDataAny>(
    createLiaisonMixin(MpViewType.Component, "fc-api-reader"),
    createVirtualListMixin(MpViewType.Component) as any,
    {
        properties: {
            active: {
                type: Boolean,
                value: false,
            },
        },
        data: {
            $vlItemStaticHeight: 40,
            $vlDebug: true,
            categoryList: getApiCategoryList(),
            activeCategory: "all",
            detailMaterialId: null,
        },
        methods: {
            addMaterial(data: Partial<FcMpApiProduct>) {
                const material = convertApiMaterial(data, this.$fcRunConfig);
                material.type && this.refreshCategory(material.type);
                this.addMaterialToCategory(material);
            },
            addMaterialToCategory(
                material: Partial<FcMpApiMaterial> & FcRequireId,
                map?: any
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
                            material.desc
                                ? material.desc
                                : readyItem && readyItem.desc
                                ? readyItem.desc
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
                                this.$vlAddItem(material);
                            }
                        }
                    } else {
                        delete this.FilterMaterialCategoryMap;
                        if (
                            category === this.data.activeCategory ||
                            this.data.activeCategory === "all"
                        ) {
                            this.$vlAddItem(material);
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
                } else {
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
                            item.desc ? item.desc : "",
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
                this.$vlClear();
                this.$vlAllList = [...allList];
                this.$vlListChange();
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
                    this.addMaterial(data);
                }
            },
            vlOnContainerHeightComputed() {
                this.setData({
                    $vlPageSize:
                        Math.ceil(
                            this.$vlContainerHeight /
                                this.data.$vlItemStaticHeight
                        ) + 5,
                });
            },
        },
        [getMpInitLifeName(MpViewType.Component)](
            this: FcMpVirtualListComponent
        ) {
            (global as any).sss = this;
            this.$vlInit();
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
                }
            });
        },
    }
);
