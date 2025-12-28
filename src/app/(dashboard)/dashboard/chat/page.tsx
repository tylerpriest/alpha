'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Citation {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  snippet: string;
  similarity: number;
  pageNumber?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Chat failed');
      }

      const data = await res.json();

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message.content,
          citations: data.message.citations,
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold">AI Chat</h1>
        <p className="text-slate-600 mt-1">
          Ask questions about your knowledge base
        </p>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-slate-500">
              <div>
                <p className="text-lg font-medium">
                  Ask me anything about your documents
                </p>
                <p className="text-sm mt-2">
                  I&apos;ll search your knowledge base and provide answers with
                  citations.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-xs text-slate-400">Try asking:</p>
                  <button
                    onClick={() =>
                      setInput('Why did we pass on Company X in 2019?')
                    }
                    className="block mx-auto text-blue-600 hover:underline text-sm"
                  >
                    &quot;Why did we pass on Company X in 2019?&quot;
                  </button>
                  <button
                    onClick={() =>
                      setInput('What patterns do our successful exits share?')
                    }
                    className="block mx-auto text-blue-600 hover:underline text-sm"
                  >
                    &quot;What patterns do our successful exits share?&quot;
                  </button>
                  <button
                    onClick={() =>
                      setInput('Summarize our fintech investments')
                    }
                    className="block mx-auto text-blue-600 hover:underline text-sm"
                  >
                    &quot;Summarize our fintech investments&quot;
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-2">
                          Sources:
                        </p>
                        <div className="space-y-2">
                          {message.citations.map((citation, cidx) => (
                            <div
                              key={cidx}
                              className="text-xs bg-white rounded p-2 border"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  [{cidx + 1}] {citation.documentTitle}
                                </span>
                                {citation.pageNumber && (
                                  <Badge variant="outline" className="text-xs">
                                    p.{citation.pageNumber}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-slate-600 line-clamp-2">
                                {citation.snippet}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
                      <div
                        className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <CardContent className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              className="flex-1 min-h-[60px] resize-none"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
