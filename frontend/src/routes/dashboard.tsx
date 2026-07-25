import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Flame, MessageCircle, Wind, ChevronRight, Heart, CalendarCheck, Users, Sparkles, Clock, BookOpen, FileText, Wallet } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useUser } from '@clerk/clerk-react';
import { AppShell } from '@/components/AppShell';
import { MessageCounter } from '@/components/MessageCounter';
import { CrisisOverlay } from '@/components/CrisisButton';
import { motion } from 'framer-motion';
import API from '@/lib/api';

export const Route = createFileRoute('/dashboard')({ component: Dashboard });

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function formatCountdown(slot: string) {
  const diff = new Date(slot).getTime() - Date.now();
  if (diff <= 0) return 'Starting now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `In ${h}h ${m}m`;
  return `In ${m}m`;
}

function Dashboard() {
  const nav = useNavigate();
  const { user: clerkUser } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const displayName = dbUser?.fullName?.split(" ")[0] || clerkUser?.firstName || 'friend';
  const [crisisMode, setCrisisMode] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Auto-redirect therapists and admins based on existing role
  useEffect(() => {
    API.auth.me().then(async (me: any) => {
      setDbUser(me);
      let role = me?.role ?? 'user';
      const intentRole = localStorage.getItem('mymindtherapyfriend_intent_role');
      
      // Clean up intent immediately
      if (intentRole) localStorage.removeItem('mymindtherapyfriend_intent_role');

      // Only attempt to set a role if they are currently a basic 'user'
      // This prevents an existing Org Admin from being redirected or changed if they click the wrong link
      if (role === 'user' && intentRole && intentRole !== 'user') {
        try {
          const res = await API.auth.setRole(intentRole);
          role = res.user?.role ?? intentRole;
        } catch (err) {
          console.error('Failed to set intended role:', err);
        }
      }

      // Final redirection based on confirmed role
      if (role === 'therapist') return nav({ to: '/therapist/dashboard', replace: true });
      if (role === 'org_admin') return nav({ to: '/org/dashboard', replace: true });
      if (role === 'super_admin') return nav({ to: '/admin/dashboard', replace: true });

      if (role === 'user' && !me?.onboarding?.completedAt) {
        return nav({ to: '/onboarding', replace: true });
      }

      setIsCheckingRole(false);
    }).catch(() => {
      setIsCheckingRole(false);
    });
  }, [nav]);

  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => API.booking.list(),
    retry: false,
    enabled: !isCheckingRole,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get(),
    retry: false,
    enabled: !isCheckingRole,
  });

  const { data: walletData } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: () => API.payment.getWalletBalance(),
    retry: false,
    enabled: !isCheckingRole,
  });
  const walletBalance = walletData?.walletBalance ?? 0;

  const { data: userStats, refetch: refetchStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => API.user.stats(),
    retry: false,
    enabled: !isCheckingRole,
  });

  const { data: journalPrompt } = useQuery({
    queryKey: ['journalPrompt'],
    queryFn: () => API.journal.get('prompt').catch(() => ({ prompt: 'What is one thing you can control right now?' })),
    retry: false,
    enabled: !isCheckingRole,
  });

  const { data: recentChat } = useQuery({
    queryKey: ['recentChat'],
    queryFn: () => API.chat.getMessages('latest').catch(() => ({ messages: [] })),
    retry: false,
    enabled: !isCheckingRole,
  });

  const submitMoodMutation = useMutation({
    mutationFn: (score: number) => API.mood.create({ score, date: todayStr() }),
    onSuccess: () => refetchStats(),
  });

  const respondJournalMutation = useMutation({
    mutationFn: ({ bookingId, approve }: { bookingId: string; approve: boolean }) =>
      API.booking.respondToJournal(bookingId, approve),
    onSuccess: () => {
      refetchBookings();
    },
  });

  const streak = userStats?.streak ?? 0;
  const todayMood = userStats?.latestMoodDate === todayStr() ? userStats?.latestMood : null;
  const promptText = journalPrompt?.prompt ?? 'What thought has been on a loop today?';
  const lastMsg = recentChat?.messages?.[0]; // Assuming backend returns most recent first

  const submitMood = (score: number) => {
    submitMoodMutation.mutate(score);
  };

  // Next upcoming confirmed booking
  const upcomingBooking = bookingsData?.bookings
    ?.filter((b: any) => b.status === 'confirmed' && new Date(b.slot) > new Date())
    ?.sort((a: any, b: any) => new Date(a.slot).getTime() - new Date(b.slot).getTime())[0];

  const requestedBookings = bookingsData?.bookings
    ?.filter((b: any) => b.status === 'confirmed' && b.journalShareState === 'requested' && new Date(b.slot) > new Date()) || [];

  const canJoin = upcomingBooking && (new Date(upcomingBooking.slot).getTime() - Date.now()) < 15 * 60 * 1000;

  const tier = subscription?.tier ?? 'free';
  const tierLabel = subscription?.tierLabel ?? 'Free';

  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-canvas-gradient flex items-center justify-center px-4">
        <div className="size-12 rounded-full bg-warm-gradient animate-pulse" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div>
            <p className="text-sm text-muted-foreground">{greeting()},</p>
            <h1 className="font-display text-3xl font-bold text-primary-deep">{displayName}</h1>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1.5 text-sm font-semibold text-gold-foreground">
              <Flame className="size-4 text-accent" />
              {streak} day{streak === 1 ? '' : 's'}
            </div>
            <Link to="/subscription" className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              tier === 'free' ? 'bg-muted text-muted-foreground' :
              tier === 'mann_shanti' ? 'bg-primary-soft text-primary' :
              'bg-gold/30 text-gold-foreground'
            }`}>
              {tierLabel}
            </Link>
            <Link to="/wallet" className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-accent-soft text-accent border border-accent/20">
              <Wallet className="size-3.5" />
              <span>₹{walletBalance.toFixed(2)}</span>
            </Link>
          </div>
        </div>

        {/* Journal Consent Request Banners */}
        {requestedBookings.map((b: any) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-gold/10 border border-gold/30 p-5 shadow-sm space-y-3 relative overflow-hidden"
          >
            <div className="absolute -right-12 -top-12 size-24 rounded-full bg-gold/10 blur-xl" />
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gold/25 text-gold-foreground">
                <BookOpen className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-primary-deep text-sm">Journal Sharing Request</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>{b.therapistName}</strong> has requested access to view your CBT journal entries from the past 7 days to prepare for your session on{" "}
                  <strong>
                    {new Date(b.slot).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </strong>
                  .
                </p>
                <p className="text-[11px] text-muted-foreground/80 italic">
                  * Only your reflections from the last 7 days will be shared. You can decline if you wish.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                disabled={respondJournalMutation.isPending}
                onClick={() => respondJournalMutation.mutate({ bookingId: b.id, approve: false })}
                className="px-4 py-1.5 border border-muted hover:bg-muted/10 text-muted-foreground text-xs font-semibold rounded-xl transition disabled:opacity-50"
              >
                Decline
              </button>
              <button
                disabled={respondJournalMutation.isPending}
                onClick={() => respondJournalMutation.mutate({ bookingId: b.id, approve: true })}
                className="px-4 py-1.5 bg-primary-deep hover:bg-primary-deep/90 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {respondJournalMutation.isPending ? "Processing..." : "Approve & Share"}
              </button>
            </div>
          </motion.div>
        ))}

        {/* Responsive Desktop Grid System */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Left/Main Content Column (2/3 width on Widescreen) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Session Widget */}
            {upcomingBooking && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-primary-deep p-5 text-primary-foreground shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="size-5" />
                    <span className="font-display font-semibold text-sm">Upcoming Session</span>
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                    {formatCountdown(upcomingBooking.slot)}
                  </span>
                </div>
                <p className="font-display font-bold text-lg">{upcomingBooking.therapistName}</p>
                <p className="text-primary-foreground/70 text-sm mt-1">
                  {new Date(upcomingBooking.slot).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}
                  {new Date(upcomingBooking.slot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="mt-4 flex gap-2">
                  {canJoin ? (
                    <Link to={`/session/${upcomingBooking.id}`}
                      className="flex-1 text-center bg-white text-primary-deep font-bold py-2 rounded-xl text-sm">
                      Join Session
                    </Link>
                  ) : (
                    <div className="flex-1 text-center bg-white/20 text-primary-foreground/60 font-semibold py-2 rounded-xl text-sm">
                      <Clock className="size-3 inline mr-1" />Available 15 min before
                    </div>
                  )}
                  <Link to="/bookings" className="px-4 bg-white/10 text-primary-foreground font-semibold py-2 rounded-xl text-sm">
                    All
                  </Link>
                </div>
              </motion.div>
            )}
            {/* Chat with Manas card */}
            <Link to="/chat" className="block">
              <div className="rounded-3xl bg-warm-gradient p-6 text-primary-foreground shadow-md transition-transform active:scale-[0.98] hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="size-5" />
                    <span className="font-display font-semibold text-lg">Chat with Manas AI</span>
                  </div>
                  <ChevronRight className="size-5" />
                </div>
                <p className="mt-3 text-sm text-primary-foreground/90 leading-relaxed line-clamp-3">
                  {lastMsg?.content || 'Tap to open up — no judgement, just a listening ear.'}
                </p>
              </div>
            </Link>

            {/* Quick Actions Grid */}
            <div className="space-y-3">
              <h2 className="font-display font-bold text-lg text-primary-deep">Self-Help Tools</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/breathe" className="rounded-3xl bg-card p-5 shadow-sm transition hover:shadow-md border border-border/50">
                  <div className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <Wind className="size-5" />
                  </div>
                  <div className="mt-3 font-display font-semibold">1-min breath</div>
                  <div className="text-xs text-muted-foreground">Calm your nerves</div>
                </Link>
                <Link to="/journal" className="rounded-3xl bg-card p-5 shadow-sm transition hover:shadow-md border border-border/50">
                  <div className="grid size-10 place-items-center rounded-2xl bg-gold/20 text-gold-foreground">
                    <BookOpen className="size-5" />
                  </div>
                  <div className="mt-3 font-display font-semibold">CBT Journal</div>
                  <div className="text-xs text-muted-foreground">Reframe thoughts</div>
                </Link>
                <Link to="/therapists" className="rounded-3xl bg-card p-5 shadow-sm transition hover:shadow-md border border-border/50">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                    <Users className="size-5" />
                  </div>
                  <div className="mt-3 font-display font-semibold">Find therapist</div>
                  <div className="text-xs text-muted-foreground">Book a session</div>
                </Link>
                <Link to="/reports" className="rounded-3xl bg-card p-5 shadow-sm transition hover:shadow-md border border-border/50">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                    <FileText className="size-5" />
                  </div>
                  <div className="mt-3 font-display font-semibold">Wellness Reports</div>
                  <div className="text-xs text-muted-foreground">Download & Share</div>
                </Link>
              </div>
            </div>

            {/* CBT Prompt */}
            <div className="rounded-3xl border border-dashed border-primary/30 bg-primary-soft/40 p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">Today's CBT Prompt</div>
              <p className="mt-2 font-display text-lg font-semibold text-primary-deep leading-relaxed">
                {promptText}
              </p>
              <Link to="/journal" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                Write in Journal <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Right/Side Widget Column (1/3 width on Widescreen) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Message Counter */}
            {tier !== 'apna_therapist' && (
              <MessageCounter onCrisisMode={setCrisisMode} />
            )}

            

            {/* Mood Check-In Widget */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-card p-5 shadow-sm border border-border/50">
              <div className="flex items-center gap-2">
                <Heart className="size-4 text-accent" />
                <h2 className="font-display font-semibold text-sm">How are you feeling today?</h2>
              </div>
              <div className="mt-4 flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                {['😞','😟','😕','😐','🙂','😊','😄','😁','🤩','🥰'].map((emoji, i) => {
                  const score = i + 1;
                  const active = todayMood === score;
                  return (
                    <button key={score} onClick={() => submitMood(score)}
                      className={`grid size-8 place-items-center rounded-full text-lg transition ${
                        active ? 'scale-125 bg-accent shadow-md' : 'hover:scale-110'
                      }`}>
                      {emoji}
                    </button>
                  );
                })}
              </div>
              {todayMood && <p className="mt-3 text-center text-[10px] text-muted-foreground">Logged for today.</p>}
            </motion.div>

            {/* WhatsApp Community Group Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
                  <MessageCircle className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-slate-900 text-sm">MindSync Community</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Connect with peers, share experiences & get daily support in our official WhatsApp group.
                  </p>
                </div>
              </div>
              <a
                href="https://chat.whatsapp.com/CbMYSt00R0KDEdiEsp9IeL"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition"
              >
                Join WhatsApp Group <ChevronRight className="size-4" />
              </a>
            </motion.div>

            {/* Upgrade nudge for free users */}
            {tier === 'free' && !upcomingBooking && (
              <Link to="/subscription">
                <div className="rounded-3xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5 flex items-center gap-4 transition-transform active:scale-[0.97] hover:shadow-md">
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary/10">
                    <Sparkles className="size-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-primary-deep text-sm">Unlock Apna Mann</p>
                    <p className="text-xs text-muted-foreground mt-0.5">1000 messages/day · ₹199/mo</p>
                  </div>
                  <ChevronRight className="size-5 text-primary" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      <CrisisOverlay open={crisisMode} onClose={() => setCrisisMode(false)} />
    </AppShell>
  );
}
