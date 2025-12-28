'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  documents: {
    total: number;
    indexed: number;
    limit: number;
  };
  deals: {
    total: number;
    active: number;
    byStage: Record<string, number>;
  };
  conversations: {
    total: number;
  };
  usage: {
    queriesUsed: number;
    queriesLimit: number;
    plan: string;
  };
  recentActivity: {
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Overview of your knowledge base
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const queryUsagePercent = Math.round(
    (stats.usage.queriesUsed / stats.usage.queriesLimit) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Overview of your knowledge base
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/documents">
            <Button>Upload Documents</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - REAL DATA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents.total}</div>
            <p className="text-xs text-slate-500">
              {stats.documents.indexed} indexed / {stats.documents.limit} limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deals.active}</div>
            <p className="text-xs text-slate-500">
              {stats.deals.total} total deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations.total}</div>
            <p className="text-xs text-slate-500">AI chat sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              AI Queries Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.usage.queriesUsed}
              <span className="text-sm font-normal text-slate-500">
                {' '}
                / {stats.usage.queriesLimit}
              </span>
            </div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  queryUsagePercent > 80 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(queryUsagePercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.deals.byStage).length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Object.entries(stats.deals.byStage).map(([stage, count]) => (
                <div
                  key={stage}
                  className="flex-shrink-0 bg-slate-50 rounded-lg p-4 min-w-[120px]"
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-slate-600 capitalize">
                    {stage.toLowerCase().replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No deals yet</p>
              <Link href="/dashboard/deals">
                <Button variant="outline" size="sm" className="mt-2">
                  Add Your First Deal
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/search">
            <CardContent className="pt-6">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-semibold">Search Knowledge Base</h3>
              <p className="text-sm text-slate-600 mt-1">
                Find information across all your documents using semantic search
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/chat">
            <CardContent className="pt-6">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold">Ask AI Questions</h3>
              <p className="text-sm text-slate-600 mt-1">
                Chat with your knowledge base and get cited answers
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/documents">
            <CardContent className="pt-6">
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-semibold">Upload Documents</h3>
              <p className="text-sm text-slate-600 mt-1">
                Add pitch decks, deal memos, and research to your knowledge base
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {activity.action === 'uploaded'
                        ? '📄'
                        : activity.action === 'searched'
                        ? '🔍'
                        : activity.action === 'chatted'
                        ? '💬'
                        : '📝'}
                    </span>
                    <span className="text-sm capitalize">
                      {activity.action} {activity.entity_type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
