import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { getMpInitLifeName } from "@mpkit/util";
import { MkApi } from "@mpkit/mixin";
import { isFullScreenPhone } from "../../common/util";
FcMpComponent(createLiaisonMixin(MpViewType.Component, "fc-main"), {
    data: {
        visable: true,
        mounted: false,
        fullScreen: false,
        activeTabIndex: 2,
        isFullScreenPhone: false,
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
        isFullScreenPhone().then((res) => {
            this.setData({
                isFullScreenPhone: res,
            });
        });
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
        ad() {
            (MkApi as any).setClipboardData({
                data: "https://github.com/imingyu/fe-console",
            });
            (MkApi as any).showModal({
                title: "感谢使用",
                content:
                    "感谢使用FeConsole组件！可前往Github@imingyu/fe-console主页查看更多信息。\n（主页地址已复制到剪切板）",
                showCancel: false,
            });
        },
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
