'use client';

import {
  BarChart3,
  TrendingUp,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Target,
  Clock,
  Briefcase,
  FileText,
  MessageSquare,
  Users,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data for charts
const pipelineByStage = [
  { stage: 'Sourced', count: 45, value: 125000000 },
  { stage: 'Initial Review', count: 23, value: 68000000 },
  { stage: 'First Meeting', count: 12, value: 42000000 },
  { stage: 'Deep Dive', count: 8, value: 35000000 },
  { stage: 'Due Diligence', count: 5, value: 28000000 },
  { stage: 'Term Sheet', count: 3, value: 18000000 },
  { stage: 'Legal', count: 2, value: 12000000 },
];

const sectorDistribution = [
  { sector: 'AI/ML', deals: 15, value: 45000000, color: 'bg-blue-500' },
  { sector: 'Enterprise SaaS', deals: 12, value: 38000000, color: 'bg-purple-500' },
  { sector: 'FinTech', deals: 10, value: 32000000, color: 'bg-green-500' },
  { sector: 'HealthTech', deals: 8, value: 28000000, color: 'bg-red-500' },
  { sector: 'CleanTech', deals: 6, value: 22000000, color: 'bg-amber-500' },
  { sector: 'Other', deals: 4, value: 15000000, color: 'bg-slate-500' },
];

const monthlyActivity = [
  { month: 'Jul', deals: 8, docs: 45, queries: 234 },
  { month: 'Aug', deals: 12, docs: 62, queries: 312 },
  { month: 'Sep', deals: 10, docs: 58, queries: 287 },
  { month: 'Oct', deals: 15, docs: 78, queries: 356 },
  { month: 'Nov', deals: 18, docs: 92, queries: 412 },
  { month: 'Dec', deals: 14, docs: 68, queries: 389 },
];

const topPerformingDeals = [
  { name: 'TechStart Inc', stage: 'Due Diligence', score: 8.5, change: '+0.3' },
  { name: 'DataSync Pro', stage: 'Deep Dive', score: 8.1, change: '+0.5' },
  { name: 'GreenEnergy Co', stage: 'Term Sheet', score: 7.8, change: '+0.2' },
  { name: 'EduTech Labs', stage: 'First Meeting', score: 7.5, change: '-0.1' },
  { name: 'HealthFlow', stage: 'Initial Review', score: 7.2, change: '+0.4' },
];

function formatCurrency(amount: number, compact: boolean = false) {
  if (compact) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

const totalPipelineValue = pipelineByStage.reduce((sum, s) => sum + s.value, 0);
const totalDeals = pipelineByStage.reduce((sum, s) => sum + s.count, 0);

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and trends from your deal flow and portfolio
          </p>
        </div>
        <Select defaultValue="6m">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Last Month</SelectItem>
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPipelineValue, true)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{totalDeals}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">+8</span>
              <span className="text-muted-foreground">new this month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">24.5%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">+2.1%</span>
              <span className="text-muted-foreground">vs last quarter</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Close Time</p>
                <p className="text-2xl font-bold">45 days</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <ArrowDownRight className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">-5 days</span>
              <span className="text-muted-foreground">vs avg</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>Deal distribution across pipeline stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineByStage.map((stage, index) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stage.stage}</span>
                      <Badge variant="secondary">{stage.count}</Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {formatCurrency(stage.value, true)}
                    </span>
                  </div>
                  <Progress
                    value={(stage.count / pipelineByStage[0].count) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sector Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sector Distribution</CardTitle>
            <CardDescription>Deals by industry sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectorDistribution.map((sector) => (
                <div key={sector.sector} className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${sector.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{sector.sector}</span>
                      <span className="text-muted-foreground">
                        {sector.deals} deals
                      </span>
                    </div>
                    <Progress
                      value={(sector.deals / sectorDistribution[0].deals) * 100}
                      className="h-1.5 mt-1"
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(sector.value, true)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Performance */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
            <CardDescription>Deals, documents, and AI queries over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center border-b pb-4">
                <div>
                  <Briefcase className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Avg Deals</p>
                  <p className="text-lg font-bold">13/mo</p>
                </div>
                <div>
                  <FileText className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                  <p className="text-sm text-muted-foreground">Avg Docs</p>
                  <p className="text-lg font-bold">67/mo</p>
                </div>
                <div>
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-sm text-muted-foreground">Avg Queries</p>
                  <p className="text-lg font-bold">332/mo</p>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {monthlyActivity.map((month) => (
                  <div key={month.month} className="text-center">
                    <div className="space-y-1 mb-2">
                      <div
                        className="bg-blue-500 rounded-sm mx-auto"
                        style={{ height: `${month.deals * 4}px`, width: '12px' }}
                      />
                      <div
                        className="bg-purple-500 rounded-sm mx-auto"
                        style={{ height: `${month.docs * 0.8}px`, width: '12px' }}
                      />
                      <div
                        className="bg-green-500 rounded-sm mx-auto"
                        style={{ height: `${month.queries * 0.15}px`, width: '12px' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{month.month}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Deals */}
        <Card>
          <CardHeader>
            <CardTitle>Top Deals by AI Score</CardTitle>
            <CardDescription>Highest rated opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingDeals.map((deal, index) => (
                <div key={deal.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{deal.name}</p>
                    <p className="text-xs text-muted-foreground">{deal.stage}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{deal.score}</p>
                    <p className={`text-xs ${deal.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {deal.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>AI Knowledge Base Usage</CardTitle>
          <CardDescription>How your team is leveraging AlphaIntel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Queries</span>
              </div>
              <p className="text-2xl font-bold">12,847</p>
              <p className="text-xs text-green-600">+234 this week</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Documents Indexed</span>
              </div>
              <p className="text-2xl font-bold">2,847</p>
              <p className="text-xs text-green-600">+45 this week</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active Users</span>
              </div>
              <p className="text-2xl font-bold">18</p>
              <p className="text-xs text-muted-foreground">of 25 seats</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Answer Accuracy</span>
              </div>
              <p className="text-2xl font-bold">94.2%</p>
              <p className="text-xs text-green-600">+1.3% this month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
