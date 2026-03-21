import { useEffect, useState } from "react";
import { getAppVersion } from "@/api/endpoints/version.api";

/** Returns the app version string. Fetched once, cached globally. */
export function useAppVersion(): string | null {
    const [version, setVersion] = useState<string | null>(null);

    useEffect(() => {
        getAppVersion().then(setVersion);
    }, []);

    return version;
}
