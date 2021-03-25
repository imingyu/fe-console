import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { FcMpViewContextAny, FcMpViewContextBase } from "@fe-console/types";
FcMpComponent<FcMpViewContextBase & FcMpViewContextAny>(createLiaisonMixin(MpViewType.Component, "fc-filter-bar"), {
    properties: {
        filter: {
            type: Boolean,
            value: true,
        },
        filterPlaceholder: {
            type: String,
            value: "Filter",
        },
        remove: {
            type: Boolean,
            value: false,
        },
        clear: {
            type: Boolean,
            value: false,
        },
        activeCategory: String,
        categorys: Array,
    },
    methods: {
        onFilterConfirm(e) {
            const text = e.detail.value;
            this.$fcDispatch("filter", text);
        },
        onClear() {
            this.$fcDispatch("clear");
        },
        onRemove() {
            this.$fcDispatch("remove");
        },
        tapCategory(e) {
            this.$fcDispatch("category", e.currentTarget.dataset.val);
        },
    },
});
