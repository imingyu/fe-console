import {
    FcMpApiCategoryGetter,
    FcMpApiCategoryInfo,
    FcMpApiProduct,
    FcMpRunConfig,
} from "@fe-console/types";
import {
    MpApiCategoryMap,
    MpApiOtherCategory,
    reportCategoryMapToList,
} from "./category";

/**
 * 获取小程序Api数据原料的分类值
 */
export const getApiCategoryValue = (
    product: Partial<FcMpApiProduct>,
    runConfig?: FcMpRunConfig
): string => {
    let res: string;
    if (runConfig && runConfig.apiCategoryGetter) {
        const type = typeof runConfig.apiCategoryGetter;
        if (type === "function") {
            res = (runConfig.apiCategoryGetter as FcMpApiCategoryGetter)(
                product
            );
        } else if (
            type === "object" &&
            runConfig.apiCategoryGetter[product.category]
        ) {
            if (
                typeof runConfig.apiCategoryGetter[product.category] ===
                "function"
            ) {
                res = runConfig.apiCategoryGetter[product.category](product);
            } else {
                res = runConfig.apiCategoryGetter[product.category] + "";
            }
        }
    }
    return res || MpApiOtherCategory;
};

/**
 * 获取小程序Api数据原料的分类信息列表
 */
export const getApiCategoryList = (
    runConfig?: FcMpRunConfig
): FcMpApiCategoryInfo[] => {
    const res: FcMpApiCategoryInfo[] = [
        {
            text: "All",
            value: "all",
        },
        {
            text: "Mark",
            value: "mark",
        },
    ];
    if (
        runConfig &&
        Array.isArray(runConfig.apiCategoryList) &&
        runConfig.apiCategoryList.length
    ) {
        runConfig.apiCategoryList.forEach((item) => {
            if (typeof item === "string" && item) {
                if (!res.some((it) => it.value === item)) {
                    res.push({
                        text: item,
                        value: item,
                    });
                }
            } else if (item && (item as FcMpApiCategoryInfo).value) {
                if (
                    !res.some(
                        (it) => it.value === (item as FcMpApiCategoryInfo).value
                    )
                ) {
                    res.push(item as FcMpApiCategoryInfo);
                }
            }
        });
    }
    if (!res.some((item) => item.value === MpApiOtherCategory)) {
        res.push({
            text: "Other",
            value: MpApiOtherCategory,
        });
    }
    return res;
};

export const DefaultConfig: FcMpRunConfig = {
    observer: ["local"],
    apiCategoryGetter(product: FcMpApiProduct): string {
        return MpApiCategoryMap[product.category] || MpApiOtherCategory;
    },
    apiCategoryList: reportCategoryMapToList(MpApiCategoryMap),
};
