import { MpViewType } from "@mpkit/types";
import { MkSetDataPerformer, diffMpData, openMpData } from "@mpkit/set-data";
import { getMpInitLifeName, isEmptyObject } from "@mpkit/util";
import { FcMpViewContextBase } from "@fe-console/types";
const performer = new MkSetDataPerformer();
export const createSetDataMixin = (type: MpViewType) => {
    const methods = {
        $fcAsyncSetData(data: any) {
            const waitData = openMpData(data, this);
            if (this.$fcWaitData) {
                this.$fcWaitData = diffMpData(this.$fcWaitData, waitData);
            } else {
                this.$fcWaitData = waitData;
            }
            if (this.$fcAsyncSetDataTimer) {
                clearTimeout(this.$fcAsyncSetDataTimer);
            }
            this.$fcAsyncSetDataTimer = setTimeout(() => {
                this.$fcWaitData && this.setData(this.$fcWaitData);
                delete this.$fcWaitData;
                delete this.$fcAsyncSetDataTimer;
            });
        },
    };
    const rewriteUndefinedProp = (data) => {
        for (let prop in data) {
            const type = typeof data[prop];
            if (type === "undefined") {
                data[prop] = null;
            } else if (Array.isArray(data)) {
                data[prop].forEach((item, index) => {
                    rewriteUndefinedProp[item];
                    if (typeof item === "undefined") {
                        data[index] = null;
                    }
                });
            } else if (type === "object" && data[prop] && isEmptyObject(data[prop])) {
                rewriteUndefinedProp(data[prop]);
            }
        }
    };
    const mixin: any = {
        [getMpInitLifeName(type)](this: FcMpViewContextBase) {
            if (!this.$mkDiffSetDataBeforeValue) {
                this.$mkDiffSetDataBeforeValue = this.setData;
                this.setData = function (data, callback) {
                    rewriteUndefinedProp(data);
                    return performer.exec(this, data, callback);
                };
            }
        },
    };
    if (type === MpViewType.Component) {
        mixin.methods = methods;
    } else {
        Object.assign(mixin, methods);
    }
    return mixin;
};
