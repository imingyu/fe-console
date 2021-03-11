import {
    IFcProducer,
    FcConsoleProduct,
    FcProductType,
    FcProductFilter,
} from "@fe-console/types";
import { $$getStack } from "@fe-console/util";
import { uuid } from "@mpkit/util";
export const hookConsole = (
    producer: IFcProducer<FcConsoleProduct>,
    filter?: FcProductFilter<FcConsoleProduct, FcProductType>
) => {
    if (typeof console === "object" && console) {
        Object.keys(console).forEach((key) => {
            const method = console[key];
            if (typeof method === "function") {
                console[key] = function (...args) {
                    const id = uuid();
                    if (filter(id, FcProductType.Console)) {
                        producer.create({
                            id,
                            type: FcProductType.Console,
                            category: key,
                            request: args,
                            stack: $$getStack(),
                        });
                    }
                    return method.apply(this, args);
                };
            }
        });
    }
};
