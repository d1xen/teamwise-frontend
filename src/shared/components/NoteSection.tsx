import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { useTeam } from "@/contexts/team/useTeam";
import { useAuth } from "@/contexts/auth/useAuth";
import { UserAvatar } from "@/shared/components/UserAvatar";
import type { NoteDto } from "@/api/types/common";

interface NoteSectionProps {
    notes: NoteDto[];
    onAdd: (content: string) => Promise<NoteDto>;
    onDelete: (noteId: number) => Promise<void>;
    canAdd: boolean;
    currentSteamId: string;
    maxNotes: number;
}

export default function NoteSection({ notes, onAdd, onDelete, canAdd, currentSteamId, maxNotes }: NoteSectionProps) {
    const { t } = useTranslation();
    const { members } = useTeam();
    const { user } = useAuth();
    const [text, setText] = useState("");
    const [adding, setAdding] = useState(false);

    const limitReached = notes.length >= maxNotes;

    function resolveAvatarProps(steamId: string): { profileImageUrl?: string | null | undefined; avatarUrl?: string | null | undefined } {
        if (user && user.steamId === steamId) {
            return { profileImageUrl: user.profileImageUrl, avatarUrl: user.avatarUrl };
        }
        const member = members.find(m => m.steamId === steamId);
        return { profileImageUrl: member?.profileImageUrl, avatarUrl: member?.avatarUrl };
    }

    async function handleAdd() {
        if (!text.trim() || adding || limitReached) return;
        setAdding(true);
        try {
            await onAdd(text.trim());
            setText("");
        } finally {
            setAdding(false);
        }
    }

    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neutral-400" />
                {t("common.comments")}
                <span className="text-[10px] text-neutral-600 font-normal ml-1">
                    {notes.length}/{maxNotes}
                </span>
            </h3>

            {/* Add form */}
            {canAdd && (
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAdd()}
                        placeholder={limitReached ? t("common.notes_limit_reached") : t("common.note_placeholder")}
                        disabled={limitReached}
                        className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!text.trim() || adding || limitReached}
                        className="px-3 py-2 rounded-lg bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Notes list */}
            {notes.length === 0 ? (
                <p className="text-xs text-neutral-600">{t("common.no_comments")}</p>
            ) : (
                <div className="space-y-3">
                    {notes.map(note => {
                        const avatarProps = resolveAvatarProps(note.authorSteamId);
                        const canDelete = note.authorSteamId === currentSteamId || canAdd;
                        const date = new Date(note.createdAt);

                        return (
                            <div key={note.id} className="flex items-start gap-3 group">
                                <UserAvatar
                                    profileImageUrl={avatarProps.profileImageUrl}
                                    avatarUrl={avatarProps.avatarUrl}
                                    nickname={note.authorNickname ?? "?"}
                                    size={32}
                                    shape="circle"
                                    className="mt-0.5"
                                />

                                {/* Bubble */}
                                <div className="flex-1 min-w-0 bg-neutral-800/40 rounded-xl px-3.5 py-2.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-neutral-300">
                                            {note.authorNickname ?? "Unknown"}
                                        </span>
                                        <span className="text-[10px] text-neutral-600">
                                            {date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                            {" · "}
                                            {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">{note.content}</p>
                                </div>

                                {/* Delete */}
                                {canDelete && (
                                    <button
                                        onClick={() => onDelete(note.id)}
                                        className="p-1.5 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
