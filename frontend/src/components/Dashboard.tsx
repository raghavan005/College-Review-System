import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { motion } from 'framer-motion';
import {
  Building2, MessageSquare, Star, ArrowUpRight, Clock,
  MoreHorizontal, RefreshCw, AlertCircle,
} from 'lucide-react';
import { RatingPieChart, ReviewsOverTimeChart } from './Charts';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { StudentTeacherDashboard } from './StudentTeacherDashboard';
import {
  getColleges, getReviews, getDashboardStats,
  authorName, authorRole, collegeName, formatDate,
  type College, type Review,
} from '../lib/api';

// ── Animation variants ─────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 px-2 text-destructive hover:bg-destructive/10">
        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
      </Button>
    </div>
  );
}

function roleColor(role: string) {
  if (role === 'admin') return 'bg-destructive/10 text-destructive';
  if (role === 'teacher') return 'bg-warning/10 text-warning';
  return 'bg-accent/10 text-accent';
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role ?? 'student';

  if (role === 'student' || role === 'teacher') {
    return <StudentTeacherDashboard role={role} />;
  }

  const colleges = useApi(() => getColleges(), []);
  const reviews  = useApi(() => getReviews({ limit: 6 }), []);
  const stats    = useApi(() => getDashboardStats(), []);

  const collegeList: College[] = colleges.data?.data ?? [];
  const reviewList: Review[]   = reviews.data?.data  ?? [];
  const dashboardStats = stats.data?.data;

  const totalColleges = colleges.data?.pagination.total ?? 0;
  const totalReviews  = dashboardStats?.totalReviews ?? reviews.data?.pagination.total ?? 0;

  const avgRating = dashboardStats?.avgRating != null
    ? dashboardStats.avgRating.toFixed(1)
    : '—';

  const ratingDist = dashboardStats?.ratingDistribution ?? [];
  const reviewsOverTime = dashboardStats?.reviewsOverTime ?? [];

  const refreshAll = () => {
    colleges.refetch();
    reviews.refetch();
    stats.refetch();
  };

  const statsCards = [
    { label: 'Total Colleges', value: colleges.loading ? null : totalColleges.toLocaleString(), icon: Building2 },
    { label: 'Total Reviews',  value: stats.loading ? null : totalReviews.toLocaleString(), icon: MessageSquare },
    { label: 'Average Rating', value: stats.loading ? null : avgRating, icon: Star },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Live platform analytics from MongoDB Atlas.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2"
          onClick={refreshAll}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Errors */}
      {colleges.error && <ErrorBanner message={`Colleges: ${colleges.error}`} onRetry={colleges.refetch} />}
      {reviews.error  && <ErrorBanner message={`Reviews: ${reviews.error}`}   onRetry={reviews.refetch}  />}
      {stats.error    && <ErrorBanner message={`Stats: ${stats.error}`}         onRetry={stats.refetch}    />}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    {stat.value === null
                      ? <Skeleton className="h-9 w-24" />
                      : <p className="text-3xl font-semibold tracking-tight">{stat.value}</p>
                    }
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-sm">
                  <span className="text-accent flex items-center">
                    <ArrowUpRight className="w-4 h-4 inline mr-0.5" />
                    Live
                  </span>
                  <span className="text-muted-foreground">from database</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Reviews Over Time</CardTitle>
              <CardDescription>Monthly review submission volume</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ReviewsOverTimeChart data={reviewsOverTime} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>From {totalReviews} total reviews</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <RatingPieChart data={ratingDist} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Reviews + Top Colleges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Reviews */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Latest feedback submitted to the platform</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">{totalReviews} total</Badge>
            </CardHeader>
            <CardContent>
              {reviews.loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border/30">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviewList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm">
                    No reviews yet. Run{' '}
                    <code className="font-mono text-xs bg-muted px-1 rounded">npm run seed</code>{' '}
                    to add sample data.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewList.map((review) => {
                    const name    = authorName(review);
                    const role    = authorRole(review);
                    const college = collegeName(review);
                    return (
                      <div key={review._id} className="flex gap-4 p-4 rounded-2xl border border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="font-semibold text-primary text-sm">{name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{name}</span>
                              <Badge variant="secondary" className={`text-xs capitalize ${roleColor(role)}`}>
                                {role}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" />
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center text-warning">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'fill-transparent stroke-muted-foreground/30'}`}
                                />
                              ))}
                            </span>
                            <span className="text-muted-foreground/40">|</span>
                            <span className="truncate">{college}</span>
                          </div>
                          <p className="text-sm font-medium truncate">{review.title}</p>
                          <p className="text-sm text-foreground/70 line-clamp-2 leading-relaxed">{review.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Colleges */}
        <motion.div variants={item}>
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Colleges</CardTitle>
              <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={colleges.refetch}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {colleges.loading ? (
                <div className="space-y-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-12 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : collegeList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Building2 className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm text-center">
                    No colleges yet. Run{' '}
                    <code className="font-mono text-xs bg-muted px-1 rounded">npm run seed</code>.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {[...collegeList]
                    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
                    .slice(0, 6)
                    .map((college, idx) => (
                      <div key={college._id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{college.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{college.location}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 justify-end font-semibold text-sm">
                            <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                            {college.avgRating != null ? college.avgRating.toFixed(1) : '—'}
                          </div>
                          <p className="text-xs text-muted-foreground">{college.reviewCount ?? 0} rev</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
};
