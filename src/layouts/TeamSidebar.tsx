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
  LayoutDashboard,
  Home,
  ArrowLeftRight,
  Heart,
  Crosshair,
  Trophy,
  MessagesSquare,
  MonitorPlay,
  Bell,
} from 'lucide-react';
import Flag from 'react-world-flags';
import { cn } from '@/design-system';
import { appConfig } from '@/config/appConfig';
import TeamWiseLogo from '@/shared/components/TeamWiseLogo';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';
import { appStorage } from '@/shared/utils/storage/appStorage';
import { UserAvatar } from '@/shared/components/UserAvatar';
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
  const { team } = useTeam();
  const { user, logout } = useAuth();
  const kofiUrl = appConfig.externalLinks.kofi;
  const showLoader = useMinimumLoader(!team, 800);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langExpanded, setLangExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { toCompleteCount } = useMatchSummary(team?.id ?? "");
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setLangExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  if (showLoader) {
    return (
      <div className="w-52 flex-shrink-0 bg-neutral-900/50 border-r border-neutral-800 flex items-center justify-center">
        <div className="text-sm text-neutral-400">{t("common.loading")}</div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      path: `/team/${team.id}/dashboard`,
    },
    {
      id: 'team',
      label: t('nav.team'),
      icon: Home,
      path: `/team/${team.id}/team`,
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
      id: 'competitions',
      label: t('nav.competitions'),
      icon: Trophy,
      path: `/team/${team.id}/competitions`,
    },
    {
      id: 'stratbook',
      label: t('nav.stratbook'),
      icon: BookOpen,
      path: `/team/${team.id}/stratbook`,
    },
    {
      id: 'demo',
      label: t('nav.demo'),
      icon: MonitorPlay,
      path: `/team/${team.id}/demo`,
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

  const isActive = (path: string) => {
    if (path.endsWith("/dashboard") && location.pathname === `/team/${team.id}`) return true;
    return location.pathname === path;
  };

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => { logout(); navigate('/login'); };

  const handleChangeTeam = () => {
    // Changer d'équipe : garde l'auth mais change de contexte team
    appStorage.clearLastTeamId();
    navigate('/select-team');
  };

  return (
    <div className="w-52 flex-shrink-0 bg-neutral-900/50 border-r border-neutral-800 flex flex-col">
      {/* Header - Brand & Team Info */}
      <div className="flex-shrink-0 border-b border-neutral-800">
        <div className="px-5 flex flex-col justify-center gap-1.5 h-[132px]">

          <div className="flex flex-col gap-0.5">
            <TeamWiseLogo size={32} />
            <AppVersion />
          </div>

          <p className="text-sm font-bold text-white truncate leading-tight">{team.name}</p>

          {team.game && (() => {
            const GAME_STYLE: Record<string, string> = {
              CS2:      "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
              VALORANT: "bg-red-500/10 text-red-300 border-red-500/20",
            };
            return (
              <span className={`self-start px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${GAME_STYLE[team.game] ?? "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                {team.game}
              </span>
            );
          })()}

        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
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

        <div className="px-3 py-2 space-y-0.5">
          {/* Discord */}
          <button
            onClick={() => window.open(appConfig.externalLinks.discord, '_blank', 'noopener,noreferrer')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-500 hover:text-[#5865F2] hover:bg-neutral-800/50 transition-all duration-150"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            <span className="text-sm font-medium">Discord</span>
          </button>

          {/* Donate */}
          <button
            onClick={() => window.open(kofiUrl, '_blank', 'noopener,noreferrer')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-500 hover:text-emerald-300 hover:bg-neutral-800/50 transition-all duration-150"
          >
            <Heart className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{t('donate.label')}</span>
          </button>
        </div>

        {/* Profile + actions menu */}
        {user && (
          <div ref={langRef} className="relative border-t border-neutral-800">
            <div className="flex items-center px-3 py-2.5">
              <button
                onClick={() => { setMenuOpen((o) => !o); setLangExpanded(false); }}
                className="flex items-center gap-3 flex-1 min-w-0 px-3 py-1.5 rounded-lg hover:bg-neutral-800/50 transition-colors"
              >
                <div className="relative shrink-0">
                  <UserAvatar
                    profileImageUrl={user.profileImageUrl}
                    avatarUrl={user.avatarUrl}
                    nickname={user.nickname}
                    size={24}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border-[1.5px] border-neutral-900" />
                </div>
                <p className="text-sm font-medium text-neutral-300 truncate min-w-0">{user.nickname}</p>
              </button>
              <div className="relative group shrink-0">
                <button className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors">
                  <Bell className="w-4 h-4" />
                </button>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-neutral-800 border border-neutral-700 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {t('notifications.coming_soon')}
                </span>
              </div>
            </div>

            {menuOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-1.5 bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); handleChangeTeam(); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  {t('sidebar.switch_team')}
                </button>

                <div className="border-t border-neutral-800">
                  <button
                    onClick={() => setLangExpanded((o) => !o)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {t('sidebar.language')}
                  </button>
                  {langExpanded && (
                    <div className="pl-7">
                      {(['fr', 'en'] as const).map((lng) => {
                        const active = i18n.language === lng;
                        return (
                          <button
                            key={lng}
                            onClick={() => { i18n.changeLanguage(lng); setMenuOpen(false); setLangExpanded(false); }}
                            className={cn(
                              'flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium transition-colors',
                              active
                                ? 'text-white'
                                : 'text-neutral-500 hover:text-white'
                            )}
                          >
                            <Flag code={lng === 'fr' ? 'FR' : 'GB'} className="w-4 h-3 rounded-none" />
                            {lng === 'fr' ? 'Français' : 'English'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-800">
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('header.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {showLogoutConfirm && (
        <ConfirmModal
          title={t('auth.logout_title')}
          description={t('auth.logout_confirm')}
          confirmLabel={t('auth.logout')}
          cancelLabel={t('common.cancel')}
          variant="warning"
          onConfirm={async () => confirmLogout()}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}
