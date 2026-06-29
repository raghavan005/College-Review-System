import { useState, useCallback, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { motion } from 'framer-motion';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  MoreHorizontal, Star, RefreshCw, AlertCircle, MessageSquare, Trash2, Pencil, Plus,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import {
  getReviews, deleteReview, updateReview, createReview, getColleges, type College,
  authorName, authorRole, collegeName, formatDate,
  type Review,
} from '../lib/api';

type RatingFilter = '' | '5' | '4' | '3' | '2' | '1';

function roleColor(role: string) {
  if (role === 'admin') return 'bg-destructive/10 text-destructive';
  if (role === 'teacher') return 'bg-warning/10 text-warning';
  return 'bg-accent/10 text-accent';
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/60 ${className}`} />;
}

export const ReviewsTable = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorCollege, setEditorCollege] = useState('');
  const [editorRating, setEditorRating] = useState('5');
  const [editorTitle, setEditorTitle] = useState('');
  const [editorBody, setEditorBody] = useState('');
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const limit = 10;
  const collegesQuery = useApi(() => getColleges(), []);
  const collegeList: College[] = collegesQuery.data?.data ?? [];

  const fetcher = useCallback(
    () => getReviews({
      page,
      limit,
      search: debouncedSearch || undefined,
      rating: ratingFilter ? Number(ratingFilter) : undefined,
    }),
    [page, debouncedSearch, ratingFilter]
  );

  const { data, loading, error, refetch } = useApi(fetcher, [page, debouncedSearch, ratingFilter]);

  const reviews: Review[] = data?.data ?? [];
  const pagination = data?.pagination;

  // Debounce search input
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const handleRatingFilter = (r: RatingFilter) => {
    setRatingFilter(r);
    setPage(1);
  };

  const openCreate = () => {
    setEditorOpen(true);
    setEditingId(null);
    setEditorCollege(collegeList[0]?._id ?? '');
    setEditorRating('5');
    setEditorTitle('');
    setEditorBody('');
    setEditorError(null);
  };

  const openEdit = (review: Review) => {
    setEditorOpen(true);
    setEditingId(review._id);
    setEditorCollege(typeof review.college === 'object' ? review.college._id : '');
    setEditorRating(String(review.rating));
    setEditorTitle(review.title);
    setEditorBody(review.body);
    setEditorError(null);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setEditorError(null);
  };

  const saveEditor = async () => {
    if (!editorTitle.trim() || editorBody.trim().length < 10) {
      setEditorError('Title and body (10+ chars) are required.');
      return;
    }
    if (!editingId && !editorCollege) {
      setEditorError('Select a college.');
      return;
    }
    setEditorSaving(true);
    setEditorError(null);
    try {
      const payload = {
        rating: Number(editorRating),
        title: editorTitle.trim(),
        body: editorBody.trim(),
      };
      if (editingId) {
        await updateReview(editingId, payload);
      } else {
        await createReview({ college: editorCollege, ...payload });
      }
      closeEditor();
      refetch();
    } catch (e: unknown) {
      setEditorError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setEditorSaving(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!confirm(`Delete review "${review.title}"?`)) return;
    setDeletingId(review._id);
    try {
      await deleteReview(review._id);
      refetch();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (review: Review) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const aid = typeof review.author === 'object' ? review.author._id : review.author;
    return aid === user._id;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Reviews</h2>
          <p className="text-muted-foreground mt-1">
            {pagination ? `${pagination.total} reviews across all colleges.` : 'Loading reviews...'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="rounded-xl h-9 gap-2 border-border/50" onClick={refetch}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {isAdmin && (
            <Button size="sm" className="rounded-xl h-9 gap-2" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
              Add Review
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={refetch} className="h-7 px-2 text-destructive hover:bg-destructive/10">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {isAdmin && editorOpen && (
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editingId ? 'Edit Review' : 'Create Review'}</h3>
            <Button variant="outline" size="sm" onClick={closeEditor}>Cancel</Button>
          </div>
          {editorError && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {editorError}
            </div>
          )}
          {!editingId && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">College</label>
              <select
                value={editorCollege}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditorCollege(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-border/50 bg-background text-sm"
              >
                <option value="">Select college</option>
                {collegeList.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Rating</label>
              <select
                value={editorRating}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditorRating(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-border/50 bg-background text-sm"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={String(n)}>{n} Star{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Title</label>
              <Input value={editorTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditorTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Body</label>
            <textarea
              value={editorBody}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditorBody(e.target.value)}
              className="w-full min-h-24 p-3 rounded-xl border border-border/50 bg-background text-sm"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveEditor} disabled={editorSaving}>
              {editorSaving ? 'Saving...' : editingId ? 'Update Review' : 'Create Review'}
            </Button>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="p-4 border-b border-border/50 flex flex-wrap items-center gap-3 bg-muted/20">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              className="pl-9 h-9 bg-background border-border/50 rounded-xl focus-visible:ring-primary/50 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground hidden sm:inline">Rating:</span>
            <div className="flex flex-wrap items-center gap-1">
              {(['', '5', '4', '3', '2', '1'] as RatingFilter[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRatingFilter(r)}
                  className={`h-7 px-2 sm:px-2.5 rounded-lg text-xs font-medium transition-colors ${
                    ratingFilter === r
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r === '' ? 'All' : `${r}★`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table - Desktop only */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="h-11 w-[180px]">Author</TableHead>
                <TableHead className="h-11 w-[180px]">College</TableHead>
                <TableHead className="h-11 w-[80px]">Rating</TableHead>
                <TableHead className="h-11">Title / Body</TableHead>
                <TableHead className="h-11 w-[120px]">Date</TableHead>
                <TableHead className="h-11 w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(limit)].map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><div className="flex gap-3 items-center"><Skeleton className="w-8 h-8 rounded-full" /><Skeleton className="h-3 w-24" /></div></TableCell>
                    <TableCell><Skeleton className="h-3 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-20" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-52 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 opacity-20" />
                      <p className="text-sm">No reviews found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.</p>
                      {debouncedSearch && (
                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleSearch('')}>
                          Clear search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => {
                  const name    = authorName(review);
                  const role    = authorRole(review);
                  const college = collegeName(review);
                  return (
                    <TableRow key={review._id} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="font-semibold text-xs text-primary">{name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-none">{name}</p>
                            <Badge variant="secondary" className={`text-xs mt-1 capitalize ${roleColor(role)}`}>{role}</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium leading-tight line-clamp-2">{college}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-warning text-sm font-semibold">
                          {review.rating}
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm font-medium truncate">{review.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{review.body}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </TableCell>
                      <TableCell>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => openEdit(review)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {canDelete(review) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingId === review._id}
                            onClick={() => handleDelete(review)}
                          >
                            {deletingId === review._id
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </Button>
                        )}
                        {!canDelete(review) && (
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Card list - Mobile only */}
        <div className="block md:hidden divide-y divide-border/50">
          {loading ? (
            [...Array(limit)].map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-3 w-1/3" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              </div>
            ))
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
              <MessageSquare className="w-8 h-8 opacity-20" />
              <p className="text-sm">No reviews found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.</p>
              {debouncedSearch && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleSearch('')}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            reviews.map((review) => {
              const name    = authorName(review);
              const role    = authorRole(review);
              const college = collegeName(review);
              return (
                <div key={review._id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-xs text-primary">{name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-none">{name}</p>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 mt-1 capitalize ${roleColor(role)}`}>{role}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-warning text-sm font-semibold bg-warning/5 px-2 py-0.5 rounded-lg border border-warning/10">
                      {review.rating}
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">College</span>
                    <p className="text-sm font-medium leading-snug">{college}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{review.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{review.body}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-border/10">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => openEdit(review)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                      {canDelete(review) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          disabled={deletingId === review._id}
                          onClick={() => handleDelete(review)}
                        >
                          {deletingId === review._id
                            ? <RefreshCw className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
          <div>
            {pagination
              ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, pagination.total)} of ${pagination.total}`
              : ' '}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="icon"
              className="w-8 h-8 rounded-lg border-border/50"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 text-xs">
              {pagination ? `Page ${page} of ${pagination.pages}` : '—'}
            </span>
            <Button
              variant="outline" size="icon"
              className="w-8 h-8 rounded-lg border-border/50"
              disabled={!pagination || page >= pagination.pages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
