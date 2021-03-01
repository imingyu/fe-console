import { FcProduct, IFcStorager, IFcObserver } from "@fe-console/types";
import { FcEventEmitter, now } from "@fe-console/util";
import { uuid } from "@mpkit/util";
/**
 * 观察者
 */
export abstract class FcObserverImpl<
        W = string,
        T extends FcProduct = FcProduct,
        S extends FcProduct = T
    >
    extends FcEventEmitter<T>
    implements IFcObserver<W, T, S> {
    protected connected: boolean = false;
    constructor(public storager: IFcStorager<S>) {
        super();
    }
    call<R>(
        where: W,
        eid: string = uuid(),
        timeout: number = 10 * 1000
    ): Promise<R> {
        return (this.connected ? Promise.resolve() : this.connect()).then(
            () => {
                new Promise((resolve, reject) => {
                    this.storager.emit(`Request.${eid}`, ({
                        where,
                        id: eid,
                        time: now(),
                    } as unknown) as S);
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
    abstract connect(storager?: IFcStorager<S>): Promise<void>;
    abstract close();
}
