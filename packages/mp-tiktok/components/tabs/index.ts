import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { FcMpViewContextAny, FcMpViewContextBase } from "@fe-console/types";
FcMpComponent<FcMpViewContextBase & FcMpViewContextAny>(createLiaisonMixin(MpViewType.Component, "fc-tabs"), {
    options: {
        multipleSlots: true,
    },
    properties: {
        tabs: Array,
        active: Number,
        outerClass: String,
        direction: {
            type: String,
            value: "horizontal", // horizontal, vertical
        },
        position: {
            type: String,
            value: "top", // top,left
        },
    },
    data: {},
    methods: {
        tapTab(e) {
            const index = parseInt(e.currentTarget.dataset.tab);
            this.$fcDispatch("changeTab", index);
        }
    },
});
