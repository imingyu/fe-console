import {
    FcMethodExecStatus,
    FcMpApiMaterial,
    FcMpApiProduct,
    FcMpRunConfig,
} from "@fe-console/types";
import { getApiCategoryValue } from "../configure/index";

export const convertApiMaterial = (
    product: Partial<FcMpApiProduct>,
    mpRunConfig?: FcMpRunConfig
): Partial<FcMpApiMaterial> => {
    const material: Partial<FcMpApiMaterial> = {
        id: product.id,
    };
    if ("category" in product) {
        material.name = product.category;
        material.type = getApiCategoryValue(product, mpRunConfig);
    }
    if ("endTime" in product) {
        material.endTime = product.endTime;
    }
    if ("execEndTime" in product && !material.endTime) {
        material.endTime = product.execEndTime;
    }
    if ("time" in product) {
        material.startTime = product.time;
    }
    if ("status" in product) {
        material.status = product.status;
    }
    if (
        !material.statusDesc &&
        product.status === FcMethodExecStatus.Fail &&
        product.response &&
        product.response.length &&
        product.response[0] &&
        product.response[0].errMsg
    ) {
        const arr = product.response[0].errMsg.split(":fail");
        if (arr.length > 1) {
            material.statusDesc = arr[1].trim();
        } else {
            material.statusDesc = product.response[0].errMsg;
        }
    }
    return material;
};
