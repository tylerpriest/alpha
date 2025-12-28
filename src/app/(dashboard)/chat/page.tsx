'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  Sparkles,
  FileText,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Bot,
  User,
  History,
  Plus,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    id: string;
    title: string;
    excerpt: string;
    relevance: number;
  }[];
  timestamp: Date;
}

const suggestedQueries = [
  {
    category: 'Deal Analysis',
    queries: [
      'What are the key risks in our current pipeline?',
      'Compare TechStart to similar deals we\'ve evaluated',
      'What\'s our average check size for Series A investments?',
    ],
  },
  {
    category: 'Portfolio Insights',
    queries: [
      'Which portfolio companies are showing the best growth?',
      'What operational improvements have worked across our portfolio?',
      'Summarize portfolio company performance this quarter',
    ],
  },
  {
    category: 'Market Research',
    queries: [
      'What are the latest trends in the AI/ML sector?',
      'How are SaaS valuations trending in 2024?',
      'What regulatory changes might affect our cleantech investments?',
    ],
  },
];

const previousConversations = [
  { id: '1', title: 'SaaS unit economics analysis', date: 'Today' },
  { id: '2', title: 'TechStart due diligence questions', date: 'Yesterday' },
  { id: '3', title: 'Portfolio company benchmarking', date: 'Dec 25' },
  { id: '4', title: 'Market size estimation for fintech', date: 'Dec 24' },
];

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle initial query from URL
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setInput(q);
      // Auto-submit the query
      handleSubmit(q);
    }
  }, [searchParams]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (query?: string) => {
    const message = query || input;
    if (!message.trim() || isLoading) return;

    setShowHistory(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (in production, call your API)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(message),
        sources: [
          {
            id: '1',
            title: 'Q4 2024 Market Analysis',
            excerpt: 'Enterprise software valuations have stabilized at 8-12x ARR for growth-stage companies...',
            relevance: 0.94,
          },
          {
            id: '2',
            title: 'SaaS Metrics Benchmark 2024',
            excerpt: 'Top quartile SaaS companies achieve >120% NRR with CAC payback under 12 months...',
            relevance: 0.87,
          },
          {
            id: '3',
            title: 'TechStart Investment Memo',
            excerpt: 'Strong product-market fit evidenced by 180% NRR and enterprise customer expansion...',
            relevance: 0.82,
          },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateMockResponse = (query: string): string => {
    if (query.toLowerCase().includes('risk')) {
      return `Based on my analysis of your current deal pipeline, here are the key risks I've identified:

**Market Risks:**
- 3 deals in the AI/ML space may face increased competition from well-funded incumbents
- The cleantech deal (GreenEnergy Co) has regulatory uncertainty in 2 target markets

**Execution Risks:**
- TechStart has limited enterprise sales experience despite strong product
- 2 deals show concerning burn rates relative to current traction

**Valuation Risks:**
- Average entry multiple for current pipeline (12x ARR) is above your historical average (9x ARR)
- This suggests potential for compression in a downturn

**Recommendations:**
1. Consider deeper technical due diligence on AI differentiation for TechStart
2. Request updated financial projections from GreenEnergy accounting for regulatory scenarios
3. Negotiate more protective terms given elevated valuation environment`;
    }

    return `I've analyzed your knowledge base to answer your question. Based on the documents I reviewed:

**Key Findings:**
- Your portfolio has consistently outperformed benchmarks in the enterprise SaaS category
- The most successful investments share common characteristics: strong technical founders, >150% NRR, and clear path to $10M ARR

**Relevant Data Points:**
- Average holding period: 5.2 years
- Median MOIC: 3.4x
- Top performing sector: B2B SaaS (4.1x average)

**Insights from Historical Deals:**
Looking at similar opportunities you've evaluated, the key differentiating factors for successful investments were:
1. Strong product-led growth metrics
2. Experienced enterprise sales leadership
3. Clear competitive moat

Would you like me to dive deeper into any of these areas?`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {messages.length === 0 && showHistory ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ask AlphaIntel</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Query your entire knowledge base using natural language. I can help with
              deal analysis, portfolio insights, market research, and more.
            </p>

            <div className="w-full max-w-2xl space-y-6">
              {suggestedQueries.map((category) => (
                <div key={category.category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {category.category}
                  </h3>
                  <div className="grid gap-2">
                    {category.queries.map((query) => (
                      <button
                        key={query}
                        onClick={() => handleSubmit(query)}
                        className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Messages
          <ScrollArea className="flex-1 px-4">
            <div className="max-w-3xl mx-auto py-6 space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="space-y-4">
                  <div className="flex gap-4">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={message.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                        {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {message.role === 'assistant' ? 'AlphaIntel' : 'You'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none text-foreground">
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 pt-2">
                          <Button variant="ghost" size="sm" onClick={() => copyMessage(message.content)}>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Helpful
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Not helpful
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="ml-12 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Sources ({message.sources.length})
                      </p>
                      <div className="grid gap-2">
                        {message.sources.map((source) => (
                          <Card key={source.id} className="bg-muted/30">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{source.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {source.excerpt}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round(source.relevance * 100)}%
                                  </Badge>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">AlphaIntel</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Searching knowledge base...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Ask anything about your knowledge base..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] max-h-[200px] pr-12 resize-none"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="absolute right-2 bottom-2"
                onClick={() => handleSubmit()}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AlphaIntel searches your documents to provide accurate, sourced answers.
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar - Conversation History */}
      <div className="hidden lg:flex lg:w-64 flex-col border-l pl-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <History className="h-4 w-4" />
            Recent Chats
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 -mr-4 pr-4">
          <div className="space-y-2">
            {previousConversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full text-left rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-muted-foreground">{conv.date}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
