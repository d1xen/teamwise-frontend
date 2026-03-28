import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Circle, ExternalLink, Link2, X } from 'lucide-react';
import FaceitIcon from '@/shared/components/FaceitIcon';
import {
    getFaceitStatus,
    initiateFaceitConnect,
    disconnectFaceit,
} from '@/api/endpoints/faceit.api';
import type { FaceitStatusDto } from '@/api/types/faceit';
import { useOptionalTeam } from '@/contexts/team/useOptionalTeam';

interface FaceitConnectSectionProps {
    canEdit: boolean;
    variant?: 'card' | 'inline';
}

export function FaceitConnectInline({ canEdit }: { canEdit: boolean }) {
    return <FaceitConnectSection canEdit={canEdit} variant="inline" />;
}

export default function FaceitConnectSection({ canEdit, variant = 'card' }: FaceitConnectSectionProps) {
    const { t } = useTranslation();
    const teamCtx = useOptionalTeam();
    const [status, setStatus]       = useState<FaceitStatusDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActing, setIsActing]   = useState(false);
    const popupRef = useRef<Window | null>(null);
    const pollIntervalRef = useRef<number | null>(null);
    const pollTimeoutRef = useRef<number | null>(null);
    const hasCompletedRef = useRef(false);
    const connectInitiatedRef = useRef(false);
    const closeWatcherRef = useRef<number | null>(null);

    const clearPolling = () => {
        if (pollIntervalRef.current !== null) {
            window.clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        if (pollTimeoutRef.current !== null) {
            window.clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
        if (closeWatcherRef.current !== null) {
            window.clearInterval(closeWatcherRef.current);
            closeWatcherRef.current = null;
        }
    };

    const completeLinkFlow = (nickname?: string | null) => {
        if (hasCompletedRef.current) return;
        if (!connectInitiatedRef.current) return; // ignore if no connect was initiated this session
        hasCompletedRef.current = true;
        setStatus({ linked: true, faceitNickname: nickname ?? null });
        toast.success(t('faceit.connect_success'));
        setIsActing(false);
        clearPolling();
        if (popupRef.current && !popupRef.current.closed) {
            try {
                popupRef.current.close();
            } catch {
                // no-op
            }
        }
        popupRef.current = null;
        reloadStatus();
        teamCtx?.refreshTeam?.().catch(() => {});
    };

    const reloadStatus = () => {
        getFaceitStatus()
            .then(setStatus)
            .catch(() => {/* silent */})
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const queryResult = params.get('faceit_result');
        if (queryResult === 'linked') {
            connectInitiatedRef.current = true; // query param means OAuth just completed
            const nickname = params.get('faceit_nickname') ?? '';
            setStatus({ linked: true, faceitNickname: nickname });
            toast.success(t('faceit.connect_success'));
        } else if (queryResult === 'error') {
            const reason = params.get('faceit_reason') ?? '';
            const key = `faceit.connect_error_${reason}`;
            toast.error(t(key, { defaultValue: t('faceit.connect_error') }));
        }

        if (queryResult) {
            params.delete('faceit_result');
            params.delete('faceit_nickname');
            params.delete('faceit_reason');
            const cleanQuery = params.toString();
            window.history.replaceState(null, '', `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}`);
        }

        const channel = new BroadcastChannel('faceit_oauth');
        channel.onmessage = (event: MessageEvent) => {
            const data = event.data as {
                type?: string;
                faceit_result?: string | null;
                faceit_nickname?: string | null;
                faceit_reason?: string | null;
            };

            if (data?.type !== 'faceit_callback') return;

            const result = data.faceit_result;
            if (result === 'linked') {
                completeLinkFlow(data.faceit_nickname ?? null);
            } else if (result === 'error') {
                const reason = data.faceit_reason ?? '';
                const key = `faceit.connect_error_${reason}`;
                toast.error(t(key, { defaultValue: t('faceit.connect_error') }));
                setIsActing(false);
                clearPolling();
            }
        };

        reloadStatus();

        return () => {
            clearPolling();
            channel.close();
        };
    // completeLinkFlow uses refs and state setters that are stable — adding it would cause infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    const handleConnect = async () => {
        hasCompletedRef.current = false;
        connectInitiatedRef.current = true;
        setIsActing(true);

        // Ouvre immédiatement une popup sur geste utilisateur pour éviter le blocage navigateur.
        const popup = window.open(
            '',
            'faceit_oauth',
            'popup=yes,width=540,height=760,left=120,top=80'
        );

        if (!popup) {
            toast.error(t('faceit.connect_error'));
            setIsActing(false);
            return;
        }

        try {
            const returnPath = '/faceit/popup-callback';
            // Sauvegarde du contexte actuel pour fallback si la popup ne peut pas se fermer.
            sessionStorage.setItem('tw.faceit.returnPath', `${window.location.pathname}?tab=profile`);

            const { authorizationUrl } = await initiateFaceitConnect(returnPath);
            popup.location.href = authorizationUrl;

            popupRef.current = popup;

            // Watchdog: même sans message callback (popup bloquée côté Faceit),
            // on détecte la liaison dès qu'elle est effective côté backend.
            clearPolling();
            pollIntervalRef.current = window.setInterval(() => {
                getFaceitStatus()
                    .then((faceitStatus) => {
                        if (faceitStatus.linked) {
                            completeLinkFlow(faceitStatus.faceitNickname);
                        }
                    })
                    .catch(() => {
                        // silent while OAuth is in progress
                    });
            }, 1500);

            // Garde-fou: on évite un état loading infini si rien ne revient.
            pollTimeoutRef.current = window.setTimeout(() => {
                clearPolling();
                if (!hasCompletedRef.current) {
                    setIsActing(false);
                }
            }, 90_000);

            closeWatcherRef.current = window.setInterval(() => {
                if (popupRef.current && popupRef.current.closed) {
                    if (closeWatcherRef.current !== null) {
                        window.clearInterval(closeWatcherRef.current);
                        closeWatcherRef.current = null;
                    }
                    popupRef.current = null;
                    if (!hasCompletedRef.current) {
                        setIsActing(false);
                    }
                }
            }, 500);
        } catch {
            toast.error(t('faceit.connect_error'));
            clearPolling();
            setIsActing(false);
        }
    };

    const handleDisconnect = async () => {
        setIsActing(true);
        try {
            await disconnectFaceit();
        } catch {
            toast.error(t('faceit.disconnect_error'));
            setIsActing(false);
            return;
        }
        setStatus({ linked: false, faceitNickname: null });
        toast.success(t('faceit.disconnect_success'));
        setIsActing(false);
        teamCtx?.refreshTeam?.().catch(() => {/* silent */});
    };

    if (isLoading || status === null) return null;

    if (variant === 'inline') {
        const linked = status.linked;
        return (
            <button
                onClick={linked ? (canEdit ? handleDisconnect : undefined) : (canEdit ? handleConnect : undefined)}
                disabled={isActing || !canEdit}
                title={linked
                    ? (status.faceitNickname ? `FACEIT · ${status.faceitNickname}` : 'FACEIT')
                    : t('faceit.connect_button')
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                    linked
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20'
                        : 'bg-neutral-800/70 border-neutral-700 text-neutral-500 hover:border-orange-500/30 hover:text-orange-300'
                } disabled:opacity-50`}
            >
                {isActing ? (
                    <span className="w-3.5 h-3.5 border border-orange-400/40 border-t-orange-300 rounded-full animate-spin" />
                ) : (
                    <FaceitIcon className="w-3.5 h-3.5" />
                )}
                <span className="uppercase tracking-wide">FACEIT</span>
                {linked
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    : <Circle className="w-3 h-3" />
                }
            </button>
        );
    }

    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                {t('faceit.connect_title')}
            </p>

            {status.linked ? (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <Link2 className="w-4 h-4 text-orange-400 shrink-0" />
                        <span className="text-sm text-neutral-200 truncate">
                            {t('faceit.connected_as', { nickname: status.faceitNickname })}
                        </span>
                    </div>
                    {canEdit && (
                        <button
                            onClick={handleDisconnect}
                            disabled={isActing}
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-700/50 text-neutral-500 hover:bg-neutral-600/60 hover:text-neutral-300 transition-colors disabled:opacity-50"
                            title={t('faceit.disconnect_button')}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-neutral-500">
                        {t('faceit.connect_info')}
                    </p>
                    {canEdit && (
                        <button
                            onClick={handleConnect}
                            disabled={isActing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                            {isActing ? (
                                <>
                                    <span className="w-3 h-3 border border-orange-400/40 border-t-orange-300 rounded-full animate-spin" />
                                    {t('common.loading')}
                                </>
                            ) : (
                                <>
                                    <ExternalLink className="w-3 h-3" />
                                    {t('faceit.connect_button')}
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
