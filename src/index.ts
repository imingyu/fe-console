import { rewriteMP, rewriteConsole, rewriteView } from "./rewrite";
import { Storage } from "./storage";
export var wx: object;
export var my: object;
export var swan: object;
export var tt: object;
export var App: Function;
export var Page: Function;
export var Component: Function;

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
App = rewriteView(App, "App", storage);
Page = rewriteView(Page, "Page", storage);
Component = rewriteView(Component, "Component", storage);
