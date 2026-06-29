import { useState, type FormEvent } from 'react';
import { Building2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { LottieButton } from '../components/LottieButton';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onBack: () => void;
}

type Mode = 'login' | 'register';

export function AuthPage({ onBack }: AuthPageProps) {
  const { login, register, isLoading, error, clearError } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  const switchMode = (m: Mode) => {
    setMode(m);
    clearError();
    setFormError(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('student');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (mode === 'register') {
      if (name.trim().length < 2) {
        setFormError('Name must be at least 2 characters.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters.');
        return;
      }
      try {
        await register(name.trim(), email.trim(), password, role);
      } catch {
        // error shown from context
      }
    } else {
      try {
        await login(email.trim(), password);
      } catch {
        // error shown from context
      }
    }
  };

  const displayError = formError || error;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">Collegrad</span>
          </div>
        </div>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === 'login'
                ? 'Sign in to access your dashboard'
                : 'Join the Collegrad community today'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex p-1 bg-muted rounded-xl mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  mode === m
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Error */}
          {displayError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {displayError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                  required
                  className="w-full h-10 px-3 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">I am a</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['student', 'teacher', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                        role === r
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit — uses LottieButton with loading animation */}
            <LottieButton
              type="submit"
              loading={isLoading}
              loadingText={mode === 'login' ? 'Signing in...' : 'Creating account...'}
              fullWidth
              className="mt-2 h-11 rounded-xl"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </LottieButton>
          </form>

          {/* Switch mode link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-primary font-medium hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>

          {/* Demo credentials hint */}
          {mode === 'login' && (
            <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/50 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm mb-2">Demo credentials</p>
              <p>Admin: <span className="font-mono">admin@college.com</span> / <span className="font-mono">Admin@1234</span></p>
              <p>Teacher: <span className="font-mono">alice@college.com</span> / <span className="font-mono">Teacher@1234</span></p>
              <p>Student: <span className="font-mono">charlie@college.com</span> / <span className="font-mono">Student@1234</span></p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
