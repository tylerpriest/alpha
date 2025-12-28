import Link from 'next/link';
import {
  FileText,
  Briefcase,
  Building2,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Upload,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const stats = [
  {
    name: 'Documents',
    value: '2,847',
    change: '+12%',
    trend: 'up',
    icon: FileText,
    href: '/knowledge',
  },
  {
    name: 'Active Deals',
    value: '23',
    change: '+3',
    trend: 'up',
    icon: Briefcase,
    href: '/deals',
  },
  {
    name: 'Portfolio Companies',
    value: '18',
    change: '+2',
    trend: 'up',
    icon: Building2,
    href: '/portfolio',
  },
  {
    name: 'AI Queries Today',
    value: '156',
    change: '+45%',
    trend: 'up',
    icon: MessageSquare,
    href: '/chat',
  },
];

const recentDeals = [
  {
    id: '1',
    name: 'TechStart Inc',
    stage: 'Due Diligence',
    stageColor: 'bg-orange-100 text-orange-700',
    amount: '$5M',
    sector: 'AI/ML',
    updated: '2 hours ago',
  },
  {
    id: '2',
    name: 'GreenEnergy Co',
    stage: 'Term Sheet',
    stageColor: 'bg-amber-100 text-amber-700',
    amount: '$12M',
    sector: 'CleanTech',
    updated: '5 hours ago',
  },
  {
    id: '3',
    name: 'HealthFlow',
    stage: 'First Meeting',
    stageColor: 'bg-indigo-100 text-indigo-700',
    amount: '$3M',
    sector: 'HealthTech',
    updated: 'Yesterday',
  },
  {
    id: '4',
    name: 'DataSync Pro',
    stage: 'Deep Dive',
    stageColor: 'bg-purple-100 text-purple-700',
    amount: '$8M',
    sector: 'Enterprise SaaS',
    updated: 'Yesterday',
  },
];

const recentDocuments = [
  {
    id: '1',
    name: 'Q4 2024 Market Analysis.pdf',
    type: 'Research Report',
    uploadedBy: 'Sarah Chen',
    date: '2 hours ago',
  },
  {
    id: '2',
    name: 'TechStart - Financial Model.xlsx',
    type: 'Financial Model',
    uploadedBy: 'Michael Park',
    date: '4 hours ago',
  },
  {
    id: '3',
    name: 'AI Sector Deep Dive.pdf',
    type: 'Research Report',
    uploadedBy: 'Emily Wang',
    date: 'Yesterday',
  },
  {
    id: '4',
    name: 'Investment Committee Memo - GreenEnergy.docx',
    type: 'Memo',
    uploadedBy: 'James Liu',
    date: 'Yesterday',
  },
];

const recentActivity = [
  {
    id: '1',
    user: { name: 'Sarah Chen', avatar: null },
    action: 'queried AI about',
    target: 'SaaS unit economics benchmarks',
    time: '5 minutes ago',
  },
  {
    id: '2',
    user: { name: 'Michael Park', avatar: null },
    action: 'uploaded',
    target: 'TechStart Financial Model',
    time: '2 hours ago',
  },
  {
    id: '3',
    user: { name: 'Emily Wang', avatar: null },
    action: 'moved deal to',
    target: 'Due Diligence',
    time: '3 hours ago',
  },
  {
    id: '4',
    user: { name: 'James Liu', avatar: null },
    action: 'added comment on',
    target: 'GreenEnergy investment thesis',
    time: '5 hours ago',
  },
];

const suggestedQueries = [
  'What are the key risks in our current pipeline?',
  'Compare our portfolio to industry benchmarks',
  'Summarize recent AI sector developments',
  'Which deals have similar characteristics to our best exits?',
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at your firm.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/knowledge/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Link>
          </Button>
          <Button asChild>
            <Link href="/deals/new">
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.name}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* AI Quick Query */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold">Ask AlphaIntel</h3>
                <p className="text-sm text-muted-foreground">
                  Query your entire knowledge base using natural language
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((query) => (
                  <Link key={query} href={`/chat?q=${encodeURIComponent(query)}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {query}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
            <Button asChild>
              <Link href="/chat">
                Open Chat
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Deals */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Deals</CardTitle>
              <CardDescription>Your active deal pipeline</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/deals">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                      {deal.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{deal.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{deal.sector}</span>
                        <span>•</span>
                        <span>{deal.amount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={deal.stageColor}>{deal.stage}</Badge>
                    <span className="text-sm text-muted-foreground">{deal.updated}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest team actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.avatar || ''} />
                    <AvatarFallback className="text-xs">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.name}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>{' '}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Latest uploads to your knowledge base</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/knowledge">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentDocuments.map((doc) => (
              <Link
                key={doc.id}
                href={`/knowledge/${doc.id}`}
                className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <p className="font-medium truncate">{doc.name}</p>
                <p className="text-sm text-muted-foreground">{doc.type}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{doc.uploadedBy}</span>
                  <span>•</span>
                  <span>{doc.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Upload Documents</p>
              <p className="text-sm text-muted-foreground">Add to knowledge base</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Log New Deal</p>
              <p className="text-sm text-muted-foreground">Track a new opportunity</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Ask AI</p>
              <p className="text-sm text-muted-foreground">Query your knowledge</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
