import { FcMpComponent } from "../mixins/view";
import { createLiaisonMixin } from "../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { getMpInitLifeName, getApiVar } from "@mpkit/util";
import { isFullScreenPhone } from "../../common/util";
import { FcMpViewContextAny, FcMpViewContextBase } from "@fe-console/types";
const destoryLife = 'detached';
FcMpComponent<FcMpViewContextBase & FcMpViewContextAny>(
    createLiaisonMixin(MpViewType.Component, "fc-main"),
    {
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
                this.setData(
                    {
                        isFullScreenPhone: res,
                    },
                    () => {
                        this.emitContainerSizeChange();
                    }
                );
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

            const api = getApiVar();
            if (api && typeof api.onWindowResize === "function") {
                api.onWindowResize(this.emitContainerSizeChange);
            }
        },
        [destoryLife as any]() {
            const api = getApiVar();
            if (api && typeof api.offWindowResize === "function") {
                api.offWindowResize(this.emitContainerSizeChange);
            }
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
                this.emitContainerSizeChange();
            },
            emitContainerSizeChange() {
                this.$fcEmit("FcConatinerSizeChange");
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
    }
);
