import { FcEventEmitter } from "@fe-console/util";

const ev = new FcEventEmitter();
export const on = ev.on;
export const off = ev.off;
export const emit = ev.emit;
export const once = ev.once;
