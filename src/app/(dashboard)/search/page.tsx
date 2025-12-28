'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  FileText,
  Briefcase,
  Building2,
  MessageSquare,
  Filter,
  Calendar,
  User,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock search results
const mockResults = {
  documents: [
    {
      id: '1',
      title: 'Q4 2024 Market Analysis',
      type: 'Research Report',
      excerpt: '...enterprise software valuations have stabilized at 8-12x ARR for growth-stage companies, with particular strength in AI-enabled solutions...',
      relevance: 0.95,
      date: '2024-12-27',
      author: 'Sarah Chen',
    },
    {
      id: '2',
      title: 'TechStart Investment Memo',
      type: 'Memo',
      excerpt: '...strong product-market fit evidenced by 180% NRR and rapid enterprise customer expansion. Key risk factors include competitive landscape...',
      relevance: 0.89,
      date: '2024-12-26',
      author: 'Michael Park',
    },
    {
      id: '3',
      title: 'SaaS Metrics Benchmark 2024',
      type: 'Research Report',
      excerpt: '...top quartile SaaS companies achieve >120% NRR with CAC payback under 12 months. Median growth rates for Series B companies...',
      relevance: 0.84,
      date: '2024-12-25',
      author: 'Emily Wang',
    },
  ],
  deals: [
    {
      id: '1',
      name: 'TechStart Inc',
      stage: 'Due Diligence',
      sector: 'AI/ML',
      excerpt: 'B2B AI platform for enterprise automation with strong growth metrics',
      relevance: 0.92,
    },
    {
      id: '2',
      name: 'DataSync Pro',
      stage: 'Deep Dive',
      sector: 'Enterprise SaaS',
      excerpt: 'Real-time data synchronization platform for enterprise customers',
      relevance: 0.78,
    },
  ],
  portfolio: [
    {
      id: '1',
      name: 'CloudFlow AI',
      sector: 'AI/ML',
      excerpt: 'Portfolio company with 125% ARR growth and strong unit economics',
      relevance: 0.88,
    },
  ],
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof mockResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSearchResults(mockResults);
    setIsSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalResults = searchResults
    ? searchResults.documents.length + searchResults.deals.length + searchResults.portfolio.length
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Search across your entire knowledge base
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search documents, deals, portfolio companies..."
          className="h-14 pl-12 pr-24 text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Quick Actions */}
      {!searchResults && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => setQuery('SaaS metrics')}>
            SaaS metrics
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuery('AI investments')}>
            AI investments
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuery('due diligence checklist')}>
            due diligence checklist
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuery('portfolio performance')}>
            portfolio performance
          </Button>
        </div>
      )}

      {/* AI Suggestion */}
      {searchResults && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">AI suggestion:</span> Would you like me to analyze these results
                  and provide insights? I can summarize key themes, identify patterns, or answer specific questions.
                </p>
              </div>
              <Link href={`/chat?q=${encodeURIComponent(query)}`}>
                <Button size="sm">Ask AI</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searchResults && (
        <div className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">
                  All ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="documents">
                  Documents ({searchResults.documents.length})
                </TabsTrigger>
                <TabsTrigger value="deals">
                  Deals ({searchResults.deals.length})
                </TabsTrigger>
                <TabsTrigger value="portfolio">
                  Portfolio ({searchResults.portfolio.length})
                </TabsTrigger>
              </TabsList>
              <Select defaultValue="relevance">
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* All Results */}
            <TabsContent value="all" className="space-y-4 mt-6">
              {searchResults.documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </h3>
                  {searchResults.documents.map((doc) => (
                    <Link key={doc.id} href={`/knowledge/${doc.id}`}>
                      <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{doc.title}</h4>
                                <Badge variant="secondary">{doc.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {doc.excerpt}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {doc.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {doc.author}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {Math.round(doc.relevance * 100)}% match
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.deals.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Deals
                  </h3>
                  {searchResults.deals.map((deal) => (
                    <Link key={deal.id} href={`/deals/${deal.id}`}>
                      <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{deal.name}</h4>
                                <Badge variant="secondary">{deal.stage}</Badge>
                                <Badge variant="outline">{deal.sector}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {deal.excerpt}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {Math.round(deal.relevance * 100)}% match
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.portfolio.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Portfolio Companies
                  </h3>
                  {searchResults.portfolio.map((company) => (
                    <Link key={company.id} href={`/portfolio/${company.id}`}>
                      <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{company.name}</h4>
                                <Badge variant="outline">{company.sector}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {company.excerpt}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {Math.round(company.relevance * 100)}% match
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-3 mt-6">
              {searchResults.documents.map((doc) => (
                <Link key={doc.id} href={`/knowledge/${doc.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{doc.title}</h4>
                            <Badge variant="secondary">{doc.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {doc.excerpt}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{doc.date}</span>
                            <span>{doc.author}</span>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {Math.round(doc.relevance * 100)}% match
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </TabsContent>

            {/* Deals Tab */}
            <TabsContent value="deals" className="space-y-3 mt-6">
              {searchResults.deals.map((deal) => (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{deal.name}</h4>
                            <Badge variant="secondary">{deal.stage}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{deal.excerpt}</p>
                        </div>
                        <Badge variant="outline">
                          {Math.round(deal.relevance * 100)}% match
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-3 mt-6">
              {searchResults.portfolio.map((company) => (
                <Link key={company.id} href={`/portfolio/${company.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{company.name}</h4>
                            <Badge variant="outline">{company.sector}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{company.excerpt}</p>
                        </div>
                        <Badge variant="outline">
                          {Math.round(company.relevance * 100)}% match
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
