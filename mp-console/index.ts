import {
    rewriteMpApi,
    rewriteMpView,
    rewriteMpConsole,
    FecStorage,
} from "@fe-console/core";
const mpcStorage = new FecStorage();
rewriteMpApi(mpcStorage);
rewriteMpView(mpcStorage);
rewriteMpConsole(mpcStorage);
