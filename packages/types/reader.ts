import { FcMethodExecStatus } from "./core";
import { FcMpApiProduct } from "./mp";

export interface FcMpApiMaterial<T = any, K = any, S = any> {
    type: string;
    name: string;
    desc?: string;
    status: FcMethodExecStatus;
    statusDesc?: string;
    startTime: number;
    endTime: number;
    coverImg?: string;
    request?: T;
    response?: K;
    result?: S;
    initiator: FcInitiator | FcInitiator[];
    products?: FcMpApiProduct[];
}

export interface FcInitiator {
    type: string;
    fileName?: string;
    method?: string;
    lineNumber?: number;
    column?: number;
}
