import { FcMethodExecStatus } from "./core";
import { FcMpApiProduct } from "./mp";
import { FcNameValue } from "./util";

export interface FcMpApiMaterial {
    id: string;
    type: string;
    name: string;
    desc?: string;
    status: FcMethodExecStatus;
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

export interface FcMpDetailHeader extends FcNameValue<string | number> {
    decodedValue?: string | number;
    remark?: string;
}

export interface FcMpApiDetail {
    general: FcMpDetailHeader[];
    requestHeaders?: FcMpDetailHeader[];
    responseHeaders?: FcMpDetailHeader[];
    queryString?: string;
    queryStringParameters?: FcMpDetailHeader[];
    cookies?: FcNameValue<string | number>[];
    // arguments
}
