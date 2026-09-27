import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { motion } from 'framer-motion';
import { Users, Clock, Shield, Volume2, ChevronRight, Lock, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import API from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Route = createFileRoute('/group-sessions')({
  component: UserGroupSessionsPage,
});

function UserGroupSessionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['group-sessions'],
    queryFn: () => API.groupSessions.list(),
    refetchInterval: 5000,
  });

  const joinMutation = useMutation({
    mutationFn: (sessionId: string) => API.groupSessions.joinRequest(sessionId),
    onSuccess: (res, sessionId) => {
      if (res.status === 'admitted') {
        toast.success('Admitted to session!');
        navigate({ to: `/group-audio/$sessionId/room`, params: { sessionId } });
      } else {
        toast.info(res.message || 'Waiting for counselor to allow entry...');
        queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
      }
    },
    onError: (err: any) => toast.error(err.message || 'Failed to join group audio session'),
  });

  const activeSessions = data?.sessions || [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none overflow-hidden">
            <Users className="size-64 text-white -mr-10 -mt-10" />
          </div>
          <div className="relative z-10 space-y-3 max-w-xl">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full">
              LIVE AUDIO ROOMS
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
              Group Therapy Audio Sessions
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Join anonymous multi-participant audio discussions led by certified counsellors. Video is strictly disabled for maximum comfort and privacy.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1 text-teal-400">
                <Shield className="size-3.5" /> 100% Anonymous (User 1, User 2)
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Users className="size-3.5" /> Max 11 Users / Session
              </span>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 mb-4">
            Live Group Audio Sessions ({activeSessions.length})
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading live audio sessions...</div>
          ) : activeSessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
              No live group audio sessions available right now. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeSessions.map((s: any) => (
                <motion.div
                  key={s._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE AUDIO ROOM
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {s.admittedCount || 0} / {s.maxUsers || 11} Users
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-slate-900 text-lg">{s.title}</h3>
                    {s.description && <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>}
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      👨‍⚕️ {s.counselorName || 'Certified Counsellor'}
                    </span>
                    <span className="font-bold text-teal-700">
                      {s.price > 0 ? `₹${s.price}` : 'FREE Session'}
                    </span>
                  </div>

                  {s.isUserAdmitted ? (
                    <Button
                      onClick={() => navigate({ to: `/group-audio/$sessionId/room`, params: { sessionId: s._id } })}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5 text-xs shadow-md gap-2"
                    >
                      <Volume2 className="size-4" /> Enter Audio Room Now
                    </Button>
                  ) : s.isUserWaiting ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs text-amber-800 font-bold flex items-center justify-center gap-2">
                      <Loader2 className="size-3.5 animate-spin text-amber-600" />
                      Waiting for Counselor to Allow Entry...
                    </div>
                  ) : (
                    <Button
                      onClick={() => joinMutation.mutate(s._id)}
                      disabled={joinMutation.isPending}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl py-2.5 text-xs shadow-md gap-2"
                    >
                      {joinMutation.isPending ? 'Requesting Join...' : 'Join Audio Session'} <ChevronRight className="size-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
