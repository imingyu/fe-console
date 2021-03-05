import {
    FcProducerRunHandler,
    FcProduct,
    IFcProducer,
} from "@fe-console/types";
import { PartialBy } from "@fe-console/types";
import { FcEventEmitter, now } from "@fe-console/util";
import { uuid } from "@mpkit/util";
/**
 * 生产者，只负责生产数据，其他一概不管
 */
export abstract class FcProducerImpl<T extends FcProduct = FcProduct>
    extends FcEventEmitter<T>
    implements IFcProducer<T> {
    constructor(run: FcProducerRunHandler<T>) {
        super();
        run(this);
    }
    create(data: PartialBy<T, "id" | "time">) {
        if (!data.id) {
            data.id = uuid();
        }
        if (!data.time) {
            data.time = now();
        }
        this.emit("data", data as T);
        return data as T;
    }
}
