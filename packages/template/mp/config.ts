import { FcMpApiProduct, FcMpRunConfig } from "@fe-console/types";
import {
    MpApiCategoryMap,
    MpApiOtherCategory,
    reportCategoryMapToList,
} from "./configure/category";

const config: FcMpRunConfig = {
    observer: ["local"],
    apiCategoryGetter(product: FcMpApiProduct): string {
        return MpApiCategoryMap[product.category] || MpApiOtherCategory;
    },
    apiCategoryList: reportCategoryMapToList(MpApiCategoryMap),
};

export default config;
