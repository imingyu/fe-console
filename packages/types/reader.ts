import { FcMethodExecStatus } from "./core";
import { FcMpApiProduct } from "./mp";

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
