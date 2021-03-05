import { MpViewType } from "@mpkit/types";
import { MkComponent, MkNative } from "@mpkit/mixin";
import { diffMpData } from "@mpkit/set-data";
import { createSetDataMixin } from "./set-data";

export const FcMpComponent = (...mixins) => {
    mixins.splice(0, 0, createSetDataMixin(MpViewType.Component));
    // 针对平台处理props不需要  
    return MkNative.Component(MkComponent.apply(null, mixins));
};
