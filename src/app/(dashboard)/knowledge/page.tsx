'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Download,
  Trash2,
  FolderOpen,
  Tag,
  Clock,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for demo
const documents = [
  {
    id: '1',
    title: 'Q4 2024 Market Analysis',
    type: 'RESEARCH_REPORT',
    status: 'INDEXED',
    fileType: 'PDF',
    size: 2500000,
    uploadedBy: 'Sarah Chen',
    uploadedAt: '2024-12-27T10:30:00Z',
    tags: ['Market Research', 'Q4 2024'],
    summary: 'Comprehensive analysis of market trends in the enterprise software sector...',
  },
  {
    id: '2',
    title: 'TechStart Inc - Investment Memo',
    type: 'MEMO',
    status: 'INDEXED',
    fileType: 'DOCX',
    size: 450000,
    uploadedBy: 'Michael Park',
    uploadedAt: '2024-12-26T15:45:00Z',
    tags: ['Deal Memo', 'AI/ML'],
    summary: 'Investment recommendation for TechStart Inc, a B2B AI platform...',
  },
  {
    id: '3',
    title: 'SaaS Metrics Benchmark 2024',
    type: 'RESEARCH_REPORT',
    status: 'INDEXED',
    fileType: 'PDF',
    size: 3200000,
    uploadedBy: 'Emily Wang',
    uploadedAt: '2024-12-25T09:00:00Z',
    tags: ['Benchmarks', 'SaaS'],
    summary: 'Annual benchmark report covering key SaaS metrics across stages...',
  },
  {
    id: '4',
    title: 'GreenEnergy Co - Financial Model',
    type: 'FINANCIAL_MODEL',
    status: 'INDEXED',
    fileType: 'XLSX',
    size: 1800000,
    uploadedBy: 'James Liu',
    uploadedAt: '2024-12-24T14:20:00Z',
    tags: ['Financial Model', 'CleanTech'],
    summary: '5-year financial projection model with multiple scenarios...',
  },
  {
    id: '5',
    title: 'HealthFlow Pitch Deck',
    type: 'PITCH_DECK',
    status: 'PROCESSING',
    fileType: 'PDF',
    size: 5500000,
    uploadedBy: 'Sarah Chen',
    uploadedAt: '2024-12-24T11:30:00Z',
    tags: ['Pitch Deck', 'HealthTech'],
    summary: 'Series A pitch deck from HealthFlow...',
  },
  {
    id: '6',
    title: 'Portfolio Review - Q3 2024',
    type: 'MEMO',
    status: 'INDEXED',
    fileType: 'PDF',
    size: 980000,
    uploadedBy: 'Michael Park',
    uploadedAt: '2024-12-23T16:00:00Z',
    tags: ['Portfolio', 'Quarterly Review'],
    summary: 'Quarterly portfolio company performance review...',
  },
];

const documentTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'RESEARCH_REPORT', label: 'Research Reports' },
  { value: 'MEMO', label: 'Memos' },
  { value: 'PITCH_DECK', label: 'Pitch Decks' },
  { value: 'FINANCIAL_MODEL', label: 'Financial Models' },
  { value: 'TERM_SHEET', label: 'Term Sheets' },
  { value: 'LEGAL_DOC', label: 'Legal Documents' },
];

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    if (diffHours < 1) return 'Just now';
    return `${Math.floor(diffHours)}h ago`;
  }
  if (diffHours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    RESEARCH_REPORT: 'bg-blue-100 text-blue-700',
    MEMO: 'bg-purple-100 text-purple-700',
    PITCH_DECK: 'bg-green-100 text-green-700',
    FINANCIAL_MODEL: 'bg-amber-100 text-amber-700',
    TERM_SHEET: 'bg-red-100 text-red-700',
    LEGAL_DOC: 'bg-slate-100 text-slate-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    RESEARCH_REPORT: 'Research',
    MEMO: 'Memo',
    PITCH_DECK: 'Pitch Deck',
    FINANCIAL_MODEL: 'Model',
    TERM_SHEET: 'Term Sheet',
    LEGAL_DOC: 'Legal',
  };
  return labels[type] || type;
}

export default function KnowledgePage() {
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            {documents.length} documents indexed and searchable
          </p>
        </div>
        <Button asChild>
          <Link href="/knowledge/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">2,847</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <FolderOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Collections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Tags</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">1.2M</p>
                <p className="text-sm text-muted-foreground">AI Queries</p>
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
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Document type" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Documents */}
      {view === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/knowledge/${doc.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{doc.title}</p>
                      {doc.status === 'PROCESSING' && (
                        <Badge variant="warning">Processing</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {doc.summary}
                    </p>
                  </div>
                  <Badge className={getTypeColor(doc.type)}>
                    {getTypeLabel(doc.type)}
                  </Badge>
                  <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatBytes(doc.size)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(doc.uploadedAt)}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Ask AI
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link href={`/knowledge/${doc.id}`}>
                  <h3 className="font-medium mb-1 line-clamp-2 hover:text-primary">
                    {doc.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {doc.summary}
                </p>
                <div className="flex items-center justify-between">
                  <Badge className={getTypeColor(doc.type)}>
                    {getTypeLabel(doc.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(doc.uploadedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
