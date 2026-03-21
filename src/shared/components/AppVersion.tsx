import { useAppVersion } from "@/shared/hooks/useAppVersion";

/** Displays the app version as a subtle inline label. */
export default function AppVersion() {
    const version = useAppVersion();
    if (!version) return null;
    return (
        <span className="text-[11px] text-neutral-500 tabular-nums select-none">
            v{version}
        </span>
    );
}
