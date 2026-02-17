import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTeam } from '@/contexts/team/useTeam';
import { useAuth } from '@/contexts/auth/useAuth';
import {
  Calendar,
  BarChart3,
  BookOpen,
  Trophy,
  Swords,
  Settings,
  LogOut,
  Globe,
  Home,
  ArrowLeftRight,
  Heart,
} from 'lucide-react';
import { cn } from '@/design-system';
import { appConfig } from '@/config/appConfig';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';
import { appStorage } from '@/shared/utils/storage/appStorage';

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
  const showLoader = useMinimumLoader(isLoading || !team, 800);

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
      id: 'scrims',
      label: t('nav.scrims'),
      icon: Swords,
      path: `/team/${team.id}/scrims`,
    },
    {
      id: 'results',
      label: t('nav.results'),
      icon: Trophy,
      path: `/team/${team.id}/results`,
    },
    {
      id: 'stratbook',
      label: t('nav.stratbook'),
      icon: BookOpen,
      path: `/team/${team.id}/stratbook`,
    },
    {
      id: 'stats',
      label: t('nav.stats'),
      icon: BarChart3,
      path: `/team/${team.id}/stats`,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    // Vraie déconnexion : retire le token et redirige vers login
    if (window.confirm(t('header.logout') + ' ?')) {
      logout();
      navigate('/login');
    }
  };

  const handleChangeTeam = () => {
    // Changer d'équipe : garde l'auth mais change de contexte team
    appStorage.clearLastTeamId();
    navigate('/select-team');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="w-60 flex-shrink-0 bg-neutral-900/50 border-r border-neutral-800 flex flex-col">
      {/* Header - Team Info + User */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
        <div className="p-4 h-[152px] flex flex-col justify-between">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white truncate">
                  {team.name}
                </h2>
                {team.tag && (
                  <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded text-xs font-bold border border-neutral-700 flex-shrink-0">
                    {team.tag}
                  </span>
                )}
              </div>
              {team.game && (
                <div className="text-xs text-neutral-500 mt-1 truncate">
                  {team.game}
                </div>
              )}
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <img
                src={user.avatarUrl ?? ''}
                alt={user.nickname}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {user.nickname}
                  </p>
                  <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400" aria-label="Online" />
                </div>
                <p className="text-xs text-neutral-500 truncate">
                  {user.steamId}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

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
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer - User & Actions */}
      <div className="flex-shrink-0 border-t border-neutral-800">
        {/* Actions */}
        <div className="p-3 space-y-1">
          {/* Donate */}
          <button
            onClick={() => window.open(kofiUrl, '_blank', 'noopener,noreferrer')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg border',
              'text-sm font-medium text-emerald-300 border-emerald-500/30',
              'bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-200',
              'transition-all duration-150'
            )}
          >
            <Heart className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">{t('donate.label')}</span>
          </button>

          {/* Change Team */}
          <button
            onClick={handleChangeTeam}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
              'text-sm font-medium text-neutral-400',
              'hover:text-white hover:bg-neutral-800/50',
              'transition-all duration-150'
            )}
          >
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">{t("sidebar.switch_team")}</span>
          </button>

          {/* Change Language */}
          <button
            onClick={toggleLanguage}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
              'text-sm font-medium text-neutral-400',
              'hover:text-white hover:bg-neutral-800/50',
              'transition-all duration-150'
            )}
          >
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">
              {i18n.language === 'fr' ? 'English' : 'Français'}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
              'text-sm font-medium text-neutral-400',
              'hover:text-red-400 hover:bg-red-500/10',
              'transition-all duration-150'
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">{t('header.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
