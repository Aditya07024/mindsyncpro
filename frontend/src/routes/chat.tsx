import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { useStore, FREE_DAILY_LIMIT } from '@/lib/store';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import API from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { ManasAvatar } from '@/components/ManasAvatar';
import { CrisisOverlay } from '@/components/CrisisButton';
import { detectCrisis } from '@/lib/crisis';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/chat')({ component: Chat });

function Chat() {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => API.auth.me(),
    retry: false,
  });
  const firstName = me?.fullName?.split(" ")[0] || clerkUser?.firstName || 'friend';
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => API.user.stats(),
    retry: false,
  });

  const { data: chatData, isLoading: chatLoading, refetch } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: () => API.chat.getMessages(),
    retry: false,
  });

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get().catch(() => null),
    retry: false,
  });

  const dbMessages = chatData?.messages || [];
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  useEffect(() => {
    setLocalMessages(dbMessages);
  }, [dbMessages]);

  const messages = localMessages;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const todayStr = new Date().toLocaleDateString('en-CA');
  const dailyLimit = subData?.usage?.dailyLimit !== undefined ? subData.usage.dailyLimit : FREE_DAILY_LIMIT;
  const usedToday = subData?.usage?.messagesUsedToday !== undefined ? subData.usage.messagesUsedToday : (messages.filter((m: any) => 
    m.role === 'user' && 
    new Date(m.timestamp || m.createdAt).toLocaleDateString('en-CA') === todayStr
  ).length || 0);

  const isUnlimited = dailyLimit === null;
  const remaining = isUnlimited ? Infinity : Math.max(0, dailyLimit - usedToday);
  const limitHit = !isUnlimited && remaining === 0;

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    await sendHelper(text);
  };

  const sendHelper = async (text: string) => {
    if (limitHit) return;

    if (detectCrisis(text)) setCrisis(true);

    const userMsg = { _id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() };
    setLocalMessages(prev => [...prev, userMsg]);

    const placeholder = { _id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: Date.now() };
    setLocalMessages(prev => [...prev, placeholder]);
    setStreaming(true);

    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://api.mymindtherapyfriend.online"}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text }),
      });
      if (res.headers.get('X-Crisis') === '1') setCrisis(true);
      if (!res.ok || !res.body) {
        setLocalMessages(prev => prev.map(m => m._id === placeholder._id ? {
          ...m,
          content: "I'm having trouble responding right now. Please try again in a moment.",
          error: true
        } : m));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6);
          if (json === '[DONE]') continue;
          try {
            const p = JSON.parse(json);
            const t = p?.chunk || p?.choices?.[0]?.delta?.content;
            if (t) {
              acc += t;
              setLocalMessages(prev => prev.map(m => m._id === placeholder._id ? { ...m, content: acc } : m));
            }
          } catch {}
        }
      }
    } catch {
      setLocalMessages(prev => prev.map(m => m._id === placeholder._id ? {
        ...m,
        content: "I'm having trouble responding right now. Please try again in a moment.",
        error: true
      } : m));
    } finally {
      setStreaming(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }
  };

  const handleRetry = async (failedMsg: any) => {
    const idx = localMessages.findIndex(m => m._id === failedMsg._id);
    if (idx === -1) return;

    const userMsg = localMessages[idx - 1];
    if (!userMsg || userMsg.role !== 'user') return;

    // Filter out both the user's message and the failed assistant reply to re-send cleanly
    setLocalMessages(prev => prev.filter(m => m._id !== failedMsg._id && m._id !== userMsg._id));
    await sendHelper(userMsg.content);
  };

  return (
    <AppShell>
      <div className="-mx-4 -mt-6 flex h-[calc(100vh-9rem)] flex-col">
        <div className="flex items-center justify-between border-b border-border/50 bg-card/60 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <ManasAvatar size={36} />
            <div>
              <div className="font-display font-semibold leading-tight">Manas</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="size-1.5 animate-soft-pulse rounded-full bg-emerald-500" />
                AI companion · always here
              </div>
            </div>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-medium ${limitHit ? 'bg-crisis/10 text-crisis' : 'bg-primary-soft text-primary'}`}>
            {isUnlimited ? 'Unlimited messages' : `${remaining} of ${dailyLimit} messages remaining`}
          </div>
        </div>

        {chatLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading conversation history...</p>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
            {messages.length === 0 && (
              <div className="flex items-end gap-2">
                <ManasAvatar size={36} />
                <div className="max-w-[75%] rounded-3xl rounded-bl-md bg-card p-4 shadow-sm">
                  <p className="text-foreground">
                    Hi {firstName || 'friend'}. I'm Manas. Whatever brought you here — let's just sit with it together. What's on your mind?
                  </p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <motion.div
                key={m._id || m.id || Math.random()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
              >
                {m.role === 'assistant' && <ManasAvatar size={36} />}
                <div
                  className={`max-w-[75%] rounded-3xl p-4 shadow-sm ${
                    m.role === 'user'
                      ? 'rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-bl-md bg-card text-foreground'
                  }`}
                >
                  {m.content ? (
                    <>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.error && (
                        <button
                          type="button"
                          onClick={() => handleRetry(m)}
                          className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-full border border-rose-200 transition-all cursor-pointer shadow-sm w-fit"
                        >
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                          Retry message
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-1.5 py-2">
                      <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                      <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                      <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {limitHit && (
          <div className="mx-4 mb-3 rounded-2xl bg-accent/10 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-accent-foreground">
              <AlertTriangle className="size-4" />
              You've reached your daily message limit
            </div>
            <p className="mt-1 text-muted-foreground">
              {dailyLimit <= 7 
                ? "Come back tomorrow, or upgrade to Mann Shanti (₹199/mo) for 100 messages a day."
                : "Come back tomorrow, or upgrade to Apna Therapist for unlimited messages."}
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 border-t border-border/50 bg-card/60 px-3 py-3 backdrop-blur"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming || limitHit}
            placeholder={limitHit ? 'Daily limit reached' : 'Type what you feel…'}
            className="flex-1 rounded-full border-0 bg-secondary px-4 py-3 outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming || limitHit}
            className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>

      <CrisisOverlay open={crisis} onClose={() => setCrisis(false)} />
    </AppShell>
  );
}

