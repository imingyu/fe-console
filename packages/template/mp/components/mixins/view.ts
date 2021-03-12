import { MpViewType } from "@mpkit/types";
import { MkComponent, MkNative } from "@mpkit/mixin";
import { diffMpData } from "@mpkit/set-data";
import { createSetDataMixin } from "./set-data";

export const FcMpComponent = (...mixins) => {
    mixins.splice(0, 0, createSetDataMixin(MpViewType.Component));
    // 针对平台处理props<%=(platform==='alipay'?'需要':'不需要')%>  <% if(platform==='alipay'){%>
    // 处理支付宝小程序的props
    mixins.splice(0, 0, {
        deriveDataFromProps(nextPropsState) {
            const res = diffMpData(this.props, nextPropsState);
            for (let prop in res) {
                const changePropName = prop.split(".")[0];
                if (
                    changePropName !== "$scopedSlots" &&
                    changePropName !== "$slots" &&
                    this.$mkSpec &&
                    this.$mkSpec.propObserverMap &&
                    this.$mkSpec.propObserverMap[changePropName]
                ) {
                    let observer = this.$mkSpec.propObserverMap[changePropName];
                    observer =
                        typeof observer === "string"
                            ? this[observer]
                            : observer;
                    if (typeof observer === "function") {
                        const oldVal = this.props[changePropName];
                        const newVal = nextPropsState[changePropName];
                        this.props[changePropName] = newVal;
                        observer.call(this, newVal, oldVal);
                    }
                }
            }
        },
    });
    mixins.push({
        $mixinEnd(fullSpec) {
            const props: any = {};
            const propObserverMap: any = {};
            if (fullSpec.properties) {
                for (let prop in fullSpec.properties) {
                    if (
                        fullSpec.properties[prop] &&
                        typeof fullSpec.properties[prop] === "object"
                    ) {
                        props[prop] =
                            typeof fullSpec.properties[prop].value ===
                            "undefined"
                                ? ""
                                : fullSpec.properties[prop].value;
                        if (fullSpec.properties[prop].observer) {
                            propObserverMap[prop] =
                                fullSpec.properties[prop].observer;
                        }
                    } else {
                        props[prop] = "";
                    }
                }
                delete fullSpec.properties;
                fullSpec.props = props;
                fullSpec.propObserverMap = propObserverMap;
            }
        },
    });
    //<%}%>
    const spec = MkComponent.apply(null, mixins);
    return MkNative.Component(spec);
};
