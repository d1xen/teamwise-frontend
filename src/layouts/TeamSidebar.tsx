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
  Crosshair,
  Medal,
  MessagesSquare,
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
      id: 'matches',
      label: t('nav.matches'),
      icon: Crosshair,
      path: `/team/${team.id}/matches`,
    },
    {
      id: 'tournaments',
      label: t('nav.tournaments'),
      icon: Medal,
      path: `/team/${team.id}/tournaments`,
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
    {
      id: 'messaging',
      label: t('nav.messaging'),
      icon: MessagesSquare,
      path: `/team/${team.id}/messaging`,
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
      <style>{`
        @keyframes fadeColor {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        .animate-fade-color {
          animation: fadeColor 4s ease-in-out infinite;
        }
        @keyframes waveGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-wave-gradient {
          background-size: 200% 200%;
          animation: waveGradient 4s ease-in-out infinite;
        }
      `}</style>

      {/* Header - Logo & Team Info */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
        <div className="px-5 py-3 h-[140px] flex flex-col justify-center space-y-3">
          {/* Logo Teamwise */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white leading-tight tracking-wide">
              TEAM
              <span className="animate-fade-color animate-wave-gradient inline-block text-transparent bg-clip-text bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-400">
                WISE
              </span>
            </h1>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

          {/* Team Info */}
          <div className="text-center space-y-0.5">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">
                {team.name}
              </h2>
              {team.tag && (
                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded text-xs font-bold border border-neutral-700">
                  {team.tag}
                </span>
              )}
            </div>
            {team.game && (
              <div className="text-xs text-neutral-500">
                {team.game}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 pl-5 pr-3 space-y-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
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
        {/* Premium Button */}
        {/*<div className="px-5 py-2">*/}
        {/*  <button*/}
        {/*    onClick={() => {*/}
        {/*      console.log('Navigate to premium payment');*/}
        {/*    }}*/}
        {/*    className={cn(*/}
        {/*      'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border',*/}
        {/*      'text-xs font-bold text-white',*/}
        {/*      'relative overflow-hidden',*/}
        {/*      'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20',*/}
        {/*      'border-amber-500/40 hover:border-amber-400/60',*/}
        {/*      'hover:from-amber-500/30 hover:via-yellow-500/20 hover:to-amber-500/30',*/}
        {/*      'transition-all duration-200 transform hover:scale-[1.02]',*/}
        {/*      'shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40'*/}
        {/*    )}*/}
        {/*  >*/}
        {/*    /!* Shimmer effect *!/*/}
        {/*    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />*/}
        {/*    <span className="relative">PREMIUM</span>*/}
        {/*  </button>*/}
        {/*</div>*/}

        {/* User Profile */}
        {user && (
          <div className="px-5 py-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={user.avatarUrl ?? ''}
                alt={user.nickname}
                className="w-10 h-10 rounded-lg object-cover ring-2 ring-neutral-700/50"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.nickname}
                  </p>
                  <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" aria-label="Online" />
                </div>
                <p className="text-xs text-neutral-500">En ligne</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-3 space-y-1">
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
