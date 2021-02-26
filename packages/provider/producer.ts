import {
    FcProducerRunHandler,
    FcProduct,
    IFcProducer,
} from "@fe-console/types";
import { FcEventEmitter, now } from "@fe-console/util";
import { uuid } from "@mpkit/util";
/**
 * 生产者，只负责生产数据，其他一概不管
 */
export abstract class FcProducerImpl<T = any>
    extends FcEventEmitter<FcProduct<T>>
    implements IFcProducer<T> {
    constructor(run: FcProducerRunHandler<T>) {
        super();
        run(this);
    }
    create(data: T, time: number = now(), id: string = uuid()) {
        this.emit("data", {
            data,
            time,
            id,
        });
    }
}
