import { removeEndZero } from "../../../common/util";
import {
    FcMethodExecStatus,
    FcMpApiMaterial,
    FcMpViewContextAny,
    FcMpViewContextBase,
} from "@fe-console/types";
import { FcMpComponent } from "../../mixins/view";
import { createLiaisonMixin } from "../../mixins/liaison";
import { MpViewType } from "@mpkit/types";
FcMpComponent<FcMpViewContextBase & FcMpViewContextAny>(
    createLiaisonMixin(MpViewType.Component, "fc-api-renderer"),
    {
        properties: {
            data: {
                type: Object,
                observer(val: FcMpApiMaterial) {
                    this.computeTime();
                },
            },
            size: {
                type: Number,
                value: 1,
            },
            selected: Boolean,
            outerClass: String,
        },
        data: {
            timeLevel: "",
            timeVal: "",
            timeUnit: "",
        },
        methods: {
            tap() {
                this.$fcDispatch("tap", this.$fcGetProp("data", {}).id);
            },
            tapInitiator() {
                this.$fcDispatch(
                    "tapInitiator",
                    this.$fcGetProp("data", {}).id
                );
            },
            computeTime(this: FcMpViewContextBase, isError: boolean = false) {
                const { startTime, endTime } = this.$fcGetProp("data", {});
                if (startTime && endTime) {
                    const total: number = endTime - startTime;
                    let timeUnit;
                    let timeVal;
                    let timeLevel = "1";
                    if (total < 1000) {
                        timeUnit = "ms";
                        timeVal = removeEndZero(total.toFixed(2));
                    } else if (total < 60 * 1000) {
                        timeUnit = "s";
                        timeVal = removeEndZero((total / 1000).toFixed(2));
                    } else if (total < 60 * 60 * 1000) {
                        timeUnit = "m";
                        timeVal = removeEndZero(
                            (total / (60 * 1000)).toFixed(2)
                        );
                    } else {
                        timeUnit = "h";
                        timeVal = removeEndZero(
                            (total / (60 * 60 * 1000)).toFixed(2)
                        );
                    }
                    // TODO:根据config中配置计算出性能level
                    this.setData({
                        isError,
                        timeUnit,
                        timeVal,
                        timeLevel,
                    });
                } else {
                    this.setData({
                        isError,
                    });
                }
            },
        },
    }
);
