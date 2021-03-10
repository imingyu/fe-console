import {
    IFcProducer,
    FcConsoleProduct,
    FcProductType,
} from "@fe-console/types";
import { $$getStack } from "@fe-console/util";
export const hookConsole = (producer: IFcProducer<FcConsoleProduct>) => {
    if (typeof console === "object" && console) {
        Object.keys(console).forEach((key) => {
            const method = console[key];
            if (typeof method === "function") {
                console[key] = function (...args) {
                    producer.create({
                        type: FcProductType.Console,
                        category: key,
                        request: args,
                        stack: $$getStack(),
                    });
                    return method.apply(this, args);
                };
            }
        });
    }
};
