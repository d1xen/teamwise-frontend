export type ApiError = {
    kind: "ApiError";
    status: number;
    code?: string;
    message: string;
    detail?: string | undefined;
    instance?: string | undefined;
    timestamp?: string;
    raw?: unknown;
};

