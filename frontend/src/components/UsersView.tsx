import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { AlertCircle, RefreshCw, Users, Pencil, Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, type UserSummary } from '../lib/api';

function roleColor(role: string) {
  if (role === 'admin') return 'bg-destructive/10 text-destructive';
  if (role === 'teacher') return 'bg-warning/10 text-warning';
  return 'bg-accent/10 text-accent';
}

export const UsersView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [formOpen, setFormOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('student');
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const startEdit = (u: UserSummary) => {
    setEditingId(u._id);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setFormError(null);
    setFormOpen(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const onSave = async () => {
    if (!name.trim() || !email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (!editingId && password.trim().length < 6) {
      setFormError('Password (min 6 chars) is required for new users.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await updateUser(editingId, {
          name: name.trim(),
          email: email.trim(),
          role,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
      } else {
        await createUser({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
        });
      }
      closeForm();
      fetchUsers();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (u: UserSummary) => {
    if (!confirm(`Delete user "${u.name}"?`)) return;
    try {
      await deleteUser(u._id);
      fetchUsers();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Admin-only</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You don’t have access to this view.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Admin directory of registered users.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={fetchUsers}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {!formOpen && (
            <Button size="sm" className="rounded-full gap-2" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchUsers} className="h-7 px-2 text-destructive hover:bg-destructive/10">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <motion.div
            key="user-form"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary/30 shadow-md shadow-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">{editingId ? 'Edit User' : 'Create User'}</CardTitle>
                  <CardDescription>Admin CRUD for users</CardDescription>
                </div>
                <button
                  onClick={closeForm}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                {formError && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Name *" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                  <Input placeholder="Email *" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
                  <Input
                    placeholder={editingId ? 'New password (optional)' : 'Password *'}
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  />
                  <select
                    value={role}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as 'admin' | 'teacher' | 'student')}
                    className="h-9 px-3 rounded-xl border border-border/50 bg-background text-sm w-full"
                  >
                    <option value="student">student</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button size="sm" className="rounded-xl px-5" onClick={onSave} disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All users</CardTitle>
            <CardDescription>{loading ? 'Loading...' : `${users.length} users`}</CardDescription>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Table - Desktop only */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[90px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u._id} className="border-border/50">
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize ${roleColor(u.role)}`}>{u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => startEdit(u)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg hover:text-destructive hover:bg-destructive/10"
                            disabled={u._id === user._id}
                            onClick={() => onDelete(u)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Card list - Mobile only */}
          <div className="block md:hidden divide-y divide-border/50">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading…</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users found.</div>
            ) : (
              users.map((u) => (
                <div key={u._id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{u.name}</p>
                    <Badge variant="secondary" className={`text-xs capitalize ${roleColor(u.role)}`}>{u.role}</Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="truncate"><span className="font-medium text-foreground/70">Email:</span> {u.email}</p>
                    <p><span className="font-medium text-foreground/70">Registered:</span> {new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-border/10">
                    <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => startEdit(u)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={u._id === user._id}
                      onClick={() => onDelete(u)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

