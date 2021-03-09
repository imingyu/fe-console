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
        data: {},
        methods: {
            addMaterial(data: Partial<FcMpApiProduct>) {
                const material: Partial<FcMpApiMaterial> = {
                    id: data.id,
                };
                if ("category" in data) {
                    material.name = data.category;
                    // TODO: 对API进行分类
                    material.type = data.category;
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
                this.$vlAddItem(material);
            },
        },
        [getMpInitLifeName(MpViewType.Component)]() {
            const observer: FcMpMemoryObserver = getObserver();
            if (observer) {
                observer.on("data", (type, data) => {
                    if (data.type === FcProductType.MpApi) {
                        this.addMaterial(data);
                    }
                });
                observer.on("change", (type, data) => {
                    if (data.type === FcProductType.MpApi) {
                        this.addMaterial(data);
                    }
                });
            }
        },
    }
);
