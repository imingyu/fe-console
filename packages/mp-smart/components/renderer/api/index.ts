import { removeEndZero } from "../../../common/util";
import { FcMpViewContextBase } from "@fe-console/types";
import { FcMpComponent } from "../../mixins/view";
import { createLiaisonMixin } from "../../mixins/liaison";
import { MpViewType } from "@mpkit/types";
FcMpComponent(createLiaisonMixin(MpViewType.Component, "fc-api-renderer"), {
    properties: {
        data: {
            type: Object,
            observer() {
                this.computeTime();
            },
        },
        border: {
            type: Boolean,
            value: true,
        },
        size: {
            type: Number,
            value: 1,
        },
        selected: Boolean,
    },
    data: {
        timeLevel: "",
        timeVal: "",
        timeUnit: "",
    },
    methods: {
        computeTime(this: FcMpViewContextBase) {
            const { startTime, endTime } =
                this['data'].data || {};
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
                    timeVal = removeEndZero((total / (60 * 1000)).toFixed(2));
                } else {
                    timeUnit = "h";
                    timeVal = removeEndZero(
                        (total / (60 * 60 * 1000)).toFixed(2)
                    );
                }
                // TODO:根据config中配置计算出性能level
                this.setData({
                    timeUnit,
                    timeVal,
                    timeLevel,
                });
            }
        },
    },
});
