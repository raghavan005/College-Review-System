import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AlertCircle, Building2, MessageSquare, RefreshCw, Search, Star } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getColleges, getDashboardStats, getReviews, type College, type Review } from '../lib/api';
import { AnimatedCounter } from './AnimatedCounter';
import { WriteReviewDialog } from './WriteReviewDialog';
import { authorName, authorRole, collegeName, formatDate } from '../lib/api';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function roleColor(role: string) {
  if (role === 'admin') return 'bg-destructive/10 text-destructive';
  if (role === 'teacher') return 'bg-warning/10 text-warning';
  return 'bg-accent/10 text-accent';
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
};

export const StudentTeacherDashboard = ({ role }: { role: 'student' | 'teacher' }) => {
  const [search, setSearch] = useState('');

  const colleges = useApi(() => getColleges(), []);
  const reviews = useApi(() => getReviews({ limit: 8, search: search.trim() || undefined }), [search]);
  const stats = useApi(() => getDashboardStats(), []);

  const collegeList: College[] = colleges.data?.data ?? [];
  const reviewList: Review[] = reviews.data?.data ?? [];

  const topRated = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = [...collegeList];
    if (query) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query)
      );
    }
    return list
      .filter((c) => c.avgRating != null)
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
      .slice(0, 4);
  }, [collegeList, search]);

  const refreshAll = () => {
    colleges.refetch();
    reviews.refetch();
    stats.refetch();
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-5 sm:p-8 max-w-6xl mx-auto space-y-5 sm:space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Explore reviews</h1>
          <p className="text-muted-foreground mt-1">
            Find top-rated colleges and share your experience as a <span className="capitalize font-medium text-foreground">{role}</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WriteReviewDialog roleLabel={role === 'teacher' ? 'Teacher' : 'Student'} />
          <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={refreshAll}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="max-w-2xl space-y-2">
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search colleges or reviews…"
            className="pl-9 h-10 rounded-full bg-card/60 border-border/50 focus-visible:ring-primary/40"
          />
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">
          Tip: press <span className="font-mono bg-muted px-1 rounded">Ctrl</span> + <span className="font-mono bg-muted px-1 rounded">K</span> for quick actions.
        </div>
      </motion.div>

      {/* Errors */}
      {(colleges.error || reviews.error || stats.error) && (
        <motion.div variants={item} className="space-y-2">
          {colleges.error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">Colleges: {colleges.error}</span>
            </div>
          )}
          {reviews.error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">Reviews: {reviews.error}</span>
            </div>
          )}
          {stats.error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">Stats: {stats.error}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* KPI counters */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Colleges</p>
              <p className="text-lg sm:text-xl font-semibold">
                {colleges.loading ? <Skeleton className="h-7 w-20" /> : <AnimatedCounter value={colleges.data?.pagination.total ?? collegeList.length} />}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Reviews</p>
              <p className="text-lg sm:text-xl font-semibold">
                {stats.loading ? <Skeleton className="h-7 w-20" /> : <AnimatedCounter value={stats.data?.data.totalReviews ?? 0} />}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Avg rating</p>
              <p className="text-lg sm:text-xl font-semibold">
                {stats.loading ? <Skeleton className="h-7 w-20" /> : <AnimatedCounter value={stats.data?.data.avgRating ?? 0} decimals={1} />}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Star className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top rated */}
      <motion.div variants={item}>
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Top rated colleges</CardTitle>
              <CardDescription>Highest average ratings right now</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs w-fit">{topRated.length} listed</Badge>
          </CardHeader>
          <CardContent>
            {colleges.loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : topRated.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Building2 className="w-10 h-10 opacity-20 mx-auto mb-2" />
                <p className="text-sm">No rated colleges yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topRated.map((c) => (
                  <div key={c._id} className="p-3 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.location}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end font-semibold text-sm text-warning">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {c.avgRating?.toFixed(1)}
                        </div>
                        <p className="text-xs text-muted-foreground">{c.reviewCount ?? 0} reviews</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Latest reviews */}
      <motion.div variants={item}>
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Latest reviews</CardTitle>
            <CardDescription>{search.trim() ? 'Reviews matching your search' : 'Recently posted reviews'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : reviewList.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <MessageSquare className="w-10 h-10 opacity-20 mx-auto mb-2" />
                <p className="text-sm">No reviews found.</p>
              </div>
            ) : (
              reviewList.map((r) => (
                <div key={r._id} className="p-3 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{r.title}</p>
                        <Badge variant="secondary" className={`text-xs capitalize ${roleColor(authorRole(r))}`}>
                          {authorRole(r)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {collegeName(r)} • by {authorName(r)} • {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0 text-warning">
                      {r.rating}★
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

