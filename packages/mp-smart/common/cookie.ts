import { FcCookie } from "@fe-console/types";

export const parseCookie = (content: string): FcCookie => {
    const arr = content.split(";");
    const [name, val] = arr[0].split("=");
    const res: FcCookie = {
        name,
        value: val || "",
    };
    // TODO:解析其他属性
    return res;
};
