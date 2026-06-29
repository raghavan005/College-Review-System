import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Star, MapPin, Globe, CalendarDays,
  Search, RefreshCw, AlertCircle, ExternalLink,
  Trash2, Pencil, Plus, X,
} from 'lucide-react';
import { LottieButton } from './LottieButton';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { getColleges, createCollege, updateCollege, deleteCollege, type College } from '../lib/api';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.round(rating) ? 'fill-warning text-warning' : 'fill-transparent stroke-muted-foreground/30'
          }`}
        />
      ))}
      <span className="text-sm font-semibold ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

export const CollegesView = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, loading, error, refetch } = useApi(() => getColleges(), []);

  const [search, setSearch] = useState('');

  // Form state — null means form is closed
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [established, setEstablished] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const colleges: College[] = data?.data ?? [];
  const filtered = colleges.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));

  // Form helpers

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setLocation('');
    setDescription('');
    setWebsite('');
    setEstablished('');
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (c: College) => {
    setEditingId(c._id);
    setName(c.name);
    setLocation(c.location);
    setDescription(c.description ?? '');
    setWebsite(c.website ?? '');
    setEstablished(c.established != null ? String(c.established) : '');
    setFormError(null);
    setFormOpen(true);
    // Scroll form into view
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !location.trim()) {
      setFormError('Name and location are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        established: established.trim() ? Number(established) : undefined,
      };
      if (editingId) await updateCollege(editingId, payload);
      else await createCollege(payload);
      closeForm();
      refetch();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (college: College) => {
    if (!confirm(`Delete "${college.name}" and all its reviews? This cannot be undone.`)) return;
    try {
      await deleteCollege(college._id);
      refetch();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  // Render

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Colleges</h1>
          <p className="text-muted-foreground mt-1">
            {data ? `${data.pagination.total} colleges in the database` : 'Loading...'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={refetch}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {isAdmin && !formOpen && (
            <Button size="sm" className="rounded-full gap-2" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
              Add College
            </Button>
          )}
        </div>
      </div>

      {/* API error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={refetch} className="h-7 px-2 text-destructive hover:bg-destructive/10">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Add / Edit form */}
      <AnimatePresence>
        {isAdmin && formOpen && (
          <motion.div
            key="college-form"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary/30 shadow-md shadow-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">
                  {editingId ? 'Edit College' : 'Add New College'}
                </CardTitle>
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
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">College Name *</label>
                    <Input
                      placeholder="e.g. MIT"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      className="rounded-xl border-border/60 bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Location *</label>
                    <Input
                      placeholder="e.g. Cambridge, MA"
                      value={location}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                      className="rounded-xl border-border/60 bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Website</label>
                    <Input
                      placeholder="https://example.edu"
                      value={website}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
                      className="rounded-xl border-border/60 bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Established Year</label>
                    <Input
                      placeholder="e.g. 1861"
                      type="number"
                      value={established}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstablished(e.target.value)}
                      className="rounded-xl border-border/60 bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <textarea
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    placeholder="Brief description of the college..."
                    rows={3}
                    className="w-full p-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-end pt-1">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={closeForm}>
                    Cancel
                  </Button>
                  <LottieButton
                    loading={saving}
                    loadingText={editingId ? 'Updating...' : 'Creating...'}
                    onClick={handleSave}
                    className="h-9 rounded-xl px-5 text-sm"
                  >
                    {editingId ? 'Update College' : 'Create College'}
                  </LottieButton>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <Input
          placeholder="Search by name or location..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-9 rounded-xl border-border/50 bg-card focus-visible:ring-primary/40"
        />
      </div>

      {/* College Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Building2 className="w-12 h-12 opacity-20 mb-3" />
          <p className="text-base font-medium">
            {search ? `No colleges matching "${search}"` : 'No colleges yet.'}
          </p>
          {search ? (
            <Button variant="outline" className="mt-3 rounded-full" onClick={() => setSearch('')}>
              Clear search
            </Button>
          ) : isAdmin ? (
            <Button className="mt-4 rounded-full gap-2" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
              Add your first college
            </Button>
          ) : (
            <p className="text-sm mt-1">
              Run <code className="font-mono text-xs bg-muted px-1 rounded">npm run seed</code> to add sample data.
            </p>
          )}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sorted.map((college) => (
            <motion.div key={college._id} variants={cardItem}>
              <Card className={`border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full flex flex-col ${editingId === college._id ? 'border-primary/40 ring-1 ring-primary/20' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    {college.avgRating != null ? (
                      <StarRating rating={college.avgRating} />
                    ) : (
                      <span className="text-xs text-muted-foreground">No ratings yet</span>
                    )}
                  </div>
                  <CardTitle className="text-base leading-snug mt-2">{college.name}</CardTitle>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{college.location}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-between gap-4 pt-0">
                  {college.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {college.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary">
                        <Star className="w-3 h-3 fill-current" />
                        {college.reviewCount ?? 0} review{(college.reviewCount ?? 0) !== 1 ? 's' : ''}
                      </Badge>
                      {college.established && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Est. {college.established}
                        </Badge>
                      )}
                    </div>

                    {college.website && (
                      <a
                        href={college.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[180px]">{college.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-2 pt-1 border-t border-border/40 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg gap-1.5 flex-1"
                          onClick={() => openEdit(college)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 rounded-lg gap-1.5 flex-1 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20"
                          onClick={() => handleDelete(college)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
