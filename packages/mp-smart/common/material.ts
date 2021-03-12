import {
    FcMethodExecStatus,
    FcMpApiDetail,
    FcMpApiMaterial,
    FcMpApiProduct,
    FcMpDetailHeader,
    FcMpRunConfig,
} from "@fe-console/types";
import { getApiCategoryValue } from "../configure/index";
import { computeTime } from "./util";

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

export const convertApiDetail = (product: FcMpApiProduct): FcMpApiDetail => {
    let failMsg: string;
    if (
        product.status === FcMethodExecStatus.Fail &&
        product.response &&
        product.response.length &&
        product.response[0] &&
        product.response[0].errMsg
    ) {
        const arr = product.response[0].errMsg.split(":fail");
        if (arr.length > 1) {
            failMsg = arr[1].trim();
        } else {
            failMsg = product.response[0].errMsg;
        }
    }
    const res: FcMpApiDetail = {
        general: [
            {
                name: "Api Name",
                value: product.category,
            },
            {
                name: "Status",
                value: product.status,
                remark: failMsg,
            },
        ],
    };
    if (product.endTime || product.execEndTime) {
        res.general.push({
            name: "Take Time",
            value: computeTime(
                (product.endTime || product.execEndTime) - product.time
            ),
        });
    }
    if (product.category === "request") {
        const requestOptions =
            product.request && product.request[0] ? product.request[0] : null;
        const response =
            product.response && product.response[0]
                ? product.response[0]
                : null;
        if (requestOptions) {
            res.general.push({
                name: "$$HR$$",
            });
            res.general.push({
                name: "Request URL",
                value: requestOptions.url || "",
            });
            res.general.push({
                name: "Request Method",
                value: ((requestOptions.method || "") as string).toUpperCase(),
            });
            const statusCode = response
                ? response instanceof Error
                    ? "Exception"
                    : response.statusCode
                    ? response.statusCode
                    : "Unknown"
                : "Waiting";
            res.general.push({
                name: "Status Code",
                value: statusCode,
            });
            if (response && !(response instanceof Error)) {
                if (response.header) {
                    res.responseHeaders = Object.keys(response.header).map(
                        (key) => {
                            return {
                                name: key,
                                value: response.header[key],
                            };
                        }
                    );
                }
                if (response.cookies && response.cookies.length) {
                    res.cookies = response.cookies.map((item) => {
                        const arr = item.split("=");
                        return {
                            name: arr[0],
                            value: arr[1] || "",
                        };
                    });
                }
            }
            if (requestOptions.header) {
                res.requestHeaders = Object.keys(requestOptions.header).map(
                    (key) => {
                        return {
                            name: key,
                            value: requestOptions.header[key],
                        };
                    }
                );
            }
            if (requestOptions.url && requestOptions.url.indexOf("?") !== -1) {
                res.queryStringParameters = (requestOptions.url as string)
                    .split("?")
                    .slice(1)
                    .reduce((sum, item, index, arr) => {
                        if (!res.queryString) {
                            res.queryString = arr.join("?");
                        }
                        item.split("&").forEach((sec) => {
                            const arr = sec.split("=");
                            const name = decodeURIComponent(arr[0]);
                            sum.push({
                                name,
                                value: arr[1],
                                decodedValue: arr[1]
                                    ? decodeURIComponent(arr[1])
                                    : "",
                            });
                        });
                        return sum;
                    }, [] as FcMpDetailHeader[]);
            }
        }
    }
    ["requestHeaders", "responseHeaders", "queryStringParameters"].forEach(
        (prop) => {
            if (!res[prop] || !res[prop].length) {
                delete res[prop];
            }
        }
    );
    return res;
};
