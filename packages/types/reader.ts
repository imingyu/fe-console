import { FcCookie } from "./cookie";
import { FcMethodExecStatus } from "./core";
import { FcRendererProduct } from "./renderer";
import { FcNameValue } from "./util";

export interface FcMpApiMaterial {
    id: string;
    type: string;
    name: string;
    desc?: string;
    status: FcMethodExecStatus | number;
    statusCode?: number;
    statusDesc?: string;
    startTime: number;
    endTime?: number;
    initiator: string;
    initiatorDesc?: string;
}

export interface FcInitiator {
    type: string;
    fileName?: string;
    method?: string;
    lineNumber?: number;
    column?: number;
}

export interface FcMpDetailKV extends FcNameValue<string | number> {
    decodedValue?: string | number;
    remark?: string;
}

export const enum FcMpRequestApiDataType {
    FormData = 1,
    RequestRayload = 2,
}
export interface FcMpRequestApiData {
    type: FcMpRequestApiDataType;
    kvList?: FcMpDetailKV[];
    rendererProducts?: FcRendererProduct[];
}

export interface FcMpApiDetail {
    general: FcMpDetailKV[];
    requestHeaders?: FcMpDetailKV[];
    responseHeaders?: FcMpDetailKV[];
    queryString?: string;
    queryStringParameters?: FcMpDetailKV[];
    formData?: FcMpDetailKV[];
    cookies?: FcCookie[];
    requestData?: FcMpRequestApiData;
    // arguments
    // requestRayload
}
