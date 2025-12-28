'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Deal, DealStage } from '@/types/database';

const stageLabels: Record<DealStage, string> = {
  SOURCED: 'Sourced',
  SCREENING: 'Screening',
  FIRST_MEETING: 'First Meeting',
  DD: 'Due Diligence',
  IC: 'Investment Committee',
  TERM_SHEET: 'Term Sheet',
  CLOSED_WON: 'Closed Won',
  PASSED: 'Passed',
};

const stageColors: Record<DealStage, string> = {
  SOURCED: 'bg-gray-100 text-gray-800',
  SCREENING: 'bg-yellow-100 text-yellow-800',
  FIRST_MEETING: 'bg-blue-100 text-blue-800',
  DD: 'bg-purple-100 text-purple-800',
  IC: 'bg-orange-100 text-orange-800',
  TERM_SHEET: 'bg-pink-100 text-pink-800',
  CLOSED_WON: 'bg-green-100 text-green-800',
  PASSED: 'bg-red-100 text-red-800',
};

const stages: DealStage[] = [
  'SOURCED',
  'SCREENING',
  'FIRST_MEETING',
  'DD',
  'IC',
  'TERM_SHEET',
  'CLOSED_WON',
  'PASSED',
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    companyName: '',
    website: '',
    description: '',
    sector: '',
    currentStage: 'SOURCED' as DealStage,
    askAmount: '',
    valuation: '',
    source: '',
  });

  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch('/api/deals');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setDeals(data.deals);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDeal,
          askAmount: newDeal.askAmount
            ? parseFloat(newDeal.askAmount)
            : undefined,
          valuation: newDeal.valuation
            ? parseFloat(newDeal.valuation)
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to create deal');
        return;
      }

      setDialogOpen(false);
      setNewDeal({
        companyName: '',
        website: '',
        description: '',
        sector: '',
        currentStage: 'SOURCED',
        askAmount: '',
        valuation: '',
        source: '',
      });
      fetchDeals();
    } catch (err) {
      console.error('Create error:', err);
      alert('Failed to create deal');
    }
  };

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStage: newStage }),
      });

      if (!res.ok) {
        alert('Failed to update stage');
        return;
      }

      fetchDeals();
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update stage');
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Group deals by stage for kanban view
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage] = deals.filter((d) => d.current_stage === stage);
    return acc;
  }, {} as Record<DealStage, Deal[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deal Flow</h1>
          <p className="text-slate-600 mt-1">Manage your investment pipeline</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Deal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={newDeal.companyName}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, companyName: e.target.value })
                  }
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={newDeal.website}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={newDeal.sector}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, sector: e.target.value })
                  }
                  placeholder="SaaS, Fintech, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="askAmount">Ask ($)</Label>
                  <Input
                    id="askAmount"
                    type="number"
                    value={newDeal.askAmount}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, askAmount: e.target.value })
                    }
                    placeholder="5000000"
                  />
                </div>
                <div>
                  <Label htmlFor="valuation">Valuation ($)</Label>
                  <Input
                    id="valuation"
                    type="number"
                    value={newDeal.valuation}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, valuation: e.target.value })
                    }
                    placeholder="20000000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={newDeal.source}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, source: e.target.value })
                  }
                  placeholder="Referral, Inbound, etc."
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDeal.description}
                  onChange={(e) =>
                    setNewDeal({ ...newDeal, description: e.target.value })
                  }
                  placeholder="Brief description of the company..."
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newDeal.companyName}
                className="w-full"
              >
                Create Deal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-72">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {stageLabels[stage]}
                    </CardTitle>
                    <Badge variant="secondary">
                      {dealsByStage[stage].length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 min-h-[200px]">
                  {dealsByStage[stage].length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No deals
                    </p>
                  ) : (
                    dealsByStage[stage].map((deal) => (
                      <Card
                        key={deal.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-3">
                          <div className="font-medium text-sm">
                            {deal.company_name}
                          </div>
                          {deal.sector && (
                            <div className="text-xs text-slate-500 mt-1">
                              {deal.sector}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {deal.ask_amount && (
                              <Badge variant="outline" className="text-xs">
                                Ask: {formatCurrency(deal.ask_amount)}
                              </Badge>
                            )}
                          </div>
                          {deal.ai_score !== null && (
                            <div className="mt-2">
                              <Badge
                                className={
                                  deal.ai_score >= 7
                                    ? 'bg-green-100 text-green-800'
                                    : deal.ai_score >= 5
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                AI Score: {deal.ai_score.toFixed(1)}/10
                              </Badge>
                            </div>
                          )}
                          <Select
                            value={deal.current_stage}
                            onValueChange={(v) =>
                              handleStageChange(deal.id, v as DealStage)
                            }
                          >
                            <SelectTrigger className="mt-2 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {stageLabels[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
