import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../context/AuthContext';

type Command = {
  id: string;
  title: string;
  hint?: string;
  roles?: Array<'admin' | 'teacher' | 'student'>;
  run: () => void;
};

export const CommandPalette = ({
  open,
  onOpenChange,
  setActiveTab,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  setActiveTab: (tab: string) => void;
}) => {
  const { user, logout } = useAuth();
  type Role = 'admin' | 'teacher' | 'student';
  const role: Role = user?.role ?? 'student';

  const commands: Command[] = useMemo(() => {
    return [
      { id: 'dash', title: 'Go to Dashboard', hint: 'dashboard', run: () => setActiveTab('dashboard') },
      { id: 'colleges', title: 'Go to Colleges', hint: 'colleges', run: () => setActiveTab('colleges') },
      { id: 'reviews', title: 'Go to Reviews', hint: 'reviews', run: () => setActiveTab('reviews') },
      { id: 'analytics', title: 'Go to Analytics', hint: 'analytics', roles: ['admin', 'teacher'] as Role[], run: () => setActiveTab('analytics') },
      { id: 'users', title: 'Go to Users', hint: 'users', roles: ['admin'] as Role[], run: () => setActiveTab('users') },
      { id: 'settings', title: 'Go to Settings', hint: 'settings', run: () => setActiveTab('settings') },
      { id: 'logout', title: 'Sign out', hint: 'logout', run: () => logout() },
    ].filter((c) => !c.roles || c.roles.includes(role));
  }, [logout, role, setActiveTab]);

  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter((c) => `${c.title} ${c.hint ?? ''}`.toLowerCase().includes(s));
  }, [commands, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Command palette</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Type a command…"
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          className="h-10 rounded-xl"
        />
        <div className="mt-3 border border-border/50 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No commands found.</div>
          ) : (
            <div className="max-h-72 overflow-auto divide-y divide-border/50">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  className="w-full px-4 py-3 text-left hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
                  onClick={() => {
                    c.run();
                    onOpenChange(false);
                  }}
                >
                  <span className="text-sm font-medium">{c.title}</span>
                  {c.hint && <Badge variant="secondary" className="text-xs">{c.hint}</Badge>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Tip: press <span className="font-mono bg-muted px-1 rounded">Esc</span> to close.
        </div>
      </DialogContent>
    </Dialog>
  );
};

