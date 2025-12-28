import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-semibold text-xl">AlphaIntel</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            The Institutional Memory
            <br />
            <span className="text-blue-600">for Investment Firms</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Stop losing decades of investment wisdom when partners retire.
            AlphaIntel preserves your firm&apos;s knowledge, makes it instantly
            searchable, and helps new team members get up to speed in days, not
            months.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="text-3xl font-bold text-blue-600">20-30 hrs</div>
            <div className="mt-1 text-sm text-slate-600">
              Saved per deal on DD
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">50%</div>
            <div className="mt-1 text-sm text-slate-600">
              Faster onboarding
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">92%</div>
            <div className="mt-1 text-sm text-slate-600">
              Answer accuracy
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">100%</div>
            <div className="mt-1 text-sm text-slate-600">
              Audit trail coverage
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">
            Built for How VCs and PE Firms Actually Work
          </h2>
          <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
            We researched the top VC/PE tech stacks and built what&apos;s
            missing: the internal knowledge layer.
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  Semantic Search
                </CardTitle>
                <CardDescription>
                  Find by meaning, not just keywords
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Search &quot;deals similar to Stripe&quot; or &quot;companies
                  with 100%+ NRR&quot; and get relevant results from your deal
                  memos, research, and documents.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  AI Chat with Citations
                </CardTitle>
                <CardDescription>
                  Ask questions, get sourced answers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  &quot;Why did we pass on Company X?&quot; Get answers with
                  citations to specific documents and pages. No hallucinations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Deal Flow Management
                </CardTitle>
                <CardDescription>
                  Track pipeline with AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Kanban boards, stage history, pass reason tracking. Plus
                  AI-generated risk analysis and deal scoring based on your
                  documents.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📁</span>
                  Document Intelligence
                </CardTitle>
                <CardDescription>PDF, DOCX, XLSX and more</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Upload pitch decks, deal memos, term sheets, and research.
                  Automatic text extraction and embedding for instant
                  searchability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🔐</span>
                  Enterprise Security
                </CardTitle>
                <CardDescription>
                  Compliance-ready audit trails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Multi-tenant architecture with row-level security.
                  Complete audit logs of who accessed what and when. SOC 2
                  compliant.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  Instant Onboarding
                </CardTitle>
                <CardDescription>
                  New hires productive in days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  &quot;What did we learn from 2008?&quot; &quot;What patterns
                  do our exits share?&quot; Give new team members access to
                  decades of tribal knowledge.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold">The Problem</h2>
              <p className="mt-4 text-lg text-slate-600">
                When a senior partner retires, decades of investment wisdom
                walks out the door. New associates spend 4-6 months learning
                tribal knowledge that exists only in people&apos;s heads.
              </p>
              <p className="mt-4 text-lg text-slate-600">
                Past investment decisions are buried in email threads, forgotten
                folders, and undocumented conversations.
              </p>
              <ul className="mt-6 space-y-2 text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  &quot;Why did we pass on that company in 2019?&quot;
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  &quot;What patterns do our successful exits share?&quot;
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  &quot;How did we analyze similar deals before?&quot;
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold">The Solution</h2>
              <p className="mt-4 text-lg text-slate-600">
                AlphaIntel is the institutional memory layer for investment
                firms. Upload your documents, ask questions in plain English,
                get answers with citations.
              </p>
              <ul className="mt-6 space-y-2 text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Instant recall of any past decision
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Pattern recognition across your portfolio
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  New hires productive in days, not months
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Never lose knowledge when people leave
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-center text-slate-600">
            Start free, scale as you grow
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>For small funds</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$299</span>
                  <span className="text-slate-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>Up to 5 users</li>
                  <li>500 documents</li>
                  <li>500 AI queries/month</li>
                  <li>Semantic search</li>
                  <li>Deal tracking</li>
                  <li>Email support</li>
                </ul>
                <Button className="mt-6 w-full" variant="outline">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-600 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Professional
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                    Popular
                  </span>
                </CardTitle>
                <CardDescription>For growing funds</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$799</span>
                  <span className="text-slate-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>Up to 15 users</li>
                  <li>Unlimited documents</li>
                  <li>2,000 AI queries/month</li>
                  <li>Advanced analytics</li>
                  <li>API access</li>
                  <li>Priority support</li>
                </ul>
                <Button className="mt-6 w-full">Start Free Trial</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>Unlimited users</li>
                  <li>Unlimited documents</li>
                  <li>Unlimited queries</li>
                  <li>SSO/SAML</li>
                  <li>Custom integrations</li>
                  <li>Dedicated support</li>
                </ul>
                <Button className="mt-6 w-full" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">
            Ready to Preserve Your Firm&apos;s Knowledge?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Join leading VC and PE firms who trust AlphaIntel
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="px-12">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold">AlphaIntel</span>
            </div>
            <div className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} AlphaIntel. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
