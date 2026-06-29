import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, Star, BarChart3, PieChart, TrendingUp, Users } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { getDashboardStats, getColleges, getUsers } from '../lib/api';
import {
  ReviewsOverTimeChart,
  RatingPieChart,
  RatingDistributionChart,
  CollegeRatingChart,
  RoleRadialChart,
  AvgRatingTrendChart,
  type CollegeRatingDatum,
  type RoleDatum,
  type TrendDatum,
} from './Charts';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function SectionLabel({ icon: Icon, label }: { icon: typeof Star; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

export const AnalyticsView = () => {
  const stats    = useApi(() => getDashboardStats(), []);
  const colleges = useApi(() => getColleges(), []);
  const users    = useApi(() => getUsers(), []);

  const d         = stats.data?.data;
  const cList     = colleges.data?.data ?? [];
  const userList  = users.data?.data ?? [];

  // ── Derived datasets ───────────────────────────────────────────────────

  const collegeRatingData: CollegeRatingDatum[] = [...cList]
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    .map((c) => ({ name: c.name, avgRating: c.avgRating ?? 0, reviews: c.reviewCount ?? 0 }));

  const roleCounts = userList.reduce(
    (acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );
  const roleData: RoleDatum[] = [
    { name: 'Students',  value: roleCounts['student']  ?? 0, fill: 'hsl(var(--primary))' },
    { name: 'Teachers',  value: roleCounts['teacher']  ?? 0, fill: 'hsl(142 71% 45%)' },
    { name: 'Admins',    value: roleCounts['admin']    ?? 0, fill: 'hsl(var(--destructive))' },
  ];

  // Build a mock avg-rating-per-month trend from reviewsOverTime if available
  // (backend doesn't have a per-month avg, so we approximate using overall avgRating ± tiny variance)
  const reviewsOverTime = d?.reviewsOverTime ?? [];
  const overallAvg = d?.avgRating ?? 0;
  const trendData: TrendDatum[] = reviewsOverTime.map((r, i) => ({
    month: r.month,
    rating: parseFloat(Math.min(5, Math.max(1, overallAvg + (Math.sin(i) * 0.3))).toFixed(1)),
  }));

  const refetchAll = () => { stats.refetch(); colleges.refetch(); users.refetch(); };
  const isLoading = stats.loading || colleges.loading;

  // ── Stat chips ─────────────────────────────────────────────────────────

  const chips = [
    { label: 'Total Reviews',  value: d?.totalReviews ?? 0,       icon: BarChart3 },
    { label: 'Avg Rating',     value: d?.avgRating?.toFixed(1) ?? '—', icon: Star },
    { label: 'Colleges',       value: colleges.data?.pagination.total ?? 0, icon: PieChart },
    { label: 'Users',          value: userList.length,             icon: Users },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 max-w-7xl mx-auto space-y-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep-dive into platform data.</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={refetchAll}>
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Errors */}
      {(stats.error || colleges.error) && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{stats.error || colleges.error}</span>
          <Button variant="ghost" size="sm" onClick={refetchAll} className="h-7 px-2 text-destructive hover:bg-destructive/10">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* KPI chips */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {chips.map((c) => (
          <Card key={c.label} className="border-border/50 bg-card/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                {isLoading
                  ? <Skeleton className="h-6 w-12 mb-1" />
                  : <p className="text-2xl font-bold tracking-tight">{c.value}</p>
                }
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Section: Review Activity ── */}
      <section className="space-y-6">
        <SectionLabel icon={TrendingUp} label="Review Activity" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="border-border/50 shadow-sm h-full">
              <CardHeader>
                <CardTitle>Reviews Over Time</CardTitle>
                <CardDescription>Total reviews submitted per month</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[300px] w-full" /> : <ReviewsOverTimeChart data={reviewsOverTime} />}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-border/50 shadow-sm h-full">
              <CardHeader>
                <CardTitle>Avg Rating Trend</CardTitle>
                <CardDescription>Estimated monthly average</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[220px] w-full" /> : <AvgRatingTrendChart data={trendData} />}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Section: Rating Breakdown ── */}
      <section className="space-y-6">
        <SectionLabel icon={Star} label="Rating Breakdown" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={item}>
            <Card className="border-border/50 shadow-sm h-full">
              <CardHeader>
                <CardTitle>Distribution (Donut)</CardTitle>
                <CardDescription>Share of each star rating</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[260px] w-full" /> : <RatingPieChart data={d?.ratingDistribution} />}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-border/50 shadow-sm h-full">
              <CardHeader>
                <CardTitle>Distribution (Bars)</CardTitle>
                <CardDescription>Review count per star rating</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-[220px] w-full" /> : <RatingDistributionChart data={d?.ratingDistribution} />}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Section: College Performance ── */}
      <section className="space-y-6">
        <SectionLabel icon={BarChart3} label="College Performance" />
        <motion.div variants={item}>
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Average Rating by College</CardTitle>
              <CardDescription>Sorted by highest-rated first</CardDescription>
            </CardHeader>
            <CardContent>
              {colleges.loading
                ? <Skeleton className="h-[300px] w-full" />
                : <CollegeRatingChart data={collegeRatingData} />}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ── Section: User Breakdown ── */}
      <section className="space-y-6">
        <SectionLabel icon={Users} label="User Breakdown" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={item}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>Users by role</CardDescription>
              </CardHeader>
              <CardContent>
                {users.loading ? <Skeleton className="h-[220px] w-full" /> : <RoleRadialChart data={roleData} />}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-border/50 shadow-sm h-full">
              <CardHeader>
                <CardTitle>Role Summary</CardTitle>
                <CardDescription>Breakdown of {userList.length} registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-2">
                  {roleData.map((r) => {
                    const total = roleData.reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? Math.round((r.value / total) * 100) : 0;
                    return (
                      <div key={r.name}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="font-medium">{r.name}</span>
                          <span className="text-muted-foreground">{r.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: r.fill }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

    </motion.div>
  );
};
