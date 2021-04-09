import { FcHotPatchProducerImpl } from "@fe-console/provider";
import { FcProduct } from "@fe-console/types";
import { replaceFunc, hookFunc } from "@mpkit/func-helper";
import { MkFuncHook } from "@mpkit/types";

export class FcMpFuncHotPatchProducer<
    T extends FcProduct = FcProduct
> extends FcHotPatchProducerImpl<T> {
    func: Function;
    modifiedFunc: Function;
    constructor(func: Function, hooks: MkFuncHook[]) {
        super();
        this.func = func;
        this.modifiedFunc = replaceFunc(
            func,
            hookFunc(func, false, hooks),
            (state) => {}
        );
    }
    replace() {
        throw new Error("Method not implemented.");
    }
    restore() {
        throw new Error("Method not implemented.");
    }
}
