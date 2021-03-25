import { FcMpComponent } from "../../mixins/view";
import { createLiaisonMixin } from "../../mixins/liaison";
import { MpViewType } from "@mpkit/types";
import { convertApiDetail } from "../../../common/material";
import { getMpInitLifeName } from "@mpkit/util";
import { FcMpApiProduct, FcMpViewContextAny, FcMpViewContextBase } from "@fe-console/types";
FcMpComponent<FcMpViewContextBase & FcMpViewContextAny>(createLiaisonMixin(MpViewType.Component, "fc-api-detail"), {
    properties: {
        data: {
            type: String,
            observer() {
                this.setDetailData();
            },
        },
        tab: {
            type: Number,
            observer(val) {
                this.setData({
                    activeTabIndex: val,
                });
            },
        },
    },
    data: {
        loading: true,
        error: "",
        tabs: [
            {
                text: "Headers",
                value: "headers",
            },
            {
                text: "Preview",
                value: "preview",
            },
            {
                text: "Response",
                value: "response",
            },
            {
                text: "Initiator",
                value: "initiator",
            },
        ],
        activeTabIndex: 0,
        detail: null,
        headersCollapseOpenState: {
            s1: true,
            s2: true,
            s3: true,
            s4: true,
            s31: true,
        },
    },
    [getMpInitLifeName(MpViewType.Component)]() {
        this.$fcOn(`Dispatch.${this.$cid}`, (type, data) => {
            if (data.child.$tid === "fc-collapse") {
                const tidAlias = data.child.$fcGetProp("tidAlias") as string;
                if (tidAlias.startsWith("ApiCollapse")) {
                    const target = tidAlias.substr("ApiCollapse".length);
                    type = data.type;
                    if (type === "toggle") {
                        this.setData({
                            headersCollapseOpenState: {
                                ["s" + target]: !this.data
                                    .headersCollapseOpenState["s" + target],
                            },
                        });
                    }
                }
            } else if (data.child.$tid === "fc-tabs") {
                const tidAlias = data.child.$fcGetProp("tidAlias") as string;
                if (tidAlias === "FcApiDetailTabs") {
                    type = data.type;
                    if (type === "changeTab") {
                        this.$fcDispatch("changeTab", data.data);
                    }
                }
            }
        });
    },
    methods: {
        close() {
            this.$fcDispatch("close");
        },
        setDetailData() {
            this.setData({
                loading: true,
            });
            const data = this.$fcGetProp("data");
            if (typeof data === "string") {
                if (!this.$fcObserver) {
                    return this.setData({
                        loading: false,
                        error: "未找到观察者，无法根据ID查询数据",
                    });
                }
                this.$fcObserver
                    .call<Array<FcMpApiProduct>>(data)
                    .then((res) => {
                        if (this.$fcComponentIsDeatoryed) {
                            return;
                        }
                        if (res && res.length) {
                            const detail = convertApiDetail(res[0]);
                            const tabs = this.data.tabs;
                            if (detail.cookies && detail.cookies.length) {
                                tabs.push({
                                    text: "Cookies",
                                    value: "cookies",
                                });
                            }
                            this.setData({
                                tabs,
                                loading: false,
                                error: "",
                                detail,
                            });
                            return;
                        }
                        return Promise.reject();
                    })
                    .catch((err) => {
                        this.setData({
                            loading: false,
                            error:
                                err && err.message
                                    ? err.message
                                    : "未知错误，无法获取详情数据",
                            detail: null,
                        });
                    });
            } else if (data) {
                this.setData({
                    loading: false,
                    error: "",
                    detail: data,
                });
            } else {
                this.setData({
                    loading: false,
                    error: "请传递有效的数据",
                    detail: null,
                });
            }
        },
    },
});
