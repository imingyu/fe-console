import { FcMemoryStoragerImpl, FcProducerImpl } from "@fe-console/provider";
import {
    FcConsoleProduct,
    IFcProducer,
    FcCommonProduct,
} from "@fe-console/types";
import { hookConsole } from "../hook-console";
export class FcWebProducer extends FcProducerImpl<
    FcCommonProduct | FcConsoleProduct
> {
    constructor() {
        super();
        hookConsole(this as IFcProducer<FcConsoleProduct>);
    }
}

export class FcWebMemoryStorager extends FcMemoryStoragerImpl<
    FcCommonProduct | FcConsoleProduct
> {}
