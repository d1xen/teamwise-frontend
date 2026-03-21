import { buildApiUrl } from "@/config/appConfig";

let cachedVersion: string | null = null;

/** Fetches the app version from the backend. Cached after first call. */
export async function getAppVersion(): Promise<string> {
    if (cachedVersion) return cachedVersion;

    try {
        const res = await fetch(buildApiUrl("/api/version"));
        if (!res.ok) return "–";
        const data = await res.json() as { version: string };
        cachedVersion = data.version;
        return cachedVersion;
    } catch {
        return "–";
    }
}
