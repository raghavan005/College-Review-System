import { useEffect, useState } from 'react';
import { Building2, Moon, Sun, LogOut, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

type Tab = 'dashboard' | 'colleges' | 'reviews' | 'settings';

export const WebsiteTopBar = ({
  activeTab,
  setActiveTab,
  onLogout,
  onOpenCommandPalette,
}: {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  onLogout: () => void;
  onOpenCommandPalette?: () => void;
}) => {
  const { user, logout } = useAuth();

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cr_theme');
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    return true;
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cr_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'dashboard', label: 'Home' },
    { id: 'colleges', label: 'Colleges' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 shrink-0"
          aria-label="Go home"
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight hidden sm:block">Collegrad</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-3 py-2 rounded-full text-sm font-medium transition-colors',
                activeTab === t.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 max-w-md relative ml-auto">
          <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <Input
            readOnly
            placeholder={isMobile ? "Search…" : "Search… (Ctrl + K)"}
            onClick={() => onOpenCommandPalette?.()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onOpenCommandPalette?.();
              }
            }}
            className="pl-9 bg-muted/30 border-transparent focus-visible:ring-primary/50 focus-visible:bg-background rounded-full transition-all cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setIsDark(!isDark)}
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <div className="hidden sm:flex items-center gap-2 pr-1">
            <Avatar className="w-8 h-8 border border-border">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm text-left">
              <p className="font-medium leading-none">{user?.name ?? 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role ?? ''}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden border-t border-border bg-background/70">
        <div className="max-w-7xl mx-auto px-2 py-2 flex items-center justify-between gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors',
                activeTab === t.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

