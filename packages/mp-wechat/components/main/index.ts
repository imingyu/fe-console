import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";
FcMpComponent(createLiaisonMixin(MpViewType.Component, "fc-main"), {
    data: {
        visable: true,
        mounted: false,
        fullScreen: false,
        activeTabIndex: 2,
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
                name: "Api",
                value: "api",
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
        toggleZoom() {
            this.setData({
                fullScreen: !this.data.fullScreen,
            });
        },
        close() {
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
});
