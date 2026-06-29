import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertCircle, CheckCircle2, RefreshCw, Star } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { createReview, getColleges, type College } from '../lib/api';

function StarsPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 text-warning">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className="p-1 rounded hover:bg-muted/60 transition-colors"
            aria-label={`${v} star`}
          >
            <Star className={`w-5 h-5 ${v <= value ? 'fill-current' : 'fill-transparent stroke-muted-foreground/40'}`} />
          </button>
        );
      })}
      <span className="ml-2 text-sm font-semibold text-foreground">{value}/5</span>
    </div>
  );
}

export const ReviewComposer = ({ roleLabel }: { roleLabel: string }) => {
  const colleges = useApi(() => getColleges(), []);
  const list: College[] = colleges.data?.data ?? [];

  const sorted = useMemo(
    () => [...list].sort((a, b) => a.name.localeCompare(b.name)),
    [list]
  );

  const [collegeId, setCollegeId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit =
    !!collegeId &&
    title.trim().length >= 3 &&
    body.trim().length >= 10 &&
    rating >= 1 &&
    rating <= 5 &&
    !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createReview({ college: collegeId, rating, title: title.trim(), body: body.trim() });
      setSuccess('Review submitted.');
      setTitle('');
      setBody('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCollege = useMemo(
    () => list.find((c) => c._id === collegeId) ?? null,
    [list, collegeId]
  );

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Write a review</CardTitle>
          <CardDescription>
            Posting as <span className="font-medium">{roleLabel}</span>. No emails/phone numbers, and profanity is blocked.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={colleges.refetch}>
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh colleges
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {colleges.error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{colleges.error}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 text-sm text-accent-foreground">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="flex-1">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">College</label>
            <Select value={collegeId} onValueChange={(v) => setCollegeId(v ?? '')}>
              <SelectTrigger className="w-full h-9 rounded-xl border-border/50 bg-card">
                <SelectValue placeholder={colleges.loading ? 'Loading...' : 'Select a college'}>
                  {selectedCollege ? `${selectedCollege.name} — ${selectedCollege.location}` : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent sideOffset={8} align="start" className="max-h-[60vh]">
                <SelectGroup>
                  {sorted.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} — {c.location}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Rating</label>
            <div className="h-9 flex items-center px-2.5 rounded-xl border border-border/50 bg-card">
              <StarsPicker value={rating} onChange={setRating} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            className="h-9 rounded-xl border-border/50 bg-card"
            placeholder="Short summary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Review</label>
          <textarea
            value={body}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
            className="w-full min-h-32 p-3 rounded-xl border border-border/50 bg-card text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            placeholder="Write your experience. Don’t include emails/phone numbers."
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            className="rounded-xl"
            disabled={!canSubmit}
            onClick={submit}
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

