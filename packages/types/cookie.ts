export interface FcCookie {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: string;
    maxAge?: number;
    size?: number;
    httpOnly?: boolean;
    secure?: boolean;
}
