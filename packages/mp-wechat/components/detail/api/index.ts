import { FcMpComponent } from "../../mixins/view";
import { createLiaisonMixin } from "../../mixins/liaison";
import { MpViewType } from "@mpkit/types";
FcMpComponent(createLiaisonMixin(MpViewType.Component, "fc-api-detail"), {
    properties: {
        data: {
            type: String
        },
    },
    data: {},
    methods: {},
});
