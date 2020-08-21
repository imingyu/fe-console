import {
    rewriteApi,
    rewriteView,
    rewriteConsole,
    FecStorage,
} from "@fe-console/core";
const mpcStorage = new FecStorage();
const Api = rewriteApi(mpcStorage);
rewriteView(mpcStorage);
rewriteConsole(mpcStorage);
if (typeof Api === "object") {
    Api.$mpcStorage = mpcStorage;
}
