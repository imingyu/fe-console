import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { FcMpViewContextAny, FcMpViewContextBase } from "@fe-console/types";
FcMpComponent<FcMpViewContextBase & FcMpViewContextAny>(createLiaisonMixin(MpViewType.Component, "fc-collapse"), {
    options: {
        multipleSlots: true,
    },
    properties: {
        open: {
            type: Boolean,
            value: true,
        },
        title: String,
        border: {
            type: Boolean,
            value: true,
        },
    },
    methods: {
        toggle(e) {
            this.$fcDispatch("toggle");
        },
    },
});
