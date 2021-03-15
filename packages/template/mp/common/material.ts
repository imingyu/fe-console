import {
    FcMethodExecStatus,
    FcMpApiDetail,
    FcMpApiMaterial,
    FcMpApiProduct,
    FcMpDetailKV,
    FcMpRunConfig,
    FcStackInfo,
} from "@fe-console/types";
import { getApiCategoryValue } from "../configure/index";
import { parseCookie } from "./cookie";
import { computeTime, findValue } from "./util";

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
        if (
            product.category === "request" &&
            product.request &&
            product.request[0] &&
            product.request[0].url
        ) {
            let url = product.request[0].url as string;
            url = url.startsWith("//") ? `https:${url}` : url;
            url = url.startsWith("https:") ? url.substr(8) : url.substr(7);
            const [before, query] = url.split("?");
            const arr = before.split("/");
            const name =
                (arr.length > 1 ? arr[arr.length - 1] : "/") +
                (query ? `?${query}` : "");
            const desc = arr.slice(0, arr.length - 1).join("/");
            material.name = name;
            material.desc = desc;
        }
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
    if (
        product.response &&
        product.response.length &&
        product.response[0] &&
        typeof product.response[0].statusCode !== "undefined"
    ) {
        material.statusCode = product.response[0].statusCode as number;
    }
    if ("stack" in product && product.stack && product.stack.length) {
        material.initiator = convertStockToInitiatorName(product.stack[0]);
        material.initiatorDesc = convertStockToInitiatorDesc(product.stack[0]);
    }
    return material;
};

export const convertStockToInitiatorName = (stock: FcStackInfo): string => {
    if (stock.fileName) {
        const fileName = stock.fileName
            .split("appservice")
            .slice(1)
            .map((item) => (item.startsWith("/") ? item : `/${item}`))
            .join("")
            .substr(1);
        if (stock.lineNumebr) {
            return `${fileName}:${stock.lineNumebr}`;
        }
        return fileName;
    }
    return stock.original;
};
export const convertStockToInitiatorDesc = (stock: FcStackInfo): string => {
    return "Script";
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
    const statusKV: FcMpDetailKV = {
        name: "Work Status",
        value: product.status,
        remark: failMsg,
    };
    const res: FcMpApiDetail = {
        general: [
            {
                name: "Api Name",
                value: product.category,
            },
            statusKV,
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
                    }, [] as FcMpDetailKV[]);
            }
            if (typeof requestOptions.data !== "undefined") {
                const reqContentType = requestOptions.header
                    ? findValue(requestOptions.header, "content-type")
                    : "application/json";
                if (reqContentType.startsWith("application/json")) {
                    // requestRayload
                } else if (
                    reqContentType === "application/x-www-form-unlencoded"
                ) {
                }
            }

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
                    res.cookies = (response.cookies as string[]).map((item) => {
                        return parseCookie(item);
                    });
                }
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
