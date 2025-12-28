import Link from 'next/link';
import {
  Brain,
  Shield,
  Zap,
  Database,
  LineChart,
  FileSearch,
  Users,
  Lock,
  ArrowRight,
  CheckCircle2,
  Building2,
  TrendingUp,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Brain,
    title: 'Institutional Memory',
    description: 'AI that learns your investment thesis, past decisions, and why you passed on deals. Knowledge compounds, people leave - your wisdom stays.',
  },
  {
    icon: Zap,
    title: 'Due Diligence Acceleration',
    description: 'Query years of research, competitor analysis, and market data instantly. What took weeks now takes hours.',
  },
  {
    icon: LineChart,
    title: 'Pattern Recognition',
    description: 'AI identifies successful investment patterns across your portfolio history. Learn what actually works from your own data.',
  },
  {
    icon: FileSearch,
    title: 'Semantic Search',
    description: 'Find information by meaning, not just keywords. Ask "companies with similar unit economics to our best exit" and get answers.',
  },
  {
    icon: Shield,
    title: 'Compliance-Ready',
    description: 'Full audit trail of every query, access, and decision. Built for regulated financial services from day one.',
  },
  {
    icon: Database,
    title: 'Deal Intelligence',
    description: 'AI-powered deal scoring, thesis matching, and portfolio pattern analysis. Surface the signals that matter.',
  },
];

const useCases = [
  {
    icon: Building2,
    title: 'Venture Capital',
    items: [
      'Instant access to decades of deal memos',
      'Pattern match against successful exits',
      'New analyst onboarding in days, not months',
      'Never forget why you passed on a deal',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Private Equity',
    items: [
      'Portfolio company operational playbooks',
      'Market intelligence synthesis',
      'LP reporting automation',
      'Value creation pattern analysis',
    ],
  },
  {
    icon: Briefcase,
    title: 'Growth Equity',
    items: [
      'Sector thesis development',
      'Competitive landscape mapping',
      'Deal team knowledge sharing',
      'Investment committee preparation',
    ],
  },
];

const metrics = [
  { value: '90%', label: 'Faster due diligence' },
  { value: '10x', label: 'Faster deal memo search' },
  { value: '100%', label: 'Knowledge retained when people leave' },
  { value: '0', label: 'Duplicated research' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AlphaIntel</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#use-cases" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Use Cases
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
              <span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">New</span>
              AI-powered knowledge base for investment professionals
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Your firm's institutional memory,{' '}
              <span className="gradient-text">powered by AI</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              AlphaIntel transforms decades of deal memos, research, and tribal knowledge
              into an AI assistant that understands your investment thesis. Knowledge compounds.
              People leave. Your wisdom stays.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="xl" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </section>

        {/* Metrics */}
        <section className="border-y bg-muted/30">
          <div className="container py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {metrics.map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{metric.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container py-24">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Built for investment professionals
            </h2>
            <p className="text-lg text-muted-foreground">
              Purpose-built for VC, PE, and growth equity workflows. Not another generic enterprise tool.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Use Cases */}
        <section id="use-cases" className="bg-muted/30 py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Designed for your workflow
              </h2>
              <p className="text-lg text-muted-foreground">
                Whether you're sourcing deals, conducting due diligence, or managing portfolio companies.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {useCases.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <Card key={useCase.title} className="bg-background">
                    <CardContent className="p-6">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mb-4 text-xl font-semibold">{useCase.title}</h3>
                      <ul className="space-y-3">
                        {useCase.items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="container py-24">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border bg-card p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Enterprise-Grade Security</h2>
                  <p className="text-muted-foreground">
                    Your data never leaves your control. SOC 2 Type II compliant with full encryption at rest and in transit.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium mb-1">Data Isolation</h4>
                  <p className="text-sm text-muted-foreground">Complete multi-tenant isolation with dedicated encryption keys</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium mb-1">Audit Logging</h4>
                  <p className="text-sm text-muted-foreground">Every query and access logged for compliance</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium mb-1">Role-Based Access</h4>
                  <p className="text-sm text-muted-foreground">Granular permissions from Partner to Analyst</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-primary-foreground py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to build your firm's institutional memory?
              </h2>
              <p className="mb-8 text-lg opacity-90">
                Join leading VC and PE firms using AlphaIntel to preserve and leverage their collective knowledge.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="xl" variant="secondary">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="xl" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AlphaIntel</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                AI-powered knowledge base for investment professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
                <li><Link href="/integrations" className="hover:text-foreground">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} AlphaIntel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
