import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { createVirtualListMixin } from "../mixins/virtual-list";
import { MpViewType } from "@mpkit/types";
FcMpComponent(
    createLiaisonMixin(MpViewType.Component, "fc-main"),
    createVirtualListMixin(MpViewType.Component),
    {
        properties: {
            data: Array,
        },
        data: {},
        methods: {},
    }
);
