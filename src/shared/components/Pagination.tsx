import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/design-system";

const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

interface PaginationProps {
    page: number;
    totalPages: number;
    totalElements: number;
    pageSize: PageSize;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: PageSize) => void;
}

/** Compact pagination — label + page size selector + chevrons. Always visible. */
export function PaginationTop({ pageSize, onPageSizeChange, page, totalPages, onPageChange, label }: Omit<PaginationProps, "totalElements"> & { label?: string }) {
    return (
        <div className="flex items-center gap-1.5">
            {label && <span className="text-[11px] text-neutral-600">{label}</span>}
            <select
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value) as PageSize)}
                className="h-7 text-xs text-neutral-400 bg-neutral-800/50 border border-neutral-700/40 rounded-[4px] px-1.5 outline-none focus:border-indigo-500/50 cursor-pointer transition-colors tabular-nums"
            >
                {PAGE_SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 0}
                className="p-1 rounded-md text-neutral-500 enabled:hover:text-neutral-300 enabled:hover:bg-neutral-800 disabled:text-neutral-800 disabled:cursor-default transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            {totalPages > 1 && (
                <div className="flex items-center gap-0.5">
                    {generatePageNumbers(page, totalPages).map((p, i) =>
                        p === "..." ? (
                            <span key={`dot-${i}`} className="px-0.5 text-neutral-700 text-[10px]">...</span>
                        ) : (
                            <button key={p} onClick={() => onPageChange(p)}
                                className={cn("w-6 h-6 rounded text-[11px] font-medium transition-colors",
                                    p === page ? "bg-indigo-500/15 text-indigo-300" : "text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800"
                                )}>
                                {p + 1}
                            </button>
                        )
                    )}
                </div>
            )}
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-1 rounded-md text-neutral-500 enabled:hover:text-neutral-300 enabled:hover:bg-neutral-800 disabled:text-neutral-800 disabled:cursor-default transition-colors"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

/** Full pagination — page numbers + chevrons + count. For bottom of lists. */
export function PaginationBottom({ page, totalPages, totalElements, pageSize, onPageChange }: Omit<PaginationProps, "onPageSizeChange">) {
    if (totalElements === 0 || totalPages <= 1) return null;

    const from = page * pageSize + 1;
    const to = Math.min((page + 1) * pageSize, totalElements);

    return (
        <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-neutral-600 tabular-nums">{from}–{to} / {totalElements}</span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 0}
                    className="p-1.5 rounded-md text-neutral-500 enabled:hover:text-neutral-300 enabled:hover:bg-neutral-800 disabled:text-neutral-800 disabled:cursor-default transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-neutral-500 tabular-nums px-1">{page + 1} / {totalPages}</span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-md text-neutral-500 enabled:hover:text-neutral-300 enabled:hover:bg-neutral-800 disabled:text-neutral-800 disabled:cursor-default transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i);
    const pages: (number | "...")[] = [0];
    if (current > 2) pages.push("...");
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
    if (current < total - 3) pages.push("...");
    pages.push(total - 1);
    return pages;
}

// Keep default export for backward compat
export default function Pagination(props: PaginationProps) {
    return <PaginationTop {...props} />;
}
