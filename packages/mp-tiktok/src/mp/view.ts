import { MpViewType } from "@fe-console/types/node_modules/@mpkit/types/spec";
import { MkComponent, MkNative } from "@mpkit/mixin";
import { diffMpData } from "@mpkit/set-data";
import { createSetDataMixin } from "./mixins/set-data";

export const FcMpComponent = (...mixins) => {
    mixins.splice(0, 0, createSetDataMixin(MpViewType.Component));
    //
    return MkNative.Component(MkComponent.apply(null, mixins));
};
