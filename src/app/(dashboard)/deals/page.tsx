'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Building2,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

// Deal stages configuration
const stages = [
  { id: 'SOURCED', name: 'Sourced', color: 'bg-slate-100 text-slate-700' },
  { id: 'INITIAL_REVIEW', name: 'Initial Review', color: 'bg-blue-100 text-blue-700' },
  { id: 'FIRST_MEETING', name: 'First Meeting', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'DEEP_DIVE', name: 'Deep Dive', color: 'bg-purple-100 text-purple-700' },
  { id: 'DUE_DILIGENCE', name: 'Due Diligence', color: 'bg-orange-100 text-orange-700' },
  { id: 'TERM_SHEET', name: 'Term Sheet', color: 'bg-amber-100 text-amber-700' },
  { id: 'LEGAL', name: 'Legal', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'CLOSED', name: 'Closed', color: 'bg-green-100 text-green-700' },
];

// Mock deals data
const dealsData = [
  {
    id: '1',
    name: 'TechStart Inc',
    stage: 'DUE_DILIGENCE',
    company: 'TechStart Inc',
    sector: 'AI/ML',
    askAmount: 5000000,
    valuation: 25000000,
    source: 'Referral',
    leadPartner: { name: 'Sarah Chen', avatar: null },
    updatedAt: '2024-12-27T10:00:00Z',
    aiScore: 8.5,
    description: 'B2B AI platform for enterprise automation',
  },
  {
    id: '2',
    name: 'GreenEnergy Co',
    stage: 'TERM_SHEET',
    company: 'GreenEnergy Co',
    sector: 'CleanTech',
    askAmount: 12000000,
    valuation: 60000000,
    source: 'Conference',
    leadPartner: { name: 'Michael Park', avatar: null },
    updatedAt: '2024-12-26T15:00:00Z',
    aiScore: 7.8,
    description: 'Renewable energy storage solutions',
  },
  {
    id: '3',
    name: 'HealthFlow',
    stage: 'FIRST_MEETING',
    company: 'HealthFlow',
    sector: 'HealthTech',
    askAmount: 3000000,
    valuation: 15000000,
    source: 'Inbound',
    leadPartner: { name: 'Emily Wang', avatar: null },
    updatedAt: '2024-12-25T09:00:00Z',
    aiScore: 7.2,
    description: 'Patient engagement platform',
  },
  {
    id: '4',
    name: 'DataSync Pro',
    stage: 'DEEP_DIVE',
    company: 'DataSync Pro',
    sector: 'Enterprise SaaS',
    askAmount: 8000000,
    valuation: 40000000,
    source: 'Portfolio',
    leadPartner: { name: 'James Liu', avatar: null },
    updatedAt: '2024-12-24T14:00:00Z',
    aiScore: 8.1,
    description: 'Real-time data synchronization platform',
  },
  {
    id: '5',
    name: 'FinSecure',
    stage: 'INITIAL_REVIEW',
    company: 'FinSecure',
    sector: 'FinTech',
    askAmount: 4000000,
    valuation: 20000000,
    source: 'Outbound',
    leadPartner: { name: 'Sarah Chen', avatar: null },
    updatedAt: '2024-12-24T11:00:00Z',
    aiScore: 6.9,
    description: 'Fraud detection for financial institutions',
  },
  {
    id: '6',
    name: 'EduTech Labs',
    stage: 'SOURCED',
    company: 'EduTech Labs',
    sector: 'EdTech',
    askAmount: 2500000,
    valuation: 12000000,
    source: 'Referral',
    leadPartner: { name: 'Michael Park', avatar: null },
    updatedAt: '2024-12-23T16:00:00Z',
    aiScore: 7.5,
    description: 'AI-powered tutoring platform',
  },
];

function formatCurrency(amount: number) {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStageColor(stageId: string) {
  const stage = stages.find(s => s.id === stageId);
  return stage?.color || 'bg-gray-100 text-gray-700';
}

function getStageName(stageId: string) {
  const stage = stages.find(s => s.id === stageId);
  return stage?.name || stageId;
}

export default function DealsPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');

  const filteredDeals = dealsData.filter((deal) => {
    const matchesSearch = deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.sector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(deal => deal.stage === stage.id);
    return acc;
  }, {} as Record<string, typeof dealsData>);

  // Pipeline stats
  const pipelineValue = filteredDeals.reduce((sum, deal) => sum + deal.askAmount, 0);
  const activeDeals = filteredDeals.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deal Flow</h1>
          <p className="text-muted-foreground">
            Track and manage your investment pipeline
          </p>
        </div>
        <Button asChild>
          <Link href="/deals/new">
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeDeals}</p>
                <p className="text-sm text-muted-foreground">Active Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(pipelineValue)}</p>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Due Diligence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Closing This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedStage} onValueChange={setSelectedStage}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' ? (
        <ScrollArea className="pb-4">
          <div className="flex gap-4 min-w-max">
            {stages.slice(0, -1).map((stage) => (
              <div key={stage.id} className="w-[300px] flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stage.name}</span>
                    <Badge variant="secondary" className="h-5 px-1.5">
                      {dealsByStage[stage.id]?.length || 0}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {dealsByStage[stage.id]?.map((deal) => (
                    <Link key={deal.id} href={`/deals/${deal.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium">{deal.name}</h3>
                              <p className="text-sm text-muted-foreground">{deal.sector}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-primary">
                                {deal.aiScore.toFixed(1)}
                              </span>
                              <TrendingUp className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {deal.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {formatCurrency(deal.askAmount)}
                            </span>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={deal.leadPartner.avatar || ''} />
                              <AvatarFallback className="text-xs">
                                {deal.leadPartner.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {(!dealsByStage[stage.id] || dealsByStage[stage.id].length === 0) && (
                    <div className="rounded-lg border-2 border-dashed p-4 text-center text-sm text-muted-foreground">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        // List View
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredDeals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                    {deal.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{deal.name}</p>
                      <Badge className={getStageColor(deal.stage)}>
                        {getStageName(deal.stage)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {deal.description}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ask</p>
                      <p className="font-medium">{formatCurrency(deal.askAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sector</p>
                      <p className="font-medium">{deal.sector}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">AI Score</p>
                      <p className="font-medium text-primary">{deal.aiScore.toFixed(1)}</p>
                    </div>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={deal.leadPartner.avatar || ''} />
                    <AvatarFallback className="text-xs">
                      {deal.leadPartner.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Ask AI</DropdownMenuItem>
                      <DropdownMenuItem>Add Documents</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Move Stage</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Pass</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
