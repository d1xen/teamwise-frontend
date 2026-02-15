import type { ApiError } from "@/api/types/errors";

type CustomErrorPayload = {
    timestamp: string;
    code: string;
    message: string;
};

type ProblemDetailPayload = {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
};

function isCustomErrorPayload(value: unknown): value is CustomErrorPayload {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    return (
        typeof record.timestamp === "string" &&
        typeof record.code === "string" &&
        typeof record.message === "string"
    );
}

function isProblemDetailPayload(value: unknown): value is ProblemDetailPayload {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    return (
        typeof record.type === "string" &&
        typeof record.title === "string" &&
        typeof record.status === "number"
    );
}

function defaultMessage(status: number): string {
    if (status >= 500) return "Server error";
    if (status === 404) return "Not found";
    if (status === 403) return "Forbidden";
    if (status === 401) return "Unauthorized";
    if (status === 400) return "Bad request";
    return "Request failed";
}

export function normalizeApiError(
    status: number,
    payload: unknown
): ApiError {
    if (isCustomErrorPayload(payload)) {
        return {
            kind: "ApiError",
            status,
            code: payload.code,
            message: payload.message,
            timestamp: payload.timestamp,
            raw: payload,
        };
    }

    if (isProblemDetailPayload(payload)) {
        return {
            kind: "ApiError",
            status: payload.status,
            message: payload.title,
            detail: payload.detail,
            instance: payload.instance,
            raw: payload,
        };
    }

    return {
        kind: "ApiError",
        status,
        message: defaultMessage(status),
        raw: payload,
    };
}

