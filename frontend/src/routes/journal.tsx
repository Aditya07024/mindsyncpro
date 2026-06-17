import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { JournalEntry } from '@/lib/store';
import { BookOpen, AlertTriangle, Sparkles, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import API from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

import { toast } from 'sonner';

export const Route = createFileRoute('/journal')({ component: JournalPage });

function JournalPage() {
  const queryClient = useQueryClient();
  
  const { data: journalPrompt } = useQuery({
    queryKey: ['journalPrompt'],
    queryFn: () => API.journal.get('prompt').catch(() => ({ prompt: 'What thought has been on a loop today?' })),
    retry: false,
  });

  const { data: journalData } = useQuery({
    queryKey: ['journals'],
    queryFn: () => API.journal.list(),
  });

  const journals = journalData?.entries || [];
  const todayPrompt = journalPrompt?.prompt ?? 'What thought has been on a loop today?';

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get(),
    retry: false,
  });

  const tier = subscription?.tier ?? 'free';

  // Check week limits
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekEntries = journals.filter((j: any) => new Date(j.createdAt) >= oneWeekAgo).length;
  const limitHit = tier === 'free' && weekEntries >= 3;

  const [situation, setSituation] = useState('');
  const [thought, setThought] = useState('');
  const [feeling, setFeeling] = useState('');
  const [reframe, setReframe] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyLoggedToday = journals.some((j: any) => j.createdAt && new Date(j.createdAt).toISOString().slice(0, 10) === todayStr);

  const submitJournalMutation = useMutation({
    mutationFn: (data: any) => API.journal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      setSituation(''); setThought(''); setFeeling(''); setReframe('');
      setSubmitting(false);
      toast.success("Journal entry saved successfully! ✨");
    },
    onError: (err: any) => {
      setSubmitting(false);
      toast.error(err.message || "Failed to save journal entry. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limitHit || alreadyLoggedToday || !situation || !thought || !feeling || !reframe) return;
    
    setSubmitting(true);
    submitJournalMutation.mutate({
      prompt: todayPrompt,
      situation,
      thought,
      feeling,
      reframe
    });
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-deep flex items-center gap-2">
            <BookOpen className="size-6 text-accent" /> CBT Journal
          </h1>
          <p className="mt-1 text-muted-foreground">Rewrite your inner narrative.</p>
        </div>

        {/* Free Tier Limit Warning */}
        {tier === 'free' && (
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3 text-sm">
            <span className="font-semibold text-muted-foreground">{weekEntries} / 3 free weekly entries</span>
            <Link to="/subscription" className="text-accent font-bold text-xs hover:underline">Upgrade</Link>
          </div>
        )}

        {/* New Entry Form */}
        {!alreadyLoggedToday ? (
          <div className="rounded-3xl border border-dashed border-primary/30 bg-card p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Today's Reflection</div>
            <p className="font-display text-lg font-bold text-primary-deep mb-6">
              {todayPrompt}
            </p>

            {limitHit ? (
              <div className="rounded-2xl bg-secondary/50 p-6 text-center">
                <Lock className="size-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-foreground">Weekly Limit Reached</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">You've used your 3 free journal entries for this week.</p>
                <Link to="/subscription" className="inline-block bg-primary text-primary-foreground font-bold px-6 py-2 rounded-full shadow-md transition hover:bg-primary-deep">
                  Unlock Unlimited Journaling
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">1. Situation</label>
                  <textarea value={situation} onChange={e => setSituation(e.target.value)} placeholder="What happened?" className="w-full bg-secondary/50 border-0 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary outline-none transition" rows={2} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">2. Thought</label>
                  <textarea value={thought} onChange={e => setThought(e.target.value)} placeholder="What went through your mind?" className="w-full bg-secondary/50 border-0 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary outline-none transition" rows={2} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">3. Feeling</label>
                  <input value={feeling} onChange={e => setFeeling(e.target.value)} type="text" placeholder="How did you feel? (e.g. Anxious, Angry)" className="w-full bg-secondary/50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">4. Reframe</label>
                  <textarea value={reframe} onChange={e => setReframe(e.target.value)} placeholder="What is a more balanced way to look at this?" className="w-full bg-primary-soft/30 border-0 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary outline-none transition" rows={3} required />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-md transition hover:bg-primary-deep active:scale-[0.98] disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Entry'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="rounded-3xl bg-primary-soft/40 p-6 text-center border border-primary/20">
            <Sparkles className="size-8 text-primary mx-auto mb-3" />
            <h3 className="font-display font-bold text-primary-deep text-lg">You've reflected today</h3>
            <p className="text-sm text-primary-deep/80 mt-1">Come back tomorrow for a new prompt.</p>
          </div>
        )}

        {/* Past Entries */}
        <div className="pt-4">
          <h2 className="font-display font-bold text-xl text-primary-deep mb-4">Past Entries</h2>
          {journals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet. Start writing today.</p>
          ) : (
            <div className="space-y-3">
              {journals.map((j: any) => {
                const isExpanded = expandedId === j._id;
                return (
                  <div key={j._id} className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden transition-all">
                    <button onClick={() => setExpandedId(isExpanded ? null : j._id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition">
                      <div>
                        <div className="text-xs font-bold text-muted-foreground mb-1">{new Date(j.createdAt).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        <div className="font-semibold text-foreground line-clamp-1">{j.prompt}</div>
                      </div>
                      {isExpanded ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/50">
                          <div className="p-4 space-y-4 text-sm bg-secondary/10">
                            <div>
                              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block mb-0.5">Situation</span>
                              <span className="text-foreground">{j.situation}</span>
                            </div>
                            <div>
                              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block mb-0.5">Thought</span>
                              <span className="text-foreground">{j.thought}</span>
                            </div>
                            <div>
                              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block mb-0.5">Feeling</span>
                              <span className="text-foreground">{j.feeling}</span>
                            </div>
                            <div>
                              <span className="font-bold text-primary uppercase text-[10px] tracking-wider block mb-0.5">Reframe</span>
                              <span className="font-medium text-primary-deep">{j.reframe}</span>
                            </div>
                            
                            {/* AI Response for paid users */}
                            {tier !== 'free' && (
                              <div className="mt-4 p-4 rounded-xl bg-warm-gradient text-primary-foreground shadow-inner">
                                <span className="font-bold uppercase text-[10px] tracking-wider flex items-center gap-1 mb-1">
                                  <Sparkles className="size-3" /> Manas Response
                                </span>
                                {j.aiResponse ? (
                                  <span className="font-medium">{j.aiResponse}</span>
                                ) : (
                                  <span className="italic opacity-80 animate-pulse">Manas is reflecting on your entry...</span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
