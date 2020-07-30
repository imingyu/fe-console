import { native, storage } from "../index";
native.Component({
    data: {
        visable: true,
        mounted: false,
        activeTabIndex: 3,
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
            const activeTabIndex = parseInt(e.currentTarget.dataset.tab);
            this.setData({
                activeTabIndex,
            });
            if (this.data.tabs[activeTabIndex].value === "view") {
                this.setTabData(this.data.tabs[activeTabIndex].value, [
                    storage.getMpViewElementSpec("app"),
                ]);
            }
        },
        setTabData(tabValue, data) {
            if (!this.data.tabData[tabValue]) {
                this.setData({
                    [`tabData.${tabValue}`]: data,
                });
            }
        },
        tapViewItem(e) {
            const mpcId = e.currentTarget.dataset.key;
            const view = storage.getMpViewDetail(mpcId);
            if(view){
                
            }
        },
    },
});
