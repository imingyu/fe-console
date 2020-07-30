import MpcConfig from "./config";
import { rewriteMP, rewriteConsole, rewriteView } from "./rewrite";
import { getDataView } from "./viewer";
import { Storage } from "./storage";
import { MpViewType, MpPlatfrom } from "./vars";
import { MP_PLATFORM, MP_API_VAR } from "./util";
global.getDataView = getDataView;
export const native = {
    App,
    Page,
    Component,
    ApiVar: MP_API_VAR,
    console,
};
export const storage = new Storage();
export const MpcConsole = rewriteConsole(console, storage);
export const MpcApp = rewriteView(App, MpViewType.App, storage);
export const MpcPage = rewriteView(Page, MpViewType.Page, storage);
export const MpcComponent = rewriteView(
    Component,
    MpViewType.Component,
    storage
);
export const MpcApiVar = rewriteMP(MP_API_VAR, storage);

// 根据配置重写相关对象
// 重写小程序顶级对象
if (MpcConfig.rewrite) {
    if (MpcConfig.rewrite.console) {
        console = MpcConsole;
    }
    if (MpcConfig.rewrite.app) {
        App = MpcApp;
    }
    if (MpcConfig.rewrite.page) {
        Page = MpcPage;
    }
    if (MpcConfig.rewrite.component) {
        Component = MpcComponent;
    }
    if (MpcConfig.rewrite.api) {
        if (MP_PLATFORM === MpPlatfrom.wechat) {
            wx = MpcApiVar;
        } else if (MP_PLATFORM === MpPlatfrom.alipay) {
            my = MpcApiVar;
        } else if (MP_PLATFORM === MpPlatfrom.smart) {
            swan = MpcApiVar;
        } else if (MP_PLATFORM === MpPlatfrom.tiktok) {
            tt = MpcApiVar;
        }
    }
}
