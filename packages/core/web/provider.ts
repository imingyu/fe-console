import { FcProducerImpl } from "@fe-console/provider";
import {
    FcConsoleProduct,
    FcMpApiProduct,
    FcMpHookInfo,
    FcMpViewProduct,
    IFcProducer,
    FcCommonProduct,
} from "@fe-console/types";
import { hookConsole } from "../hook-console";

export const FcWebProducerRunHandler = (producer: FcWebProducer) => {
    hookConsole(producer as IFcProducer<FcConsoleProduct>);
};

export class FcWebProducer extends FcProducerImpl<
    FcCommonProduct | FcConsoleProduct
> {
    constructor() {
        super(FcWebProducerRunHandler);
    }
}
