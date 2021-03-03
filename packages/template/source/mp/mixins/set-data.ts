import { MpViewType } from "@mpkit/types";
import { MkSetDataPerformer } from "@mpkit/set-data";
import { MixinStore } from "@mpkit/mixin";
import { getMpInitLifeName, uuid, getMpPlatform, getMpViewType } from "@mpkit/util";
import { FcMpViewContextBase } from "@fe-console/types";
export const createSetDataMixin = (type: MpViewType) => {
    const methods = {};
    const mixin: any = {
        [getMpInitLifeName(type)](this: FcMpViewContextBase) {
            this.$mkNativeSetData = this.setData;
            this.setData = function betterSetData(
                ...args
            ) {
            };
        },
    };
    if (type === MpViewType.Component) {
        mixin.methods = methods;
    } else {
        Object.assign(mixin, methods);
    }
    return mixin;
};
