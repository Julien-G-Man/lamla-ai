'use client';

import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Image from 'next/image';
import { Send, Paperclip, X, Copy, Check, Globe, Loader2, Bot, Sparkles } from 'lucide-react';

type SearchMode = 'disabled' | 'web_search' | 'deep_research';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || '';

const suggestedPrompts = [
  'Explain this concept in simple terms',
  'Create a study plan for my exam',
  'What are the key topics I should focus on?',
  'Help me understand this formula',
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('disabled');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSearchMenu, setShowSearchMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAuthToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async () => {
    if (!file || !input.trim()) return;
    setIsLoading(true);
    const userInput = input;
    setInput('');
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: userInput }]);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', userInput);
    const token = getAuthToken();
    try {
      const res = await fetch(`${FASTAPI_URL}/chat/file/`, {
        method: 'POST',
        headers: token ? { Authorization: `Token ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: data.response || data.message || 'No response received.' }]);
    } catch {
      setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: 'Sorry, I could not process your file. Please try again.' }]);
    } finally {
      setFile(null);
      setIsLoading(false);
    }
  };

  const handleStreamSend = async (messageOverride?: string) => {
    const userInput = messageOverride || input;
    if (!userInput.trim()) return;
    setIsLoading(true);
    if (!messageOverride) setInput('');
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: userInput }]);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', isStreaming: true }]);

    const token = getAuthToken();
    try {
      const res = await fetch(`${FASTAPI_URL}/chat/stream/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({ message: userInput, search_mode: searchMode }),
      });

      if (!res.body) throw new Error('No stream body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') break;
            try {
              const parsed = JSON.parse(raw);
              accumulated += parsed.text || parsed.content || parsed.delta || '';
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m)
              );
            } catch { /* non-JSON line */ }
          }
        }
      }
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m));
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.', isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => { if (file) handleFileUpload(); else handleStreamSend(); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) handleSend();
    }
  };

  const searchModeLabels: Record<SearchMode, string> = {
    disabled: 'No Search',
    web_search: 'Web Search',
    deep_research: 'Deep Research',
  };

  return (
    <AppLayout title="AI Tutor">
      <div className="flex flex-col h-full max-w-3xl mx-auto px-4 py-4 gap-0">

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-20">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center glow-blue">
                <Bot size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Ask me anything</h2>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  I can explain concepts, answer questions, analyze your files, and help you ace your exams.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleStreamSend(prompt)}
                    className="px-3 py-1.5 rounded-full text-xs border border-border glass hover:border-primary/50 hover:text-primary transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 mr-2 mt-1">
                  <Image src="/lamla_logo.png" alt="Lamla AI" width={28} height={28} className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`relative group max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'gradient-bg text-white rounded-br-sm'
                  : 'glass border-l-2 border-primary/50 rounded-bl-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {msg.isStreaming && !msg.content ? (
                      <Loader2 size={16} className="animate-spin text-muted-foreground" />
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                    {msg.isStreaming && msg.content && (
                      <span className="inline-block w-1 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-hover"
                  >
                    {copiedId === msg.id
                      ? <Check size={12} className="text-green-400" />
                      : <Copy size={12} className="text-muted-foreground" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0">
          <div className="glass rounded-xl p-3 flex flex-col gap-2">
            {file && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs w-fit">
                <Paperclip size={12} />
                <span className="max-w-50 truncate">{file.name}</span>
                <button onClick={() => setFile(null)} className="hover:text-destructive transition-colors ml-1">
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors shrink-0"
              >
                <Paperclip size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything… (Shift+Enter for new line)"
                rows={1}
                className="flex-1 bg-transparent resize-none text-sm focus:outline-none max-h-36 overflow-y-auto placeholder:text-muted-foreground"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />

              {/* Search mode toggle */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowSearchMenu(!showSearchMenu)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                    searchMode !== 'disabled'
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-border text-muted-foreground hover:bg-surface-hover'
                  }`}
                >
                  <Globe size={12} />
                  <span className="hidden sm:inline">{searchModeLabels[searchMode]}</span>
                </button>
                {showSearchMenu && (
                  <div className="absolute bottom-full right-0 mb-1 z-10 glass rounded-lg shadow-xl py-1 min-w-37.5 border border-border">
                    {(Object.keys(searchModeLabels) as SearchMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => { setSearchMode(mode); setShowSearchMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-hover transition-colors ${
                          searchMode === mode ? 'text-primary font-medium' : 'text-muted-foreground'
                        }`}
                      >
                        {searchModeLabels[mode]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-md gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            AI can make mistakes. Always verify important information.
          </p>
        </div>

      </div>
    </AppLayout>
  );
}
