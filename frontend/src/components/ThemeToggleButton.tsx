import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const ThemeToggleButton = ({ className = '' }: { className?: string }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cr_theme');
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('cr_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('cr_theme', 'light');
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`rounded-full ${className}`}
      onClick={() => setIsDark((v) => !v)}
      title="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
};

