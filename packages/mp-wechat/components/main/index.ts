import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { createVirtualListMixin } from "../mixins/virtual-list";
import { MpViewType } from "@mpkit/types";
FcMpComponent(
    createLiaisonMixin(MpViewType.Component, "fc-main"),
    createVirtualListMixin(MpViewType.Component),
    {
        data: {
            visable: true,
            mounted: false,
            activeTabIndex: 6,
            tabs: [
                {
                    name: "全部",
                    value: "all",
                },
                {
                    name: "Console",
                    value: "console",
                },
                {
                    name: "网络",
                    value: "network",
                },
                {
                    name: "View",
                    value: "view",
                },
                {
                    name: "事件",
                    value: "event",
                },
                {
                    name: "Storage",
                    value: "storage",
                },
                {
                    name: "Api",
                    value: "api",
                },
                {
                    name: "系统",
                    value: "system",
                },
            ],
        },
        methods: {
            noop() {},
            toggleVisable() {
                this.setData({
                    visable: !this.data.visable,
                    mounted: true,
                });
            },
            closeModal() {
                this.setData({
                    visable: false,
                });
            },
            setTab(e) {
                const activeTabIndex = parseInt(e.currentTarget.dataset.tab);
                this.setData({
                    activeTabIndex,
                });
            },
        },
    }
);
