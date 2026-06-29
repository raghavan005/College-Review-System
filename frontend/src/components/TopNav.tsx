import { useEffect, useState } from 'react';
import { Search, Bell, Sun, Moon, LogOut, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { useAuth } from '../context/AuthContext';

interface TopNavProps {
  onLogout: () => void;
  onOpenCommandPalette?: () => void;
  onOpenMobileNav?: () => void;
}

export const TopNav = ({ onLogout, onOpenCommandPalette, onOpenMobileNav }: TopNavProps) => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cr_theme');
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    return true; // default dark
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

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => onOpenMobileNav?.()}
          className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 max-w-md relative">
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
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsDark(!isDark)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
        </button>

        <div className="h-6 w-[1px] bg-border" />

        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 border border-border">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm text-left hidden sm:block">
            <p className="font-medium leading-none text-foreground">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role || ''}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
