import { IFcEventEmitter, FcEventHandler } from "@fe-console/types";
export class FcEventEmitter<T = any> implements IFcEventEmitter<T> {
    private events: {
        [prop: string]: FcEventHandler<T>[];
    } = {};
    constructor() {
        ["on", "off", "emit"].forEach((prop) => {
            this[prop] = this[prop].bind(this);
        });
    }
    once(type: string, _handler: FcEventHandler<T>) {
        const handler = (...args) => {
            _handler.apply(null, args);
            this.off(type, handler);
        };
        this.on(type, handler);
    }
    destory() {
        this.emit("destory");
        for (let prop in this.events) {
            delete this.events[prop];
        }
    }
    on(type: string, handler: FcEventHandler<T>) {
        if (!this.events[type]) {
            this.events[type] = [];
        }
        if (this.events[type].indexOf(handler) === -1) {
            this.events[type].push(handler);
        }
    }
    off(type: string, handler?: FcEventHandler<T>) {
        if (this.events[type]) {
            if (handler) {
                const index = this.events[type].indexOf(handler);
                index !== -1 && this.events[type].splice(index, 1);
            } else {
                delete this.events[type];
            }
        }
    }
    emit(type: string, data?: T) {
        this.events[type] &&
            this.events[type].forEach((handler) => {
                handler(type, data);
            });
    }
}
