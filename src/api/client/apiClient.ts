import type { ApiError } from "@/api/types/errors";
import { normalizeApiError } from "@/shared/utils/error/normalizeApiError";
import { getToken } from "@/shared/utils/storage/tokenStorage";

type UnauthorizedHandler = (error: ApiError) => void;

type ApiClientOptions = {
    withAuth?: boolean;
};

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
    unauthorizedHandler = handler;
}

function shouldParseJson(response: Response): boolean {
    const contentType = response.headers.get("content-type");
    return contentType ? contentType.includes("application/json") : false;
}

async function safeParseJson(response: Response): Promise<unknown> {
    if (!shouldParseJson(response)) return null;
    try {
        return await response.json();
    } catch {
        return null;
    }
}

export async function apiClient<T>(
    url: string,
    init: RequestInit = {},
    options: ApiClientOptions = {}
): Promise<T> {
    const withAuth = options.withAuth !== false;
    const token = withAuth ? getToken() : null;

    const headers = new Headers(init.headers || {});

    if (withAuth && token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const hasBody = typeof init.body !== "undefined";
    const isFormData =
        typeof FormData !== "undefined" && init.body instanceof FormData;

    if (hasBody && !isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...init,
        headers,
    });

    if (!response.ok) {
        const payload = await safeParseJson(response);
        const error = normalizeApiError(response.status, payload);

        if (response.status === 401 && unauthorizedHandler) {
            unauthorizedHandler(error);
        }

        throw error;
    }

    const payload = await safeParseJson(response);
    return payload as T;
}

