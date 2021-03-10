import { FcMpComponent } from "../../mixins/view";
import { createLiaisonMixin } from "../../mixins/liaison";
import { createVirtualListMixin } from "../../mixins/virtual-list";
import { MpViewType } from "@mpkit/types";
import { getMpInitLifeName } from "@mpkit/util";
import { getObserver } from "../../../common/provider";
import { FcMpMemoryObserver } from "@fe-console/core";
import {
    FcMethodExecStatus,
    FcMpApiProduct,
    FcProductType,
} from "@fe-console/types";
import { FcMpApiMaterial } from "@fe-console/types";
import { ApiCategoryMap, ApiCategoryList } from "../../../common/category";
FcMpComponent(
    createLiaisonMixin(MpViewType.Component, "fc-api-reader"),
    createVirtualListMixin(MpViewType.Component),
    {
        properties: {
            active: {
                type: Boolean,
                value: false,
            },
        },
        data: {
            categoryList: ApiCategoryList,
            activeCategory: "all",
        },
        methods: {
            addMaterial(data: Partial<FcMpApiProduct>) {
                const material: Partial<FcMpApiMaterial> = {
                    id: data.id,
                };
                if ("category" in data) {
                    material.name = data.category;
                    material.type = ApiCategoryMap[data.category] || "other";
                }
                if (
                    (
                        data.category ||
                        this.materialMark[data.id] ||
                        ""
                    ).endsWith("Sync") &&
                    "execEndTime" in data &&
                    !material.endTime
                ) {
                    material.endTime = data.execEndTime;
                }
                if ("time" in data) {
                    material.startTime = data.time;
                }
                if ("result" in data) {
                    material.result = data.result;
                }
                if ("status" in data) {
                    material.status = data.status;
                }
                if ("endTime" in data) {
                    material.endTime = data.endTime;
                }
                if ("request" in data) {
                    material.request = data.request;
                }
                if ("response" in data) {
                    material.response = data.response;
                }
                if (
                    !material.statusDesc &&
                    data.status === FcMethodExecStatus.Fail &&
                    data.response &&
                    data.response.length &&
                    data.response[0] &&
                    data.response[0].errMsg
                ) {
                    const arr = data.response[0].errMsg.split(":fail");
                    if (arr.length > 1) {
                        material.statusDesc = arr[1].trim();
                    } else {
                        material.statusDesc = data.response[0].errMsg;
                    }
                }
                if (!this.categoryMaterialMap) {
                    this.categoryMaterialMap = {};
                }
                const readyItem = this.categoryMaterialMap.all
                    ? this.categoryMaterialMap.all.find(
                          (item) => item.id === material.id
                      )
                    : null;
                if (readyItem) {
                    Object.assign(readyItem, material);
                } else {
                    if (!this.categoryMaterialMap.all) {
                        this.categoryMaterialMap.all = [];
                    }
                    this.categoryMaterialMap.all.push(material);
                }
                if (material.type || readyItem) {
                    const category = material.type || readyItem.type;
                    if (!this.categoryMaterialMap[category]) {
                        this.categoryMaterialMap[category] = [];
                    }
                    if (this.categoryMaterialMap[category].length) {
                        const typeReadyItem = this.categoryMaterialMap[category]
                            ? this.categoryMaterialMap[category].find(
                                  (item) => item.id === material.id
                              )
                            : null;
                        if (typeReadyItem) {
                            Object.assign(typeReadyItem, material);
                        } else {
                            this.categoryMaterialMap[category].push(material);
                        }
                    } else {
                        this.categoryMaterialMap[category].push(material);
                    }
                }
                const category = material.type
                    ? material.type
                    : readyItem
                    ? readyItem.type
                    : "";
                if (
                    category === this.data.activeCategory ||
                    this.data.activeCategory === "all"
                ) {
                    this.$vlAddItem(material);
                }
            },
            clearMaterial() {
                const activeCategory = this.data.activeCategory;
                if (activeCategory === "all") {
                    this.data.categoryList.forEach((item) => {
                        this.categoryMaterialMap[item] = [];
                    });
                    this.categoryMaterialMap["all"] = [];
                    this.categoryMaterialMap["other"] = [];
                } else {
                    this.categoryMaterialMap[activeCategory] = [];
                    this.categoryMaterialMap["all"] = this.categoryMaterialMap[
                        "all"
                    ].filter((item) => item.type !== activeCategory);
                }
                this.$vlClear();
                this.$vlAllList = [...this.categoryMaterialMap[activeCategory]];
                this.$vlTrySetShowList(
                    0,
                    this.data.$vlPageSize + this.data.$vlBufferSize - 1
                );
            },
            changeCategory(activeCategory) {
                this.setData({
                    activeCategory,
                });
                this.$vlClear();
                this.$vlAllList = [...this.categoryMaterialMap[activeCategory]];
                this.$vlTrySetShowList(
                    0,
                    this.data.$vlPageSize + this.data.$vlBufferSize - 1
                );
            },
        },
        [getMpInitLifeName(MpViewType.Component)]() {
            (global as any).ssd = this;
            this.categoryMaterialMap = {};
            this.data.categoryList.forEach((item) => {
                this.categoryMaterialMap[item] = [];
            });

            const observer: FcMpMemoryObserver = getObserver();
            if (observer) {
                observer.on("data", (type, data) => {
                    if (data.type === FcProductType.MpApi) {
                        if (!this.materialMark) {
                            this.materialMark = {};
                        }
                        this.materialMark[data.id] = data.category;
                        this.addMaterial(data);
                    }
                });
                observer.on("change", (type, data) => {
                    if (this.materialMark && this.materialMark[data.id]) {
                        this.addMaterial(data);
                    }
                });
            }

            this.$fcOn(`Dispatch.${this.$cid}`, (type, data) => {
                if (data.child.$tid === "fc-filter-bar") {
                    type = data.type;
                    if (type === "category") {
                        this.changeCategory(data.data);
                    } else if (type === "clear") {
                        this.clearMaterial();
                    }
                }
            });
        },
    }
);
