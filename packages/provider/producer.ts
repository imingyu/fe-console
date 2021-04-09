import { FcProduct, IFcHotPatchProducer, IFcProducer } from "@fe-console/types";
import { PartialBy } from "@fe-console/types";
import { FcEventEmitter, now } from "@fe-console/util";
import { uuid } from "@mpkit/util";
/**
 * 生产者，只负责生产数据，其他一概不管
 */
export abstract class FcProducerImpl<T extends FcProduct = FcProduct>
    extends FcEventEmitter<T>
    implements IFcProducer<T> {
    constructor() {
        super();
    }
    change(id: string, data?: Partial<T>) {
        data = data || ({} as Partial<T>);
        data.id = id;
        this.emit("change", data as T);
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

export abstract class FcHotPatchProducerImpl<T extends FcProduct = FcProduct>
    extends FcProducerImpl<T>
    implements IFcHotPatchProducer<T> {
    abstract replace();
    abstract restore();
}
