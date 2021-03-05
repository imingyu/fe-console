export const removeEndZero = (num: number | string): string => {
    const str = num + "";
    if (str.indexOf(".") === -1) {
        return str;
    }
    let [before, after] = str.split(".");
    const af = parseInt(after);
    return before + (af === 0 ? "" : `.${af}`);
};
