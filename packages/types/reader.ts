import { FcCookie } from "./cookie";
import { FcMethodExecStatus } from "./core";
import { FcRendererProduct } from "./json-tree";
import { FcNameValue, FcStackInfo } from "./util";

export interface FcMpApiMaterial {
    id: string;
    code?: number | string;
    type: string;
    name: string;
    nameDesc?: string;
    status: string;
    statusDesc?: string;
    startTime: number;
    endTime?: number;
    time: string;
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
    stack?: FcMpDetailKV[];
    // arguments
    // requestRayload
}
