import { MkApi } from "@mpkit/mixin";

export const removeEndZero = (num: number | string): string => {
    const str = num + "";
    if (str.indexOf(".") === -1) {
        return str;
    }
    let [before, after] = str.split(".");
    const af = parseInt(after);
    return before + (af === 0 ? "" : `.${af}`);
};

export const computeTime = (total: number): string => {
    let timeUnit;
    let timeVal;
    if (total < 1000) {
        timeUnit = "ms";
        timeVal = removeEndZero(total.toFixed(1));
    } else if (total < 60 * 1000) {
        timeUnit = "s";
        timeVal = removeEndZero((total / 1000).toFixed(1));
    } else if (total < 60 * 60 * 1000) {
        timeUnit = "m";
        timeVal = removeEndZero((total / (60 * 1000)).toFixed(1));
    } else {
        timeUnit = "h";
        timeVal = removeEndZero((total / (60 * 60 * 1000)).toFixed(1));
    }
    return `${timeVal}${timeUnit}`;
};

export const isFullScreenPhone = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if ((MkApi as any).getSystemInfo) {
            (MkApi as any).getSystemInfo({
                success(res) {
                    resolve(
                        res &&
                            "statusBarHeight" in res &&
                            res.statusBarHeight > 20
                            ? true
                            : false
                    );
                },
                fail() {
                    resolve(false);
                },
            });
        } else {
            resolve(false);
        }
    });
};

export const findValue = (obj: any, prop: string): any => {
    for (let key in obj) {
        if (key === prop || key.toLowerCase() === prop.toLowerCase()) {
            return obj[prop];
        }
    }
};