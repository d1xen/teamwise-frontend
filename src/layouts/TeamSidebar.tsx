import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useEffect } from 'react';
import { useTeam } from '@/contexts/team/useTeam';
import { useAuth } from '@/contexts/auth/useAuth';
import { useMatchSummary } from '@/features/match/hooks/useMatchSummary';
import {
  Calendar,
  BarChart3,
  BookOpen,
  Swords,
  Settings,
  LogOut,
  Globe,
  Home,
  ArrowLeftRight,
  Heart,
  Crosshair,
  MessagesSquare,
} from 'lucide-react';
import Flag from 'react-world-flags';
import { cn } from '@/design-system';
import { appConfig } from '@/config/appConfig';
import TeamWiseLogo from '@/shared/components/TeamWiseLogo';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';
import { appStorage } from '@/shared/utils/storage/appStorage';
import { getAvatarUrl } from '@/shared/utils/avatarUtils';

import ConfirmModal from '@/shared/components/ConfirmModal';
import AppVersion from '@/shared/components/AppVersion';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

/**
 * TeamSidebar - Sidebar contextuelle pour une team
 * Inclut: navigation, team info, user profile, actions (logout/langue)
 */
export default function TeamSidebar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { team, isLoading } = useTeam();
  const { user, logout } = useAuth();
  const kofiUrl = appConfig.externalLinks.kofi;
  const showLoader = useMinimumLoader(!team, 800);
  const [langOpen, setLangOpen] = useState(false);
  const { toCompleteCount } = useMatchSummary(team?.id ?? "");
  const footerAvatarUrl = user ? getAvatarUrl(user) : null;
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  if (showLoader) {
    return (
      <div className="w-60 flex-shrink-0 bg-neutral-900/50 border-r border-neutral-800 flex items-center justify-center">
        <div className="text-sm text-neutral-400">{t("common.loading")}</div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      id: 'team',
      label: t('nav.team'),
      icon: Home,
      path: `/team/${team.id}`,
    },
    {
      id: 'management',
      label: t('nav.management'),
      icon: Settings,
      path: `/team/${team.id}/management`,
    },
    {
      id: 'schedule',
      label: t('nav.schedule'),
      icon: Calendar,
      path: `/team/${team.id}/agenda`,
    },
    {
      id: 'matches',
      label: t('nav.matches'),
      icon: Crosshair,
      path: `/team/${team.id}/matches`,
    },
    {
      id: 'stratbook',
      label: t('nav.stratbook'),
      icon: BookOpen,
      path: `/team/${team.id}/stratbook`,
    },
    {
      id: 'scrims',
      label: t('nav.scrims'),
      icon: Swords,
      path: `/team/${team.id}/scrims`,
    },
    {
      id: 'stats',
      label: t('nav.stats'),
      icon: BarChart3,
      path: `/team/${team.id}/stats`,
    },
    {
      id: 'messaging',
      label: t('nav.messaging'),
      icon: MessagesSquare,
      path: `/team/${team.id}/messaging`,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => { logout(); navigate('/login'); };

  const handleChangeTeam = () => {
    // Changer d'équipe : garde l'auth mais change de contexte team
    appStorage.clearLastTeamId();
    navigate('/select-team');
  };

  return (
    <div className="w-60 flex-shrink-0 bg-neutral-900/50 border-r border-neutral-800 flex flex-col">
      {/* Header - Brand & Team Info */}
      <div className="flex-shrink-0 border-b border-neutral-800">
        <div className="pl-8 pr-5 flex flex-col justify-center gap-2 h-[132px]">

          <div className="flex items-center gap-2">
            <TeamWiseLogo size={30} />
            <AppVersion />
          </div>

          <p className="text-sm font-bold text-white truncate leading-tight">{team.name}</p>

          <div className="flex items-center gap-1.5">
            {team.tag && (
              <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded text-[10px] font-bold border border-neutral-700/80">
                {team.tag}
              </span>
            )}
            {team.game && (
              <span className="text-[11px] text-neutral-600">{team.game}</span>
            )}
          </div>

        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 pl-5 pr-3 space-y-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const hasPendingMatches = item.id === 'matches' && toCompleteCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 truncate text-left">
                {item.id === 'matches' ? (
                  <span className="relative inline-block pr-2">
                    {item.label}
                    {hasPendingMatches && (
                      <span
                        className="absolute top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400"
                        title={t('matches.tab_to_complete')}
                      />
                    )}
                  </span>
                ) : (
                  item.label
                )}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-neutral-800">

        {/* Donate */}
        <button
          onClick={() => window.open(kofiUrl, '_blank', 'noopener,noreferrer')}
          className="w-full flex items-center gap-3 px-8 py-2.5 text-neutral-500 hover:text-emerald-300 hover:bg-neutral-800/50 transition-all duration-150"
        >
          <Heart className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{t('donate.label')}</span>
        </button>

        {/* Profile bar */}
        {user && (
          <div className="border-t border-neutral-800 px-5 py-3 flex items-center gap-2.5">
            <div className="relative shrink-0">
              <img
                src={footerAvatarUrl ?? ''}
                alt={user.nickname}
                className="w-7 h-7 rounded-md object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-neutral-900" />
            </div>
            <p className="flex-1 text-sm font-medium text-neutral-300 truncate min-w-0">{user.nickname}</p>
            <div className="flex items-center gap-0.5 shrink-0">
              <div ref={langRef} className="relative">
                <button
                  onClick={() => setLangOpen((o) => !o)}
                  className="relative group p-1.5 rounded-md text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-neutral-800 border border-neutral-700 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('sidebar.language')}
                  </span>
                </button>
                {langOpen && (
                  <div className="absolute bottom-full right-0 mb-1.5 w-36 bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-xl overflow-hidden">
                    {(['fr', 'en'] as const).map((lng) => {
                      const active = i18n.language === lng;
                      return (
                        <button
                          key={lng}
                          onClick={() => { i18n.changeLanguage(lng); setLangOpen(false); }}
                          className={cn(
                            'flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium transition-colors',
                            active
                              ? 'text-white bg-neutral-800'
                              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                          )}
                        >
                          <Flag code={lng === 'fr' ? 'FR' : 'GB'} className="w-4 h-3 rounded-[2px]" />
                          {lng === 'fr' ? 'Français' : 'English'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="relative group">
                <button
                  onClick={handleChangeTeam}
                  className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-neutral-800 border border-neutral-700 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('sidebar.switch_team')}
                </span>
              </div>
              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-neutral-800 border border-neutral-700 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('header.logout')}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {showLogoutConfirm && (
        <ConfirmModal
          title={t('auth.logout')}
          description={t('auth.logout_confirm')}
          confirmLabel={t('auth.logout')}
          cancelLabel={t('common.cancel')}
          variant="danger"
          onConfirm={async () => confirmLogout()}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}
