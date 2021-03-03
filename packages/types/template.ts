import { MpViewComponentSpec } from "@mpkit/types";
import { FcMpViewMethod } from "./mp";
import { FcMpApiMaterial } from "./reader";
export interface FcMpRendererComponent<T = any> extends MpViewComponentSpec {
    data: T;
    methods: {
        [prop: string]: FcMpViewMethod;
    };
}

export interface FcMpRendererComponentData {
    // 代表是哪个组件
    $tid: string;
    // 代表组件实例ID
    $cid?: string;
    [prop: string]: any;
}

export interface FcMpApiRendererComponentData
    extends FcMpRendererComponentData {}

export interface FcMpApiRendererComponent
    extends FcMpRendererComponent<FcMpApiRendererComponentData> {}
