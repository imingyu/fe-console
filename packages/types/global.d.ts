import { MpApiVar, MpViewFactory } from "@mpkit/types";

declare global {
    var getApp: Function;
    var getCurrentPages: Function;
    var wx: MpApiVar;
    var my: MpApiVar;
    var swan: MpApiVar;
    var tt: MpApiVar;
    var App: MpViewFactory;
    var Page: MpViewFactory;
    var Component: MpViewFactory;
}
