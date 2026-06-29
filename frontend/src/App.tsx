import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Dashboard } from './components/Dashboard';
import { ReviewsTable } from './components/ReviewsTable';
import { CollegesView } from './components/CollegesView';
import { SettingsView } from './components/SettingsView';
import { AnalyticsView } from './components/AnalyticsView';
import { UsersView } from './components/UsersView';
import { CommandPalette } from './components/CommandPalette';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { WebsiteTopBar } from './components/WebsiteTopBar';

type Screen = 'landing' | 'auth' | 'dashboard';

function AppInner() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cr_theme');
    const root = window.document.documentElement;
    if (saved === 'light') root.classList.remove('dark');
    else root.classList.add('dark');
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // If user logs in via AuthPage, transition to dashboard - handled via user state in context

  // Derive the current screen:
  // - If authenticated → always show dashboard
  // - Otherwise fall back to landing / auth
  const currentScreen: Screen = user ? 'dashboard' : screen;

  if (currentScreen === 'landing') {
    return <LandingPage onGetStarted={() => setScreen('auth')} />;
  }

  if (currentScreen === 'auth') {
    return (
      <AuthPage
        onBack={() => setScreen('landing')}
      />
    );
  }

  const role = user?.role ?? 'student';
  const isAdmin = role === 'admin';
  const websiteTab = (activeTab === 'analytics' || activeTab === 'users') ? 'dashboard' : activeTab;

  // Dashboard
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {isAdmin ? (
        <div className="flex">
          {/* Desktop sidebar */}
          <div className="hidden sm:block fixed left-0 top-0 z-40">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Mobile sidebar (drawer) */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="p-0">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex-1 sm:ml-64 flex flex-col min-h-screen">
            <TopNav
              onLogout={() => setScreen('landing')}
              onOpenCommandPalette={() => setCmdOpen(true)}
              onOpenMobileNav={() => setMobileNavOpen(true)}
            />
            <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} setActiveTab={setActiveTab} />
            <main className="flex-1 overflow-x-hidden bg-background">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'colleges' && <CollegesView />}
              {activeTab === 'reviews' && <ReviewsTable />}
              {activeTab === 'analytics' && <AnalyticsView />}
              {activeTab === 'settings' && <SettingsView />}
              {activeTab === 'users' && <UsersView />}
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col">
          <WebsiteTopBar
            activeTab={websiteTab as any}
            setActiveTab={setActiveTab as any}
            onLogout={() => setScreen('landing')}
            onOpenCommandPalette={() => setCmdOpen(true)}
          />
          <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} setActiveTab={setActiveTab} />
          <main className="flex-1 overflow-x-hidden bg-background">
            {websiteTab === 'dashboard' && <Dashboard />}
            {websiteTab === 'colleges' && <CollegesView />}
            {websiteTab === 'reviews' && <ReviewsTable />}
            {websiteTab === 'settings' && <SettingsView />}
            {/* non-admin tabs not shown */}
          </main>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
