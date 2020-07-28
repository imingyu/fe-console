import { rewriteMP, rewriteConsole, rewriteView } from "./rewrite";
import { Storage } from "./storage";
declare var wx: object;
declare var my: object;
declare var swan: object;
declare var tt: object;
declare var App: Function;
declare var Page: Function;
declare var Component: Function;

const storage = new Storage();

// 重写小程序顶级对象
if (typeof wx === "object") {
    wx = rewriteMP(wx, storage);
} else if (typeof my === "object") {
    my = rewriteMP(my, storage);
} else if (typeof swan === "object") {
    swan = rewriteMP(swan, storage);
} else if (typeof tt === "object") {
    tt = rewriteMP(tt, storage);
}

// 重写console
console = rewriteConsole(console, storage);
export const nativeView = {
    App,
    Page,
    Component,
};
App = rewriteView(App, "App", storage);
Page = rewriteView(Page, "Page", storage);
Component = rewriteView(Component, "Component", storage);
