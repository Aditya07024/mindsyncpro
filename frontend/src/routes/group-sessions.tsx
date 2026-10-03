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
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-1 sm:px-4">
        {/* Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-teal-500/20">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none overflow-hidden hidden sm:block">
            <Users className="size-80 text-teal-300 -mr-16 -mt-10" />
          </div>
          <div className="relative z-10 space-y-3.5 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full shadow-sm">
              <Sparkles className="size-3 text-teal-300 animate-pulse" /> Live Group Audio Rooms
            </span>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Group Therapy Audio Sessions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Join anonymous multi-participant audio discussions led by certified counsellors. Video is strictly disabled for maximum comfort, safety, and privacy.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                <Shield className="size-3.5" /> 100% Anonymous (User 1, User 2)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Users className="size-3.5" /> Max 11 Users / Session
              </span>
            </div>
          </div>
        </div>

        {/* Sessions Section Header */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              Available Live Audio Sessions
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-extrabold">
                {activeSessions.length}
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="size-8 text-teal-600 animate-spin" />
              <p className="text-sm font-medium">Loading live audio sessions...</p>
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
              <div className="size-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2 border border-teal-100">
                <Volume2 className="size-7" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-lg">No Live Audio Sessions Right Now</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                No active group sessions are live at this moment. Please check back shortly or refresh!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {activeSessions.map((s: any) => (
                <motion.div
                  key={s._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE AUDIO ROOM
                    </span>
                    <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                      {s.admittedCount || 0}/{s.maxUsers || 11} Users
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg group-hover:text-teal-700 transition-colors">
                      {s.title}
                    </h3>
                    {s.description && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {s.description}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
                      👨‍⚕️ {s.counselorName || 'Certified Counsellor'}
                    </span>
                    <span className={`font-extrabold text-sm px-2.5 py-0.5 rounded-lg ${s.price > 0 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {s.price > 0 ? `₹${s.price}` : 'FREE Session'}
                    </span>
                  </div>

                  {s.isUserAdmitted ? (
                    <Button
                      onClick={() => navigate({ to: `/group-audio/$sessionId/room`, params: { sessionId: s._id } })}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl py-2.5 text-xs shadow-md gap-2 active:scale-[0.98] transition-transform"
                    >
                      <Volume2 className="size-4" /> Enter Audio Room Now
                    </Button>
                  ) : s.isUserWaiting ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs text-amber-800 font-bold flex items-center justify-center gap-2 shadow-xs">
                      <Loader2 className="size-3.5 animate-spin text-amber-600" />
                      Waiting for Counselor Approval...
                    </div>
                  ) : (
                    <Button
                      onClick={() => joinMutation.mutate(s._id)}
                      disabled={joinMutation.isPending}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl py-2.5 text-xs shadow-md gap-2 active:scale-[0.98] transition-transform"
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
