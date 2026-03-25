import { useTranslation } from "react-i18next";

interface MetaInfoProps {
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    /** If true, show only date without time */
    dateOnly?: boolean;
    className?: string;
}

export default function MetaInfo({ createdAt, updatedAt, createdBy, updatedBy, dateOnly, className = "" }: MetaInfoProps) {
    const { t, i18n } = useTranslation();

    if (!createdAt && !updatedAt) return null;

    const fmt = new Intl.DateTimeFormat(i18n.language, dateOnly
        ? { day: "numeric", month: "long", year: "numeric" }
        : { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    );

    const isModified = updatedAt && createdAt &&
        Math.abs(new Date(updatedAt).getTime() - new Date(createdAt).getTime()) > 2000;
    const date = isModified ? updatedAt : createdAt;
    const who = isModified ? (updatedBy ?? createdBy) : createdBy;
    const label = isModified
        ? t("meta.updated_at", { date: fmt.format(new Date(date!)) })
        : t("meta.created_at", { date: fmt.format(new Date(date!)) });

    return (
        <p className={`text-[11px] text-neutral-500 ${className}`}>
            {label}
            {who && <span className="text-neutral-400"> · {who}</span>}
        </p>
    );
}
