import { FcStackInfo } from "@fe-console/types";

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

const STACK_TRACE = "$$$trace_stack$$$";
export const $$getStack = (): FcStackInfo[] => {
    let res: FcStackInfo[] = [];
    try {
        throw new Error(STACK_TRACE);
    } catch (error) {
        const stack = (error as Error).stack || "";
        if (stack) {
            stack.split("\n").forEach((item, index) => {
                if (
                    item.indexOf(STACK_TRACE) === -1 &&
                    item.indexOf("$$getStack") === -1
                ) {
                    const stack: FcStackInfo = {
                        original: item,
                        target: "",
                    };
                    item = item.trim();
                    let file = "";
                    let target = "";
                    const hasReal = item.indexOf("]");
                    if (hasReal !== -1) {
                        const before = item.substr(0, hasReal).split("[");
                        stack.method = before[1].split(" ")[1];
                        const arr = before[0].split(" ");
                        target = arr[1];
                        file = item.substr(hasReal + 1).trim();
                    } else {
                        const arr = item.split(" ");
                        if (arr.length > 1) {
                            if (arr[1].startsWith("http")) {
                                file = `(${arr[1]})`;
                            } else {
                                target = arr[1];
                                file = arr[2];
                            }
                        }
                    }
                    if (target) {
                        stack.target = target;
                        stack.ascription = target.substr(
                            0,
                            target.lastIndexOf(".")
                        );
                        const method = target.substr(
                            target.lastIndexOf(".") + 1
                        );
                        if (!(method === "<computed>" && stack.method)) {
                            stack.method = method;
                        }
                    }
                    if (file && file.startsWith("(")) {
                        let fileName: string,
                            lineNumebr: string,
                            column: string;
                        let arr = file.split(".js");
                        if (arr.length > 1) {
                            fileName = arr[0] + ".js";
                            if (arr[1] && arr[1].startsWith(":")) {
                                arr = arr[1].substr(1).split(":");
                                lineNumebr = arr[0];
                                column = arr[1];
                            }
                        } else {
                            fileName = arr[0];
                        }
                        stack.fileName = fileName.substr(1);

                        if (lineNumebr) {
                            stack.lineNumebr = parseInt(lineNumebr);
                            if (isNaN(stack.lineNumebr)) {
                                delete stack.lineNumebr;
                            }
                        }
                        if (column) {
                            column = column.substr(0, column.length - 1);

                            stack.column = parseInt(column);
                            if (isNaN(stack.column)) {
                                delete stack.column;
                            }
                        }
                    }
                    res.push(stack);
                }
            });
        }
    }
    return res;
};
