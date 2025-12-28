'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
  pageNumber?: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Search failed');
        return;
      }

      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      console.error('Search error:', err);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Semantic Search</h1>
        <p className="text-slate-600 mt-1">
          Search your knowledge base by meaning, not just keywords
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              placeholder="Search for anything... e.g., 'deals similar to Stripe' or 'companies with 100%+ NRR'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {results.length > 0
              ? `Found ${results.length} results`
              : 'No results found'}
          </h2>

          {results.map((result) => (
            <Card key={result.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {result.documentTitle}
                  </CardTitle>
                  <Badge variant="secondary">
                    {Math.round(result.similarity * 100)}% match
                  </Badge>
                </div>
                {result.pageNumber && (
                  <p className="text-sm text-slate-500">
                    Page {result.pageNumber}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {result.content}
                </p>
              </CardContent>
            </Card>
          ))}

          {results.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                <p>No documents match your search.</p>
                <p className="text-sm mt-1">
                  Try different keywords or upload more documents.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Example Queries */}
      {!searched && (
        <Card>
          <CardHeader>
            <CardTitle>Example Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button
                onClick={() => setQuery('deals similar to Stripe')}
                className="block text-left text-blue-600 hover:underline text-sm"
              >
                &quot;deals similar to Stripe&quot;
              </button>
              <button
                onClick={() => setQuery('companies with strong NRR')}
                className="block text-left text-blue-600 hover:underline text-sm"
              >
                &quot;companies with strong NRR&quot;
              </button>
              <button
                onClick={() => setQuery('fintech investment thesis')}
                className="block text-left text-blue-600 hover:underline text-sm"
              >
                &quot;fintech investment thesis&quot;
              </button>
              <button
                onClick={() => setQuery('why did we pass on')}
                className="block text-left text-blue-600 hover:underline text-sm"
              >
                &quot;why did we pass on...&quot;
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
