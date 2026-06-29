import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useAuth } from '../context/AuthContext';

export const SettingsView = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Account and session settings.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Name:</span>
            <span className="text-sm font-medium">{user?.name ?? '—'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm font-medium">{user?.email ?? '—'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Role:</span>
            <Badge variant="secondary" className="capitalize">{user?.role ?? '—'}</Badge>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button variant="destructive" className="rounded-xl" onClick={logout}>
              Sign out
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                localStorage.removeItem('cr_token');
                localStorage.removeItem('cr_user');
                logout();
              }}
            >
              Clear local session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

