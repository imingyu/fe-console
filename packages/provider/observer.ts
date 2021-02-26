import { FcProduct, IFcStorager, IFcObserver } from "@fe-console/types";
import { FcEventEmitter, now } from "@fe-console/util";
import { uuid } from "@mpkit/util";
/**
 * 观察者
 */
export abstract class FcObserverImpl<T = any>
    extends FcEventEmitter<FcProduct<T>>
    implements IFcObserver<T> {
    protected connected: boolean = false;
    constructor(public storager: IFcStorager<T>) {
        super();
    }
    call<R>(
        where: T,
        eid: string = uuid(),
        timeout: number = 10 * 1000
    ): Promise<R> {
        return (this.connected ? Promise.resolve() : this.connect()).then(
            () => {
                new Promise((resolve, reject) => {
                    this.storager.emit(`Request.${eid}`, {
                        data: where,
                        time: now(),
                        id: eid,
                    });
                    let timer = setTimeout(() => {
                        reject(new Error("Timeout"));
                    }, timeout);
                    this.storager.once(`Response.${eid}`, (type, data) => {
                        timer && clearTimeout(timer);
                        resolve(data);
                    });
                    this.storager.once(
                        `Response.Error.${eid}`,
                        (type, data) => {
                            timer && clearTimeout(timer);
                            reject(
                                data && data.data
                                    ? data.data
                                    : new Error(
                                          typeof data === "string"
                                              ? data
                                              : "未知错误"
                                      )
                            );
                        }
                    );
                });
            }
        ) as Promise<R>;
    }
    abstract connect(storager?: IFcStorager<T>): Promise<void>;
    abstract close();
}
