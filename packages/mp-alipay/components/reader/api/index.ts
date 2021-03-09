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
        data: {},
        methods: {
            addMaterial(data: Partial<FcMpApiProduct>): FcMpApiMaterial {
                if (!this.$vlAllList) {
                    this.$vlAllList = [];
                }
                const readyItem: FcMpApiMaterial = this.$vlAllList.find(
                    (item) => item.id === data.id
                );
                const material: FcMpApiMaterial = readyItem || {
                    id: data.id,
                    // TODO: 对API进行分类
                    type: data.category,
                    name: data.category,
                    status: data.status,
                    startTime: data.time,
                    initiator: {
                        type: "",
                    },
                    result: data.result,
                };
                if (
                    data.status === FcMethodExecStatus.Success ||
                    data.status === FcMethodExecStatus.Fail
                ) {
                    material.endTime = data.endTime;
                }
                if (!readyItem) {
                    this.$vlPushItem(material);
                }
                return material;
            },
        },
        [getMpInitLifeName(MpViewType.Component)]() {
            const observer: FcMpMemoryObserver = getObserver();
            if (observer) {
                observer.on("data", (type, data) => {
                    if (data.type === FcProductType.MpApi) {
                        this.$vlPushItem(data);
                    }
                });
            }
        },
    }
);
