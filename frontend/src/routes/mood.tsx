import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useState } from 'react';

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
          <h1 className="font-display text-3xl font-bold text-primary-deep">Mood diary</h1>
          <p className="mt-1 text-muted-foreground">Tap a day to see, slide to log today.</p>
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
