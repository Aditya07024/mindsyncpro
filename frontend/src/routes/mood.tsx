import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useState } from 'react';
import { User as UserIcon, Gift, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/mood')({ component: MoodPage });

function moodColor(score: number) {
  // 1=red → 5=amber → 10=green
  if (score <= 3) return 'oklch(0.65 0.18 25)';
  if (score <= 5) return 'oklch(0.78 0.14 70)';
  if (score <= 7) return 'oklch(0.78 0.13 130)';
  return 'oklch(0.68 0.14 160)';
}

function MoodPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['moodHistory'],
    queryFn: () => API.mood.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => API.auth.me(),
  });

  const moods = data?.moods || [];
  
  const submitMoodMutation = useMutation({
    mutationFn: (score: number) => API.mood.create({ score }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moodHistory'] }),
  });

  // build last 30-day grid
  const days: { date: string; score?: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const m = moods.find((x: any) => (x.date || x.createdAt) && new Date(x.date || x.createdAt).toISOString().slice(0, 10) === ds);
    days.push({ date: ds, score: m?.score });
  }

  const last7 = days.slice(-7).map((d) => ({
    name: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    score: d.score ?? null,
  }));

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = moods.find((x: any) => (x.date || x.createdAt) && new Date(x.date || x.createdAt).toISOString().slice(0, 10) === todayStr);
  const todayScore = todayEntry?.score ?? null;

  const recentScores = moods.slice(0, 14).map((m: any) => m.score);
  const avg = recentScores.length ? recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length : null;

  // simple insight
  let insight = 'Log a few days to start spotting patterns.';
  if (avg !== null) {
    if (avg < 4) insight = 'You\'ve been carrying a lot lately. Be gentle — talk to Manas, or take a slow breath.';
    else if (avg < 6) insight = 'Mixed days. Notice what made the brighter ones brighter.';
    else insight = 'You\'re holding steady. Keep nurturing what works.';
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-deep">My Profile & Mood Tracker</h1>
          <p className="mt-1 text-muted-foreground">Manage your referral code, free session credits, and daily mood reflections.</p>
        </div>

        {/* User Profile & Referral Code Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#004038] to-[#01584c] p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none">
            <Gift className="size-48" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-xl text-amber-300">
                <UserIcon className="size-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{user?.fullName || 'User Profile'}</h2>
                <p className="text-xs text-white/70 capitalize">
                  {user?.userType ? user.userType.replace('_', ' ') : 'Regular User'} • {user?.phoneMasked || user?.phone || 'No phone added'}
                </p>
              </div>
            </div>
            {user?.userType !== 'regular' && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full self-start sm:self-auto ${
                user?.studentIdVerificationStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                user?.studentIdVerificationStatus === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-white/10 text-white/80'
              }`}>
                Student ID: {user?.studentIdVerificationStatus || 'none'}
              </span>
            )}
          </div>

          {/* Referral Code Box */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Gift className="size-4 text-amber-400" /> Your Unique Referral Code
              </span>
              <span className="text-xs text-white/80 font-semibold bg-white/15 px-3 py-1 rounded-full">
                🎉 Free Sessions Balance: <strong>{user?.freeSessionCredits || 0}</strong>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/15">
              <div className="flex-1 font-mono text-xl font-extrabold tracking-widest text-amber-300 select-all">
                {user?.referralCode || 'MMTP-CODE'}
              </div>
              <button
                onClick={() => {
                  if (user?.referralCode) {
                    navigator.clipboard.writeText(user.referralCode);
                    toast.success("Referral code copied to clipboard!");
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="size-4" /> Copy Code
              </button>
            </div>

            <p className="text-xs text-white/80 leading-relaxed">
              Share your referral code with friends! When a friend onboards or enters your code, <strong>both of you get 1 Free Counseling Session</strong> (no fees required).
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-sm">
          <div className="font-display font-semibold">Today</div>
          <div className="mt-3 flex items-center gap-1">
            {[1,2,3,4,5,6,7,8,9,10].map((s) => (
              <button
                key={s}
                disabled={submitMoodMutation.isPending}
                onClick={() => submitMoodMutation.mutate(s)}
                className={`flex-1 rounded-lg py-3 text-sm font-semibold transition ${
                  todayScore === s ? 'scale-110 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'
                }`}
                style={{ backgroundColor: todayScore === s ? moodColor(s) : undefined }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-sm">
          <div className="font-display font-semibold">Last 30 days</div>
          <div className="mt-4 grid grid-cols-10 gap-1.5">
            {days.map((d) => (
              <div
                key={d.date}
                title={`${d.date}${d.score ? `: ${d.score}/10` : ' (no entry)'}`}
                className="aspect-square rounded-md"
                style={{ backgroundColor: d.score ? moodColor(d.score) : 'oklch(0.93 0.005 180)' }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-sm">
          <div className="font-display font-semibold">Last 7 days</div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7}>
                <XAxis dataKey="name" stroke="oklch(0.50 0.02 180)" fontSize={12} />
                <YAxis domain={[1, 10]} stroke="oklch(0.50 0.02 180)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', background: 'white' }} />
                <Line type="monotone" dataKey="score" stroke="oklch(0.46 0.06 180)" strokeWidth={3} dot={{ r: 4, fill: 'oklch(0.74 0.16 45)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-dashed border-primary/30 bg-primary-soft/40 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Pattern</div>
          <p className="mt-2 font-display text-lg font-semibold text-primary-deep">{insight}</p>
        </div>
      </div>
    </AppShell>
  );
}
