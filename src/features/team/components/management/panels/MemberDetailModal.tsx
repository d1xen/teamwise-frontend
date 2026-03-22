import { useEffect, useCallback } from "react";
import MemberDetailPanel from "./MemberDetailPanel";
import type { MemberDetailPanelProps } from "./MemberDetailPanel";

export default function MemberDetailModal(props: MemberDetailPanelProps) {
    const { onClose } = props;

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [handleKeyDown]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85" onClick={onClose} />
            <div className="relative w-full max-w-[640px] h-[68vh] bg-[#141414] border border-neutral-800 rounded-2xl flex flex-col overflow-hidden">
                <MemberDetailPanel {...props} />
            </div>
        </div>
    );
}
