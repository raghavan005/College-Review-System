import { Building2, Star, Users, MessageSquare, ArrowRight, Shield, BarChart3 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { GLSLHills } from '../../components/ui/glsl-hills';
import { ThemeToggleButton } from '../components/ThemeToggleButton';

interface LandingPageProps {
  onGetStarted: () => void;
}

const stats = [
  { label: 'Colleges Listed', value: '4,200+' },
  { label: 'Student Reviews', value: '142,000+' },
  { label: 'Active Users', value: '28,000+' },
  { label: 'Avg Rating', value: '4.2 / 5' },
];

const features = [
  {
    icon: Star,
    title: 'Honest Reviews',
    desc: 'Real ratings from students, teachers, and administrators. No paid placements.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Admins manage colleges, teachers share insights, students share their experience.',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    desc: 'Aggregated ratings and trends help you compare colleges at a glance.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    desc: 'Contributions from the academic community keep information accurate and up to date.',
  },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">

      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Collegrad</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <Button onClick={onGetStarted} className="rounded-full px-5">
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — GLSL hills as full-bleed background */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: '90vh' }}>
        {/* Three.js animated hills — fills the entire hero */}
        <div className="absolute inset-0 z-0">
          <GLSLHills width="100%" height="100%" cameraZ={125} planeSize={256} speed={0.5} />
        </div>

        {/* Gradient overlay to fade hills into background at top & bottom */}
        <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-b from-background via-transparent to-background" />

        {/* Hero content sits above the canvas */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 px-6 py-12 sm:py-20 flex flex-col items-center">
          
          <div className="relative max-w-4xl w-full rounded-2xl border border-white/10 dark:border-white/5 bg-card/30 backdrop-blur-xl p-2 shadow-[0_20px_50px_rgba(99,102,241,0.25)] dark:shadow-[0_20px_50px_rgba(99,102,241,0.15)] transition-all duration-500 hover:shadow-[0_30px_70px_rgba(99,102,241,0.35)] hover:-translate-y-1 group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-accent/30 opacity-30 blur-2xl -z-10 group-hover:opacity-50 transition-opacity duration-500" />

            <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1.5 border-b border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive/80 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-warning/80 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-success/80 block" />
              <span className="mx-auto text-[10px] font-mono text-muted-foreground/60 select-none">collegrad_demo.mp4</span>
            </div>

            <div className="relative rounded-xl overflow-hidden mt-2 bg-black/40 ring-1 ring-white/10 shadow-inner">
              <video
                className="w-full h-auto object-cover pointer-events-none"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="https://res.cloudinary.com/dsn5mkl5l/video/upload/v1782733182/export-1782733018185_xjb85u.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-6 pt-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Find the right college. <span className="text-primary">Read real reviews.</span>
            </h1>
            
            <p className="text-base text-muted-foreground leading-relaxed">
              Explore role-verified reviews from students, teachers, and admins so you can make informed decisions about your education.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" onClick={onGetStarted} className="rounded-full px-8 text-base shadow-lg shadow-primary/20">
                Start Exploring
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={onGetStarted} className="rounded-full px-8 text-base backdrop-blur-sm bg-background/50">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to decide</h2>
            <p className="text-muted-foreground mt-3 text-base">Built for the entire academic community.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-shadow space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Ready to get started?</h2>
          <p className="text-muted-foreground">Join thousands of students and educators sharing real college experiences.</p>
          <Button size="lg" onClick={onGetStarted} className="rounded-full px-10 text-base">
            Create Free Account
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4" />
          <span>Collegrad - College Review Platform</span>
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Reviews</span>
          <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Analytics</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Role-based Access</span>
        </div>
      </footer>

    </div>
  );
}
