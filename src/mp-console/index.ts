import { Storage } from "../storage";
declare var Component: Function;
Component({
    data: {
        visable: false,
        mounted: false,
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
                name: "Storage",
                value: "storage",
            },
            {
                name: "系统",
                value: "system",
            }
        ],
    },
});
