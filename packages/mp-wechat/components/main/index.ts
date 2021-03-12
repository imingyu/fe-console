import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { getMpInitLifeName } from "@mpkit/util";
FcMpComponent(createLiaisonMixin(MpViewType.Component, "fc-main"), {
    data: {
        visable: true,
        mounted: false,
        fullScreen: false,
        activeTabIndex: 2,
        tabs: [
            {
                text: "全部",
                value: "all",
            },
            {
                text: "Console",
                value: "console",
            },
            {
                text: "Api",
                value: "api",
            },
            {
                text: "网络",
                value: "network",
            },
            {
                text: "View",
                value: "view",
            },
            {
                text: "事件",
                value: "event",
            },
            {
                text: "Storage",
                value: "storage",
            },
            {
                text: "系统",
                value: "system",
            },
        ],
    },
    [getMpInitLifeName(MpViewType.Component)]() {
        this.$fcOn(`Dispatch.${this.$cid}`, (t, data) => {
            if (
                data.child.$tid === "fc-tabs" &&
                data.child.$fcGetProp("tidAlias") === "FcProductTypeTabs"
            ) {
                if (data.type === "changeTab") {
                    console.log(`activeTabIndex=${data.data}`);
                    this.setData({
                        activeTabIndex: data.data,
                    });
                }
            }
        });
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
