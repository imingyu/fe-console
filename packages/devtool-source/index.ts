import {
    rewriteApi,
    rewriteView,
    rewriteConsole,
    MpcStorage,
} from "@mp-console/core";
const mpcStorage = new MpcStorage();
const Api = rewriteApi(mpcStorage);
rewriteView(mpcStorage);
rewriteConsole(mpcStorage);
if (typeof Api === "object") {
    Api.$mpcStorage = mpcStorage;
}
