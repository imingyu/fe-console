import { FcMpComponent } from "../../mixins/view";
import { createLiaisonMixin } from "../../mixins/liaison";
import { createVirtualListMixin } from "../../mixins/virtual-list";
import { MpViewType } from "@mpkit/types";
FcMpComponent(
    createLiaisonMixin(MpViewType.Component, "fc-api-reader"),
    createVirtualListMixin(MpViewType.Component),
    {
        properties: {
            data: Array,
        },
        data: {},
        methods: {},
    }
);
