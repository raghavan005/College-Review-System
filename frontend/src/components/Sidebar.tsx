import React from 'react';
import { cn } from '../lib/utils';
import { Home, Building2, MessageSquare, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onNavigate }) => {
  const { user, logout } = useAuth();

  type Role = 'admin' | 'teacher' | 'student';
  const role: Role = user?.role ?? 'student';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'teacher', 'student'] as Role[] },
    { id: 'colleges', label: 'Colleges', icon: Building2, roles: ['admin', 'teacher', 'student'] as Role[] },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, roles: ['admin', 'teacher', 'student'] as Role[] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin'] as Role[] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'teacher'] as Role[] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'teacher', 'student'] as Role[] },
  ].filter((i) => i.roles.includes(role));

  return (
    <aside className="w-64 h-screen border-r border-border bg-card flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
          <Building2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg tracking-tight">Collegrad</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              onNavigate?.();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
              activeTab === item.id
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-primary/10 rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <item.icon className="w-5 h-5 z-10" />
            <span className="z-10">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};
