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
    storager?: IFcStorager<S>;
    protected connected: boolean = false;
    call<R>(
        where: W,
        eid: string = uuid(),
        timeout: number = 10 * 1000
    ): Promise<R> {
        return (this.connected ? Promise.resolve() : this.connect()).then(
            () => {
                return new Promise((resolve, reject) => {
                    let timer = setTimeout(() => {
                        reject(new Error("Timeout"));
                    }, timeout);
                    this.storager.once(`Response.${eid}`, (type, data) => {
                        timer && clearTimeout(timer);
                        resolve(data as unknown as R);
                    });
                    this.storager.once(
                        `Response.Error.${eid}`,
                        (type, data) => {
                            timer && clearTimeout(timer);
                            reject(
                                new Error(
                                    typeof data === "string" ? data : "未知错误"
                                )
                            );
                        }
                    );
                    this.storager.emit("Request", ({
                        where,
                        id: eid,
                        time: now(),
                    } as unknown) as S);
                });
            }
        ) as Promise<R>;
    }
    abstract connect(storager?: IFcStorager<S>): Promise<void>;
    abstract close();
}
