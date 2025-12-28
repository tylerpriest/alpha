'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ExternalLink,
  MoreVertical,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock portfolio data
const portfolioCompanies = [
  {
    id: '1',
    name: 'CloudFlow AI',
    sector: 'AI/ML',
    status: 'active',
    investedDate: '2022-03-15',
    initialInvestment: 5000000,
    currentValue: 18500000,
    moic: 3.7,
    irr: 85.2,
    ownership: 15.5,
    fund: 'Fund III',
    lastMetrics: {
      arr: 8500000,
      growth: 125,
      employees: 65,
      runway: 24,
    },
    boardSeat: true,
  },
  {
    id: '2',
    name: 'SecureData Corp',
    sector: 'Cybersecurity',
    status: 'active',
    investedDate: '2021-08-22',
    initialInvestment: 8000000,
    currentValue: 22000000,
    moic: 2.75,
    irr: 45.3,
    ownership: 12.3,
    fund: 'Fund II',
    lastMetrics: {
      arr: 15000000,
      growth: 80,
      employees: 120,
      runway: 18,
    },
    boardSeat: true,
  },
  {
    id: '3',
    name: 'GreenLogistics',
    sector: 'CleanTech',
    status: 'active',
    investedDate: '2023-01-10',
    initialInvestment: 3000000,
    currentValue: 4500000,
    moic: 1.5,
    irr: 32.1,
    ownership: 8.7,
    fund: 'Fund III',
    lastMetrics: {
      arr: 2500000,
      growth: 200,
      employees: 35,
      runway: 15,
    },
    boardSeat: false,
  },
  {
    id: '4',
    name: 'HealthSync',
    sector: 'HealthTech',
    status: 'active',
    investedDate: '2022-11-05',
    initialInvestment: 6000000,
    currentValue: 12000000,
    moic: 2.0,
    irr: 55.8,
    ownership: 10.2,
    fund: 'Fund III',
    lastMetrics: {
      arr: 5500000,
      growth: 95,
      employees: 48,
      runway: 20,
    },
    boardSeat: true,
  },
  {
    id: '5',
    name: 'DataMesh',
    sector: 'Enterprise SaaS',
    status: 'exited',
    investedDate: '2019-06-20',
    initialInvestment: 4000000,
    currentValue: 24000000,
    moic: 6.0,
    irr: 92.4,
    ownership: 0,
    fund: 'Fund I',
    lastMetrics: {
      arr: 0,
      growth: 0,
      employees: 0,
      runway: 0,
    },
    boardSeat: false,
    exitDate: '2024-03-15',
    exitType: 'Acquisition',
  },
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export default function PortfolioPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fundFilter, setFundFilter] = useState('all');

  const filteredCompanies = portfolioCompanies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.sector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    const matchesFund = fundFilter === 'all' || company.fund === fundFilter;
    return matchesSearch && matchesStatus && matchesFund;
  });

  const activeCompanies = portfolioCompanies.filter(c => c.status === 'active');
  const totalInvested = activeCompanies.reduce((sum, c) => sum + c.initialInvestment, 0);
  const totalValue = activeCompanies.reduce((sum, c) => sum + c.currentValue, 0);
  const avgMoic = activeCompanies.reduce((sum, c) => sum + c.moic, 0) / activeCompanies.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">
            Track and manage your portfolio companies
          </p>
        </div>
        <Button asChild>
          <Link href="/portfolio/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
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
                <p className="text-2xl font-bold">{activeCompanies.length}</p>
                <p className="text-sm text-muted-foreground">Active Companies</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalValue, true)}</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
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
                <p className="text-2xl font-bold">{avgMoic.toFixed(2)}x</p>
                <p className="text-sm text-muted-foreground">Avg MOIC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalInvested, true)}</p>
                <p className="text-sm text-muted-foreground">Invested</p>
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
            placeholder="Search companies..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="exited">Exited</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fundFilter} onValueChange={setFundFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Fund" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funds</SelectItem>
            <SelectItem value="Fund I">Fund I</SelectItem>
            <SelectItem value="Fund II">Fund II</SelectItem>
            <SelectItem value="Fund III">Fund III</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Portfolio Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-lg">
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">{company.sector}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Update Metrics</DropdownMenuItem>
                    <DropdownMenuItem>Ask AI</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Website
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={company.status === 'active' ? 'success' : 'secondary'}>
                    {company.status === 'active' ? 'Active' : 'Exited'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{company.fund}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">MOIC</p>
                    <p className="text-lg font-bold text-primary">{company.moic.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IRR</p>
                    <p className="text-lg font-bold">{company.irr.toFixed(1)}%</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Value Growth</span>
                    <span className="font-medium">
                      {formatCurrency(company.currentValue, true)}
                    </span>
                  </div>
                  <Progress value={(company.currentValue / company.initialInvestment) * 20} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Invested: {formatCurrency(company.initialInvestment, true)}
                  </p>
                </div>

                {company.status === 'active' && company.lastMetrics.arr > 0 && (
                  <div className="pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">ARR</p>
                        <p className="font-medium">{formatCurrency(company.lastMetrics.arr, true)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Growth</p>
                        <p className="font-medium text-green-600">+{company.lastMetrics.growth}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Employees</p>
                        <p className="font-medium">{company.lastMetrics.employees}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Runway</p>
                        <p className="font-medium">{company.lastMetrics.runway} mo</p>
                      </div>
                    </div>
                  </div>
                )}

                {company.status === 'exited' && (
                  <div className="pt-3 border-t text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exit</span>
                      <span>{company.exitType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>{formatDate(company.exitDate!)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(company.investedDate)}
                  </div>
                  {company.boardSeat && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      Board
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
