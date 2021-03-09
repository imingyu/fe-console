export * from "./event-emitter";
export const now = (() => {
    let p;
    return (): number => {
        if (!p) {
            p =
                typeof performance !== "undefined" && "now" in performance
                    ? performance
                    : Date;
        }
        return p.now();
    };
})();