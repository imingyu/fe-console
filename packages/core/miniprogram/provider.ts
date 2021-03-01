import { FcProducerImpl } from "@fe-console/provider";
import {
    FcConsoleProduct,
    FcMpApiProduct,
    FcMpHookInfo,
    FcMpViewProduct,
    IFcProducer,
} from "@fe-console/types";
import { hookMpView } from "./hook-view";
import { hookMpApi } from "./hook-api";
import { hookConsole } from "../hook-console";

export const FcMpProducerRunHandler = (producer: FcMpProducer) => {
    const hookState: FcMpHookInfo = {
        productMap: {},
    };
    hookMpApi(hookState, producer as IFcProducer<FcMpApiProduct>);
    hookMpView(hookState, producer as IFcProducer<FcMpViewProduct>);
    hookConsole(producer as IFcProducer<FcConsoleProduct>);
};

export class FcMpProducer extends FcProducerImpl<
    FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
> {
    constructor() {
        super(FcMpProducerRunHandler);
    }
}
