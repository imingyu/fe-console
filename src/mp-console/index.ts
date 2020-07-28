import { Storage } from "../storage";
import { nativeView } from "../index";
nativeView.Component({
    data: {
        visable: true,
        mounted: false,
        activeTabIndex: 0,
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
        tabData: {},
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
            this.setData({
                activeTabIndex: parseInt(e.currentTarget.dataset.tab),
            });
        },
    },
});
