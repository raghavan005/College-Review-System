import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertCircle, CheckCircle2, Star } from 'lucide-react';
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

type Step = 1 | 2 | 3;

export const WriteReviewDialog = ({ roleLabel }: { roleLabel: string }) => {
  const colleges = useApi(() => getColleges(), []);
  const list: College[] = colleges.data?.data ?? [];
  const sorted = useMemo(() => [...list].sort((a, b) => a.name.localeCompare(b.name)), [list]);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);

  const [collegeId, setCollegeId] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedCollege = useMemo(
    () => list.find((c) => c._id === collegeId) ?? null,
    [list, collegeId]
  );

  const reset = () => {
    setStep(1);
    setCollegeId('');
    setRating(5);
    setTitle('');
    setBody('');
    setSubmitting(false);
    setError(null);
    setSuccess(null);
  };

  const nextDisabled =
    (step === 1 && !collegeId) ||
    (step === 2 && (rating < 1 || rating > 5 || title.trim().length < 3)) ||
    (step === 3 && body.trim().length < 10);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createReview({ college: collegeId, rating, title: title.trim(), body: body.trim() });
      setSuccess('Review submitted.');
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 700);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button className="rounded-full" />}>
        Write a review
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>
            Posting as <span className="font-medium">{roleLabel}</span>. Profanity + emails/phones are blocked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

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
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="flex-1">{success}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose a college</label>
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
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rating</label>
              <div className="h-10 flex items-center px-2.5 rounded-xl border border-border/50 bg-card">
                <StarsPicker value={rating} onChange={setRating} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                className="h-10 rounded-xl border-border/50 bg-card"
                placeholder="Short summary"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Review</label>
            <textarea
              value={body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
              className="w-full min-h-36 p-3 rounded-xl border border-border/50 bg-card text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              placeholder="Write your experience. Don’t include emails/phone numbers."
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={submitting || step === 1}
            onClick={() => setStep((s) => (s === 1 ? 1 : (s - 1) as Step))}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button
              className="rounded-xl"
              disabled={submitting || nextDisabled}
              onClick={() => setStep((s) => (s === 3 ? 3 : (s + 1) as Step))}
            >
              Next
            </Button>
          ) : (
            <Button
              className="rounded-xl"
              disabled={submitting || nextDisabled}
              onClick={submit}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

