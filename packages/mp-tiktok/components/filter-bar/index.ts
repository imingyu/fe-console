import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";
FcMpComponent(createLiaisonMixin(MpViewType.Component, "fc-filter-bar"), {
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
        categorys: {
            type: Array,
            value: [],
            observer(val) {
                this.setCategory(val);
            },
        },
    },
    data: {
        categoryMap: {},
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
        setCategory(categorys) {
            this.setData({
                categoryMap: categorys.reduce((sum, item: string) => {
                    if (item === "xhr") {
                        sum[item] = "XHR";
                    } else if (item === "ws") {
                        sum[item] = "WS";
                    } else {
                        sum[item] = item[0].toUpperCase() + item.substr(1);
                    }
                    return sum;
                }, {}),
            });
        },
    },
});
