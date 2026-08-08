import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, TrendingUp, Star, Video, Brain, ChevronRight, Plus, Minus, LogOut, MessageCircle, Shield, Loader2, FileText, Heart, Smile, Sparkles, BookOpen, AlertCircle, Building2, Users } from 'lucide-react';
import API from '@/lib/api';
import { Button } from '@/components/ui/button';
import { UserButton, useClerk, useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { openSubscriptionCheckout } from "@/lib/razorpay";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export const Route = createFileRoute('/therapist/dashboard')({ component: TherapistDashboard });

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_SLOTS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const formatSlotDisplay = (slot: string) => {
  const [hourStr, minStr] = slot.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minStr} ${ampm}`;
};

function riskBadge(level: string) {
  const map: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
    unknown: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${map[level] ?? map.unknown}`}>
      {level}
    </span>
  );
}

function moodColor(score: number) {
  if (score <= 3) return 'oklch(0.65 0.18 25)';
  if (score <= 5) return 'oklch(0.78 0.14 70)';
  if (score <= 7) return 'oklch(0.78 0.13 130)';
  return 'oklch(0.68 0.14 160)';
}

function TherapistDashboard() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'schedule' | 'availability' | 'earnings' | 'profile' | 'subscription' | 'invitations' | 'organization' | 'reports'>('schedule');
  const [briefBookingId, setBriefBookingId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [viewJournalsBookingId, setViewJournalsBookingId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ day: number; slots: string[] }[]>(
    DAYS.map((_, day) => ({ day, slots: day >= 1 && day <= 5 ? ['10:00', '14:00', '16:00'] : [] }))
  );
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('bar');
  const [chartMetric, setChartMetric] = useState<'gross' | 'net'>('net');
  const [chartColor, setChartColor] = useState<string>('#0d9488'); // Teal-600 default
  const [chartLimit, setChartLimit] = useState<string>('all');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const COLORS = [
    { name: 'Teal', value: '#0d9488' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#f43f5e' }
  ];

  const { data: meData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => API.auth.me(),
    enabled: !!isLoaded && !!isSignedIn,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get(),
    enabled: !!isLoaded && !!isSignedIn,
  });

  const hasActiveSub = subscriptionData?.subscription?.status === 'active';
  const isSuperAdmin = meData?.role === 'super_admin';
  const isOrgLinked = !!meData?.orgId;
  const subRequired = !isSuperAdmin && !hasActiveSub;

  const upgradeMutation = useMutation({
    mutationFn: (planId: string) =>
      API.subscription.upgrade({ tier: planId as "mann_shanti" | "apna_therapist" }),
    onSuccess: async (data, variables) => {
      setUpgrading(null);
      if (data.subscriptionId) {
        try {
          const planName = plans.find((p: any) => p._id === variables)?.name || "Premium Plan";
          await openSubscriptionCheckout({
            subscriptionId: data.subscriptionId,
            planName,
            userEmail: meData?.therapistProfile?.email || meData?.email || "",
            onSuccess: () => {
              qc.invalidateQueries({ queryKey: ["therapist-stats"] });
              qc.invalidateQueries({ queryKey: ["auth-me"] });
              toast.success("Subscription activated successfully!");
            },
            onCancel: () => {
              qc.invalidateQueries({ queryKey: ["therapist-stats"] });
              toast.info("Payment cancelled");
            }
          });
        } catch (err: any) {
          toast.error(err.message || "Failed to launch Razorpay checkout");
        }
      } else if (data.shortUrl) {
        window.open(data.shortUrl, "_blank");
        toast.success("Redirecting to payment…");
      } else {
        qc.invalidateQueries({ queryKey: ["therapist-stats"] });
        toast.success("Subscription activated!");
      }
    },
    onError: (e: Error) => {
      setUpgrading(null);
      toast.error(e.message);
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => API.subscription.sync(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      qc.invalidateQueries({ queryKey: ["therapist-stats"] });
      qc.invalidateQueries({ queryKey: ["therapist-bookings"] });
      toast.success(data.message || "Subscription status synced successfully!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const demoActivateMutation = useMutation({
    mutationFn: () => API.subscription.demoActivate(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      qc.invalidateQueries({ queryKey: ["therapist-stats"] });
      qc.invalidateQueries({ queryKey: ["therapist-bookings"] });
      toast.success("Subscription activated (Dev Mode)!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['therapist-stats'],
    queryFn: () => API.therapist.meStats(),
    enabled: !subRequired,
    retry: false,
  });

  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['therapist-bookings'],
    queryFn: () => API.therapist.meBookings(),
    refetchInterval: 300000,
    enabled: !subRequired,
    retry: false,
  });

  const requestJournalMutation = useMutation({
    mutationFn: (bookingId: string) => API.booking.requestJournal(bookingId),
    onSuccess: () => {
      toast.success('Journal access requested successfully');
      refetchBookings();
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Failed to request journal access');
    },
  });

  const { data: sharedJournals, isLoading: loadingJournals } = useQuery({
    queryKey: ['shared-journals', viewJournalsBookingId],
    queryFn: () => API.booking.getSharedJournals(viewJournalsBookingId!),
    enabled: !!viewJournalsBookingId,
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => API.plan.getAll('therapist'),
  });
  const plans = plansData?.plans || [];

  const { data: briefData, isLoading: briefLoading } = useQuery({
    queryKey: ['ai-brief', briefBookingId],
    queryFn: () => API.booking.getAiBrief(briefBookingId!),
    enabled: !!briefBookingId,
  });

  const { data: sharedReportsData, isLoading: sharedReportsLoading } = useQuery({
    queryKey: ['therapist-shared-reports'],
    queryFn: () => API.therapist.sharedReports(),
    enabled: tab === 'reports',
  });

  const { data: reportDetailData, isLoading: reportDetailLoading } = useQuery({
    queryKey: ['shared-report-detail', selectedReportId],
    queryFn: () => API.therapist.sharedReportDetail(selectedReportId!),
    enabled: !!selectedReportId,
  });

  const availabilityMutation = useMutation({
    mutationFn: () => API.therapist.updateAvailability({ availability }),
    onSuccess: () => toast.success('Availability saved'),
    onError: (e: Error) => toast.error(e.message),
  });

  const profileMutation = useMutation({
    mutationFn: (data: any) => API.therapist.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated');
      qc.invalidateQueries({ queryKey: ['therapist-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: invData, refetch: refetchInvitations } = useQuery({
    queryKey: ['therapist-invitations'],
    queryFn: () => API.therapist.invitations(),
    enabled: tab === 'invitations',
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accepted' | 'rejected' }) =>
      API.therapist.respondToInvitation(id, { action }),
    onSuccess: (_, { action }) => {
      toast.success(`Invitation ${action}`);
      refetchInvitations();
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      if (action === 'accepted') setTab('organization');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveOrgMutation = useMutation({
    mutationFn: () => API.therapist.leaveOrg(),
    onSuccess: () => {
      toast.success("Successfully left organization");
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      qc.invalidateQueries({ queryKey: ['therapist-invitations'] });
      setTab('schedule');
    },
    onError: (e: Error) => toast.error(e.message || "Failed to leave organization"),
  });

  const { data: membersData } = useQuery({
    queryKey: ['org-members'],
    queryFn: () => API.org.members(),
    enabled: tab === 'organization' && isOrgLinked,
  });

  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberDetail, setMemberDetail] = useState<any>(null);
  const [memberLoading, setMemberLoading] = useState(false);

  // Authentication & Loading Guard (MUST be after all hooks to prevent React Error #310)
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="size-10 rounded-full bg-teal-600 animate-pulse" />
      </div>
    );
  }

  if (!isSignedIn) {
    navigate({ to: '/sign-in', replace: true });
    return null;
  }

  const handleViewMember = async (member: any) => {
    setSelectedMember(member);
    setMemberLoading(true);
    try {
      const res = await API.org.userDataForOrg(member.id);
      setMemberDetail(res);
    } catch {
      setMemberDetail(null);
    } finally {
      setMemberLoading(false);
    }
  };

  const profile = statsData?.profile;
  const stats = statsData?.stats;
  const bookings: any[] = bookingsData?.bookings ?? [];
  const revenueByMonth = bookingsData?.revenueByMonth ?? {};
  
  const chartData = Object.entries(revenueByMonth)
    .map(([monthKey, amount]) => {
      const [year, month] = monthKey.split('-');
      const date = new Date(Number(year), Number(month) - 1, 1);
      const name = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      return {
        key: monthKey,
        name,
        gross: Number(amount),
        net: Math.round(Number(amount) * 0.70),
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  const filteredChartData = chartLimit === 'all' 
    ? chartData 
    : chartData.slice(-Number(chartLimit));

  const [profileForm, setProfileForm] = useState({
    bio: '',
    fee: 1500,
    specializations: '',
    introVideoUrl: '',
    email: '',
    website: '',
    phone: '',
    openToCollaboration: false,
  });

  useEffect(() => {
    if (meData) {
      const status = meData.therapistProfile?.verificationStatus;
      if (!meData.therapistProfile || status !== 'verified') {
        setVerificationStatus(status || 'not_started');
      } else {
        setVerificationStatus('verified');
      }
    }
  }, [meData]);


  useEffect(() => {
    if (profile) {
      setProfileForm({
        bio: profile.bio || '',
        fee: profile.sessionFee || 1500,
        specializations: profile.specializations?.join(', ') || '',
        introVideoUrl: profile.introVideoUrl || '',
        email: profile.email || '',
        website: profile.website || '',
        phone: profile.phone || '',
        openToCollaboration: !!profile.openToCollaboration,
      });
      if (profile.availability && profile.availability.length > 0) {
        setAvailability(profile.availability);
      }
    }
  }, [profile]);

  const today = new Date().toDateString();
  const todayBookings = bookings.filter((b) => new Date(b.slot).toDateString() === today && b.status === 'confirmed');
  const upcomingBookings = bookings.filter((b) => new Date(b.slot) > new Date() && b.status === 'confirmed')
    .sort((a, b) => new Date(a.slot).getTime() - new Date(b.slot).getTime());

  const canJoin = (slot: string) => {
    const diff = new Date(slot).getTime() - Date.now();
    return diff <= 15 * 60 * 1000 && diff > -2 * 60 * 60 * 1000;
  };

  const toggleSlot = (day: number, slot: string) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.day !== day ? d : {
          ...d,
          slots: d.slots.includes(slot) ? d.slots.filter((s) => s !== slot) : [...d.slots, slot].sort(),
        }
      )
    );
  };

  if (verificationStatus && verificationStatus !== 'verified') {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Blurred background representation of the dashboard */}
        <div className="absolute inset-0 pointer-events-none opacity-40 filter blur-xl select-none" aria-hidden="true">
          <div className="max-w-5xl mx-auto h-full px-4 py-8 space-y-8">
            <div className="h-20 bg-white rounded-3xl" />
            <div className="h-40 bg-white rounded-3xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-64 bg-white rounded-3xl" />
              <div className="h-64 bg-white rounded-3xl" />
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-lg w-full text-center border border-slate-200 z-10 relative">
          
          <div className="grid size-20 place-items-center rounded-3xl bg-teal-50 text-teal-600 mx-auto mb-6 shadow-inner border border-teal-100">
            {verificationStatus === 'pending' ? <Clock className="size-10" /> : <Shield className="size-10" />}
          </div>
          
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            {verificationStatus === 'pending' ? 'Application Under Review' : 'Account Approval Required'}
          </h1>
          
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            {verificationStatus === 'pending' 
              ? "We are currently reviewing your documents and video introduction. You'll be notified as soon as you're approved to start taking sessions."
              : "To maintain a high quality of care, all therapists must be verified before they can start working. Please fill out the verification form to begin."}
          </p>
          
          <div className="space-y-3">
            {verificationStatus === 'pending' ? (
              <Button onClick={() => window.location.reload()} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-bold shadow-md text-base">
                Refresh Status
              </Button>
            ) : (
              <Button onClick={() => navigate({ to: '/therapist/onboarding' })} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-12 font-bold shadow-md text-base transition-transform active:scale-[0.98]">
                Fill Verification Form
              </Button>
            )}
            <Button variant="ghost" onClick={() => signOut({ redirectUrl: '/' })} className="w-full rounded-xl h-12 font-bold text-red-500 hover:text-red-700 hover:bg-red-50 transition">
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold text-xl shadow-md">
              {profile?.name?.charAt(0) ?? 'T'}
            </div>
            <div>
              <p className="font-display font-bold text-lg text-slate-900 tracking-tight">{profile?.name ?? 'Therapist'}</p>
              <div className="flex items-center gap-2">
                <Star className="size-3 text-amber-400 fill-amber-400" />
                <span className="text-xs text-slate-500">{profile?.rating?.toFixed(1) ?? '–'} · {stats?.completedSessions ?? 0} sessions</span>
                {profile?.verified && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">Therapist ✓</span>}
              </div>
            </div>
          </div>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: { userButtonAvatarBox: "size-8" }
            }}
          />
        </div>
      </header>

      {/* Stats Bar */}
      {!statsLoading && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-white shadow-inner">
          <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-4 gap-4">
            {[
              { label: "Today's sessions", value: todayBookings.length },
              { label: 'This month', value: stats?.monthBookings ?? 0 },
              { label: 'Month earned', value: `₹${(stats?.monthEarned ?? 0).toLocaleString('en-IN')}` },
              { label: 'Payout (70%)', value: `₹${(stats?.nextPayout ?? 0).toLocaleString('en-IN')}` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-teal-100/80 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Nav */}
      <div className="sticky top-[73px] z-20 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex gap-2 overflow-x-auto">
          {(['schedule', 'availability', 'earnings', 'profile', 'subscription', 'invitations', 'organization', 'reports'] as const)
            .filter(t => (t !== 'subscription' || !isOrgLinked) && (t !== 'organization' || isOrgLinked))
            .map((t) => {
            const disabled = subRequired && t !== 'subscription' && t !== 'invitations' && t !== 'profile';
            return (
              <button key={t} 
                onClick={() => !disabled && setTab(t)}
                disabled={disabled}
                className={`px-5 py-3.5 text-sm font-bold capitalize border-b-2 transition relative whitespace-nowrap ${
                  tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {t === 'reports' ? 'Shared Reports' : t}
                {disabled && (
                  <Shield className="size-3 absolute top-2 right-2 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {subRequired && tab !== 'subscription' && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-amber-100 text-amber-600 mx-auto shadow-sm">
              <Shield className="size-8" />
            </div>
            <h2 className="text-2xl font-bold text-amber-900">Subscription Required</h2>
            <p className="text-amber-700 max-w-md mx-auto font-medium">
              {isOrgLinked 
                ? "Your organization's subscription is currently inactive. Please contact your organization administrator to restore access."
                : "As an independent therapist, you need an active subscription to access your schedule, bookings, and profile."}
            </p>
            {!isOrgLinked && (
              <Button onClick={() => setTab('subscription')} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                View Subscription Plans
              </Button>
            )}
          </div>
        )}

        {!subRequired && tab === 'schedule' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            

            {/* <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl text-indigo-600 shadow-sm border border-indigo-50">
                  <Video className="size-6" />
                </div>
                <div>
                  <p className="font-display font-bold text-indigo-900 text-lg">Test Video Session</p>
                  <p className="text-sm font-medium text-indigo-700/80 mt-0.5">Try out the live video room</p>
                </div>
              </div>
              <Link to="/session/demo-room" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition">
                Join Demo
              </Link>
            </div> */}

            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Upcoming Sessions</h2>
            {bookingsLoading && <div className="h-32 rounded-3xl bg-slate-200 animate-pulse border border-slate-100" />}
            {upcomingBookings.length === 0 && !bookingsLoading && (
              <p className="text-slate-500 text-sm font-medium">No upcoming sessions scheduled.</p>
            )}
            {upcomingBookings.slice(0, 10).map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{delay: i*0.05}}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 font-bold border border-teal-100/50">
                      #{b.id?.slice(-3) ?? '?'}
                    </div>
                    <div>
                      <p className="font-display font-bold text-slate-900 text-lg">Client (Anonymous)</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="size-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">
                          {new Date(b.slot).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(b.slot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-teal-700">₹{b.fee}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => setBriefBookingId(b.id)}
                    className="flex items-center gap-2 text-sm font-bold text-teal-700 bg-teal-50 px-4 py-2.5 rounded-xl hover:bg-teal-100 transition border border-teal-100">
                    <Brain className="size-4" /> AI Brief
                  </button>

                  {(!b.journalShareState || b.journalShareState === 'none') && (
                    <button
                      disabled={requestJournalMutation.isPending}
                      onClick={() => requestJournalMutation.mutate(b.id)}
                      className="flex items-center gap-2 text-sm font-bold text-amber-700 bg-amber-50 px-4 py-2.5 rounded-xl hover:bg-amber-100 transition border border-amber-100 disabled:opacity-50"
                    >
                      <BookOpen className="size-4" />
                      {requestJournalMutation.isPending && requestJournalMutation.variables === b.id ? "Requesting..." : "Request Journal"}
                    </button>
                  )}

                  {b.journalShareState === 'requested' && (
                    <span className="flex items-center gap-2 text-sm font-semibold text-amber-600 bg-amber-50/50 px-4 py-2.5 rounded-xl border border-amber-100/50">
                      <Clock className="size-4" /> Pending Consent
                    </span>
                  )}

                  {b.journalShareState === 'approved' && (
                    <button
                      onClick={() => setViewJournalsBookingId(b.id)}
                      className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition border border-emerald-100"
                    >
                      <BookOpen className="size-4" /> View Journal
                    </button>
                  )}

                  {b.journalShareState === 'declined' && (
                    <span className="flex items-center gap-2 text-sm font-semibold text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
                      Declined Access
                    </span>
                  )}

                  {canJoin(b.slot) ? (
                    <button onClick={() => navigate({ to: `/session/${b.id}` })}
                      className="flex items-center gap-2 text-sm font-bold text-white bg-teal-600 px-4 py-2.5 rounded-xl hover:bg-teal-700 transition shadow-md ml-auto">
                      <Video className="size-4" /> Start Session
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 py-2.5 bg-slate-50 px-4 rounded-xl border border-slate-100 ml-auto">Available 15 min before</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* AVAILABILITY TAB */}
        {tab === 'availability' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 flex justify-between items-end">
              <span>Week-View Calendar</span>
              <Button onClick={() => availabilityMutation.mutate()} disabled={availabilityMutation.isPending} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 px-6 font-bold shadow-md">
                {availabilityMutation.isPending ? 'Saving…' : 'Save Availability'}
              </Button>
            </h2>
            <p className="text-sm font-medium text-slate-500">Click a slot to toggle availability. Green slots are open for booking.</p>
            
            <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto max-h-[600px] overflow-y-auto p-6 shadow-sm hover:shadow-md transition">
              <div className="min-w-[600px] grid grid-cols-8 gap-3">
                <div className="space-y-3">
                  <div className="sticky top-0 bg-white pb-3 border-b border-slate-100 mb-3 h-[32px] z-10" />
                  {DEFAULT_SLOTS.map(s => (
                    <div key={s} className="h-11 flex items-center justify-end pr-3 text-xs font-bold text-slate-400 uppercase tracking-wide">{formatSlotDisplay(s)}</div>
                  ))}
                </div>
                {DAYS.map((day, i) => (
                  <div key={i} className="space-y-3">
                    <div className="sticky top-0 bg-white text-center font-display font-bold text-sm text-slate-700 pb-3 border-b border-slate-100 mb-3 z-10">{day}</div>
                    {DEFAULT_SLOTS.map((slot) => {
                      const active = availability.find((d) => d.day === i)?.slots.includes(slot);
                      return (
                        <button key={slot} onClick={() => toggleSlot(i, slot)}
                          className={`w-full h-11 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            active ? 'bg-teal-50 text-teal-700 border-2 border-teal-500 shadow-inner' : 'bg-slate-50/50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                          }`}>
                          {active ? 'Available' : '-'}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* EARNINGS TAB */}
        {tab === 'earnings' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Earnings Summary</h2>
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: 'Total Earned', value: `₹${(stats?.totalEarned ?? 0).toLocaleString('en-IN')}` },
                { label: 'This Month', value: `₹${(stats?.monthEarned ?? 0).toLocaleString('en-IN')}` },
                { label: 'Next Payout (70%)', value: `₹${(stats?.nextPayout ?? 0).toLocaleString('en-IN')}` },
                { label: 'Total Sessions', value: stats?.completedSessions ?? 0 },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-sm hover:shadow-md transition">
                  <p className="font-display text-3xl font-bold text-teal-700">{s.value}</p>
                  <p className="text-sm font-medium text-slate-500 mt-2">{s.label}</p>
                </div>
              ))}
            </div>
            {/* <div className="bg-amber-50/50 rounded-2xl border border-amber-200/50 p-5 text-sm font-medium text-amber-800">
              mymindtherapyfriend retains 30% platform fee. Payouts are processed on the 1st of every month via NEFT.
            </div> */}

            {/* Customizable Revenue Chart Widget */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-lg">Earnings Analytics</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Visualize and customize your monthly earnings reports</p>
                </div>
                
                {/* Control Panel / ToolBar */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* Chart Type Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                    {(['bar', 'line', 'area'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setChartType(t)}
                        className={`px-2 py-1 rounded-md font-semibold transition capitalize ${
                          chartType === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Metric Toggle */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setChartMetric('net')}
                      className={`px-2 py-1 rounded-md font-semibold transition ${
                        chartMetric === 'net' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Net (70%)
                    </button>
                    <button
                      onClick={() => setChartMetric('gross')}
                      className={`px-2 py-1 rounded-md font-semibold transition ${
                        chartMetric === 'gross' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Gross
                    </button>
                  </div>

                  {/* Time Limit Selector */}
                  <select
                    value={chartLimit}
                    onChange={(e) => setChartLimit(e.target.value)}
                    className="bg-slate-100 text-slate-700 font-semibold px-2 py-1.5 rounded-lg border-none focus:outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="6">Last 6 Months</option>
                    <option value="12">Last 12 Months</option>
                  </select>

                  {/* Theme Color Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-lg">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        title={c.name}
                        onClick={() => setChartColor(c.value)}
                        className={`size-4 rounded-full border transition-all ${
                          chartColor === c.value ? 'scale-110 border-slate-600 ring-1 ring-slate-400' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>

                  {/* Grid Lines Toggle */}
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition border ${
                      showGrid ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Grid Lines
                  </button>
                </div>
              </div>

              {/* Chart Render Area */}
              <div className="h-[300px] w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                {filteredChartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                    No transaction history available to plot.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <LineChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />}
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="₹" />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`₹${value}`, chartMetric === 'net' ? 'Net Payout' : 'Gross Income']}
                        />
                        <Line type="monotone" dataKey={chartMetric} stroke={chartColor} strokeWidth={3} activeDot={{ r: 6 }} />
                      </LineChart>
                    ) : chartType === 'area' ? (
                      <AreaChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />}
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="₹" />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`₹${value}`, chartMetric === 'net' ? 'Net Payout' : 'Gross Income']}
                        />
                        <Area type="monotone" dataKey={chartMetric} stroke={chartColor} fillOpacity={1} fill="url(#colorUv)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <BarChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />}
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="₹" />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`₹${value}`, chartMetric === 'net' ? 'Net Payout' : 'Gross Income']}
                        />
                        <Bar dataKey={chartMetric} fill={chartColor} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden mt-8 shadow-sm">
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 font-display font-bold text-slate-900">Recent Transactions</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold tracking-wider">
                    <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Session ID</th><th className="px-6 py-4">Gross Amount</th><th className="px-6 py-4">Commission (30%)</th><th className="px-6 py-4">Net Payout</th><th className="px-6 py-4">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings
                      .filter((b) => b.status === 'completed' || (b.status === 'confirmed' && b.paid))
                      .slice(0, 20)
                      .map((b) => {
                        const gross = b.fee ?? 0;
                        const commission = Math.round(gross * 0.30);
                        const net = gross - commission;
                        return (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 text-slate-500 font-medium">{new Date(b.slot).toLocaleDateString('en-IN')}</td>
                            <td className="px-6 py-4 text-slate-900 font-bold">#{b.id.slice(-5)}</td>
                            <td className="px-6 py-4 font-medium">₹{gross.toLocaleString('en-IN')}</td>
                            <td className="px-6 py-4 text-red-500 font-medium">-₹{commission.toLocaleString('en-IN')}</td>
                            <td className="px-6 py-4 font-bold text-teal-700">₹{net.toLocaleString('en-IN')}</td>
                            <td className="px-6 py-4">
                              {b.status === 'completed' ? (
                                <span className="bg-teal-50 border border-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">SETTLED</span>
                              ) : (
                                <span className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">PAID</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    }
                    {bookings.filter((b) => b.status === 'completed' || (b.status === 'confirmed' && b.paid)).length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-10 text-center font-medium text-slate-500">No completed transactions yet. Sessions will appear here once they are marked as completed or paid.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Profile Editor</h2>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-sm max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Intro Video URL (YouTube/Vimeo)</label>
                <input value={profileForm.introVideoUrl} onChange={e => setProfileForm(p => ({...p, introVideoUrl: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Email ID</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({...p, email: e.target.value}))} placeholder="dr.rajesh@example.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Personal Website</label>
                  <input type="url" value={profileForm.website} onChange={e => setProfileForm(p => ({...p, website: e.target.value}))} placeholder="https://drrajesh.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Phone Number</label>
                  <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} placeholder="+919999999999" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" />
                </div>
              </div>
              {/* <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Session Fee (₹)</label>
                <input type="number" min={0} value={profileForm.fee} onChange={e => {
                  let val = Number(e.target.value);
                  setProfileForm(p => ({...p, fee: val}));
                }} 
                onBlur={e => {
                  let val = Number(e.target.value);
                  if (val < 0) val = 0;
                  setProfileForm(p => ({...p, fee: val}));
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" />
              </div> */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Specialisations (comma separated)</label>
                <input value={profileForm.specializations} onChange={e => setProfileForm(p => ({...p, specializations: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Bio & Approach</label>
                <textarea rows={4} value={profileForm.bio} onChange={e => setProfileForm(p => ({...p, bio: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none transition" />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={profileForm.openToCollaboration} onChange={e => setProfileForm(p => ({...p, openToCollaboration: e.target.checked}))} className="size-4 text-teal-600 border-slate-350 rounded focus:ring-teal-500 cursor-pointer" />
                  <div>
                    <span className="block text-sm font-bold text-slate-700 group-hover:text-slate-900 transition">Open to Organization Collaboration</span>
                    <span className="block text-xs text-slate-400">Allow companies & organizations to send you linkage/affiliation requests.</span>
                  </div>
                </label>
              </div>
              <Button onClick={() => profileMutation.mutate(profileForm)} disabled={profileMutation.isPending} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-12 font-bold shadow-md">
                {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </motion.div>
        )}
        {/* SUBSCRIPTION TAB */}
        {tab === 'subscription' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Your Subscription</h2>
                <div className="flex items-center gap-3">
                  {/* {import.meta.env.DEV && !hasActiveSub && (
                    <Button
                      onClick={() => demoActivateMutation.mutate()}
                      disabled={demoActivateMutation.isPending}
                      variant="outline"
                      className="border-teal-500 text-teal-600 hover:bg-teal-50 rounded-xl"
                    >
                      {demoActivateMutation.isPending ? "Activating..." : "Dev: Bypass Payment"}
                    </Button>
                  )} */}
                  {subscriptionData?.subscription && (
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${
                      hasActiveSub ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {subscriptionData.subscription.plan} — {subscriptionData.subscription.status.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Banner if pending */}
              {subscriptionData?.subscription?.status === 'pending' && (
                <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 text-center space-y-4 max-w-md mx-auto shadow-sm">
                  <div className="flex items-center justify-center gap-2 text-amber-800">
                    <AlertCircle className="size-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-bold">
                      Payment Confirmation Pending
                    </p>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    If you have already paid via Razorpay, it might take a moment to activate. Click below to verify and sync your status instantly.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => syncMutation.mutate()} 
                      disabled={syncMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-5 rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {syncMutation.isPending ? "Syncing..." : "Sync Payment Status"}
                    </Button>
                    {/* {import.meta.env.DEV && (
                      <Button 
                        onClick={() => demoActivateMutation.mutate()} 
                        disabled={demoActivateMutation.isPending}
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100 font-semibold py-2 px-5 rounded-xl text-xs flex items-center justify-center gap-2"
                      >
                        {demoActivateMutation.isPending ? "Bypassing..." : "Demo: Bypass Payment"}
                      </Button>
                    )} */}
                  </div>
                </div>
              )}
              {hasActiveSub && (
                <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden mb-8">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield className="size-40" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-teal-100 font-bold uppercase tracking-widest text-sm mb-2">Active Plan</h3>
                    <p className="text-4xl font-display font-bold mb-6">{subscriptionData.subscription.plan}</p>
                    <div className="flex items-center gap-6 text-teal-50 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-5" />
                        Expires: {new Date(subscriptionData.subscription.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="size-5 text-amber-300 fill-amber-300" />
                        Premium Features Enabled
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Available Plans</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan: any) => {
                    const isCurrent = subscriptionData?.subscription?.plan === plan.name && hasActiveSub;
                    const isUpgrading = upgrading === plan._id && upgradeMutation.isPending;
                    return (
                      <div key={plan._id} className={`bg-white rounded-3xl border-2 p-8 flex flex-col shadow-sm transition hover:-translate-y-1 hover:shadow-md ${isCurrent ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200'}`}>
                        {isCurrent && (
                          <div className="bg-teal-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full self-start mb-4">
                            Active
                          </div>
                        )}
                        <h3 className="font-display text-2xl font-bold text-slate-900">{plan.name}</h3>
                        <div className="mt-3 text-4xl font-bold text-teal-700">₹{plan.price}<span className="text-sm font-bold text-slate-400">/{plan.durationMonths && plan.durationMonths > 1 ? ` ${plan.durationMonths} mo` : "mo"}</span></div>
                        <ul className="mt-8 mb-10 space-y-4 flex-1 text-sm font-medium text-slate-600">
                          {plan.features.map((f: string, i: number) => (
                              <li key={i} className="flex gap-3"><span className="text-teal-500 font-bold">✓</span> {f}</li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <Button disabled className="w-full rounded-xl h-12 font-bold bg-slate-100 text-slate-400">
                            ✓ Current Plan
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => {
                              setUpgrading(plan._id);
                              upgradeMutation.mutate(plan._id);
                            }}
                            disabled={isUpgrading}
                            variant="outline" 
                            className="w-full rounded-xl h-12 font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
                            {isUpgrading ? <><Loader2 className="size-4 animate-spin mr-2" /> Processing...</> : 'Upgrade'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          </motion.div>
        )}

        {tab === 'invitations' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Organization Invitations</h2>
            {invData?.invitations?.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
                <Shield className="size-12 mx-auto mb-4 text-slate-200" />
                <p className="font-medium">No pending invitations from organizations.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {invData?.invitations?.map((inv: any) => (
                  <div key={inv._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{inv.orgId?.name}</h3>
                        <p className="text-sm text-slate-500">{inv.orgId?.officialEmail}</p>
                        <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">{inv.orgId?.type}</p>
                      </div>
                      <div className="bg-teal-50 text-teal-600 p-2 rounded-xl">
                        <Building2 className="size-5" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => respondMutation.mutate({ id: inv._id, action: 'accepted' })}
                        disabled={respondMutation.isPending}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
                      >
                        Accept
                      </Button>
                      <Button 
                        onClick={() => respondMutation.mutate({ id: inv._id, action: 'rejected' })}
                        disabled={respondMutation.isPending}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'organization' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 h-[600px] flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Linked Organization Members</h2>
              <Button
                onClick={() => {
                  if (confirm("Are you sure you want to leave your currently linked organization?")) {
                    leaveOrgMutation.mutate();
                  }
                }}
                disabled={leaveOrgMutation.isPending}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl flex items-center gap-1.5 text-xs px-3 py-1.5"
              >
                <LogOut className="size-3.5" /> Leave Organization
              </Button>
            </div>
            <div className="flex gap-6 flex-1 overflow-hidden">
              {/* Left side list */}
              <div className="w-1/3 bg-white rounded-3xl border border-slate-200 flex flex-col shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 font-bold text-slate-900 flex items-center justify-between">
                  <span>Members ({membersData?.members?.length || 0})</span>
                </div>
                <div className="overflow-y-auto flex-1">
                  {membersData?.members?.map((m: any) => (
                    <button key={m.id} onClick={() => handleViewMember(m)}
                      className={`w-full text-left p-4 border-b border-slate-100 transition hover:bg-slate-50 flex items-center justify-between ${selectedMember?.id === m.id ? 'bg-teal-50 border-teal-100' : ''}`}>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{m.department}</p>
                      </div>
                      <ChevronRight className={`size-4 ${selectedMember?.id === m.id ? 'text-teal-600' : 'text-slate-400'}`} />
                    </button>
                  ))}
                  {(!membersData?.members || membersData.members.length === 0) && (
                    <div className="p-8 text-center text-sm text-slate-500">No members found in your organization.</div>
                  )}
                </div>
              </div>

              {/* Right side detail panel */}
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 overflow-y-auto">
                {memberLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="size-8 animate-spin mb-4 text-teal-600" /> Loading member data...
                  </div>
                ) : memberDetail ? (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-display font-bold text-slate-900">{memberDetail.user.name}</h2>
                      <p className="text-slate-500 mt-1 font-medium">Department: {memberDetail.user.department}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Avg Mood</p>
                        <p className="text-3xl font-bold text-teal-700">{memberDetail.wellness.avgMood ?? '—'}</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sessions</p>
                        <p className="text-3xl font-bold text-teal-700">{memberDetail.wellness.sessionCount}</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Journals</p>
                        <p className="text-3xl font-bold text-teal-700">{memberDetail.wellness.journalCount}</p>
                      </div>
                    </div>

                    {memberDetail.wellness.moodHistory.length > 0 && (
                      <div>
                        <h3 className="font-display font-bold text-slate-900 mb-4">Recent Mood Check-ins</h3>
                        <div className="space-y-3">
                          {memberDetail.wellness.moodHistory.slice(0, 5).map((m: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <div className="size-12 rounded-2xl flex items-center justify-center text-xl font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                {m.score}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">{m.note || 'No note provided'}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{new Date(m.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center space-y-4">
                    <div className="size-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
                      <Users className="size-10" />
                    </div>
                    <p className="font-medium max-w-xs">Select a member from the list to view their wellness engagement overview.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'reports' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Shared Wellness Reports</h2>
            <p className="text-sm font-medium text-slate-500">Wellness report logs shared by your clients.</p>

            {sharedReportsLoading ? (
              <div className="h-32 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
            ) : (sharedReportsData?.reports ?? []).length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
                <FileText className="size-12 mx-auto mb-4 text-slate-200" />
                <p className="font-medium">No shared wellness reports yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {(sharedReportsData?.reports ?? []).map((r: any) => (
                  <div key={r.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{r.userName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{r.userPhoneMasked || 'Anonymous User'}</p>
                        <div className="flex gap-1.5 mt-2">
                          <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {r.period}
                          </span>
                          <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                            Shared: {new Date(r.sharedAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <div className="bg-teal-50 text-teal-600 p-2.5 rounded-2xl border border-teal-100/50">
                        <FileText className="size-5" />
                      </div>
                    </div>
                    {r.notes && (
                      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 italic mb-4 border-l-2 border-teal-500/30">
                        "{r.notes}"
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedReportId(r.id)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2.5 text-sm font-bold shadow-sm transition active:scale-[0.98]"
                    >
                      View Full Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* AI Brief Modal */}
      <AnimatePresence>
        {briefBookingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={() => setBriefBookingId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Brain className="size-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900">AI Pre-Session Brief</h3>
                </div>
                <button onClick={() => setBriefBookingId(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
              </div>

              {briefLoading && (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />)}
                </div>
              )}

              {briefData && (
                <div className="p-6 space-y-6">
                  {/* Risk level */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">Risk Level:</span>
                    {riskBadge(briefData.riskLevel)}
                    {briefData.avgMood && (
                      <span className="text-sm text-slate-500">Avg mood: {briefData.avgMood}/10</span>
                    )}
                  </div>

                  {/* Client Profile / Onboarding */}
                  {(briefData.clientName || briefData.onboardingDetails) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Onboarding Profile</p>
                      <p className="text-sm font-semibold text-slate-800">Name: {briefData.clientName}</p>
                      {briefData.onboardingDetails && (
                        <>
                          {briefData.onboardingDetails.moodScore && (
                            <p className="text-sm text-slate-600">Onboarding Mood Score: <span className="font-semibold">{briefData.onboardingDetails.moodScore}/10</span></p>
                          )}
                          {briefData.onboardingDetails.primaryNeed && (
                            <p className="text-sm text-slate-600">Primary Goal/Need: <span className="font-semibold">{briefData.onboardingDetails.primaryNeed}</span></p>
                          )}
                          {briefData.onboardingDetails.concerns?.length > 0 && (
                            <div className="text-sm text-slate-600">
                              <span>Main Concerns:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {briefData.onboardingDetails.concerns.map((c: string, idx: number) => (
                                  <span key={idx} className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Groq Summary */}
                  {briefData.groqSummary && (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">AI Summary</p>
                      <p className="text-sm text-teal-900 whitespace-pre-line">{briefData.groqSummary}</p>
                    </div>
                  )}

                  {/* 7-day mood chart */}
                  {briefData.moodChart?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">7-Day Mood</p>
                      <div className="flex items-end gap-1 h-16">
                        {briefData.moodChart.map((m: any, i: number) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-sm bg-teal-400"
                              style={{ height: `${(m.score / 10) * 56}px`, minHeight: 4 }} />
                            <span className="text-[9px] text-slate-400">
                              {new Date(m.date).getDate()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent journals */}
                  {briefData.recentJournals?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Recent Journal Excerpts</p>
                      <div className="space-y-2">
                        {briefData.recentJournals.map((j: any, i: number) => (
                          <div key={i} className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">{new Date(j.date).toLocaleDateString('en-IN')}</p>
                            <p className="text-sm text-slate-700 italic">"{j.excerpt}…"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Journal View Modal */}
      <AnimatePresence>
        {viewJournalsBookingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={() => setViewJournalsBookingId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-slate-50 rounded-[2rem] shadow-2xl max-h-[80vh] flex flex-col overflow-hidden border border-slate-200">
              <div className="sticky top-0 bg-white border-b border-slate-200/60 px-6 py-5 flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-700">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg">Shared CBT Journal Entries</h3>
                    <p className="text-xs text-slate-500">Client's reflections from the 7 days prior to the session</p>
                  </div>
                </div>
                <button onClick={() => setViewJournalsBookingId(null)} className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {loadingJournals && (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200/60 space-y-3">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-5/6" />
                      </div>
                    ))}
                  </div>
                )}

                {!loadingJournals && (!sharedJournals || sharedJournals.length === 0) && (
                  <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-200/60 p-6 space-y-2">
                    <p className="text-slate-500 font-semibold">No journal entries found</p>
                    <p className="text-xs text-slate-400">The client didn't record any journal entries in the week leading up to this session.</p>
                  </div>
                )}

                {!loadingJournals && sharedJournals && sharedJournals.map((j: any) => (
                  <div key={j._id || j.id} className="bg-white rounded-[2rem] p-5 border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Calendar className="size-3.5" />
                        {new Date(j.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {j.moodScore && (
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-100" style={{ color: moodColor(j.moodScore) }}>
                          <Smile className="size-3.5" /> Mood: {j.moodScore}/10
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {j.prompt && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prompt / Trigger</p>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{j.prompt}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Situation</p>
                          <p className="text-xs text-slate-800 leading-relaxed mt-1 whitespace-pre-wrap">{j.situation}</p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Automatic Thoughts</p>
                          <p className="text-xs text-slate-800 leading-relaxed mt-1 whitespace-pre-wrap">{j.thought}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emotions / Feelings</p>
                          <p className="text-xs text-slate-800 leading-relaxed mt-1 whitespace-pre-wrap">{j.feeling}</p>
                        </div>
                        <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 shadow-sm">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Reframed Thoughts</p>
                          <p className="text-xs text-emerald-950 leading-relaxed mt-1 whitespace-pre-wrap">{j.reframe}</p>
                        </div>
                      </div>

                      {j.aiResponse && (
                        <div className="bg-teal-50/50 border border-teal-100/50 rounded-2xl p-3.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-teal-800">
                            <Sparkles className="size-3.5" />
                            <p className="text-[10px] font-bold uppercase tracking-wider">Manas AI Insights</p>
                          </div>
                          <p className="text-xs text-teal-900 leading-relaxed whitespace-pre-wrap">{j.aiResponse}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Report View Modal */}
      <AnimatePresence>
        {selectedReportId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={() => setSelectedReportId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#FCFAF7] rounded-[2rem] shadow-2xl max-h-[85vh] overflow-y-auto border border-slate-200">
              
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-[2rem] z-10">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 font-display text-lg">Shared Wellness Report</h3>
                </div>
                <button onClick={() => setSelectedReportId(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
              </div>

              {reportDetailLoading && (
                <div className="p-8 space-y-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />)}
                </div>
              )}

              {reportDetailData && (
                <div className="p-6 md:p-8 space-y-6">
                  {/* Client Info Header */}
                  <div className="flex justify-between items-start border-b border-teal-500/20 pb-5">
                    <div>
                      <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Shared by Client</span>
                      <h4 className="font-display text-2xl font-bold text-slate-900 mt-1">{reportDetailData.user?.fullName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{reportDetailData.user?.phoneMasked || 'Anonymous Patient'}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        {reportDetailData.period} Report
                      </span>
                      <p className="text-slate-400 text-[10px] mt-2 font-medium">
                        Shared on {new Date(reportDetailData.sharedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Client Notes if any */}
                  {reportDetailData.notes && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Message from Client</span>
                      <p className="text-sm text-slate-600 italic">"{reportDetailData.notes}"</p>
                    </div>
                  )}

                  {/* Onboarding info */}
                  {reportDetailData.user?.onboarding && (
                    <div className="bg-teal-50/40 border border-teal-100 rounded-2xl p-4 text-xs space-y-2">
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Client General Profile</span>
                      {reportDetailData.user.onboarding.primaryNeed && (
                        <p className="text-slate-700">Primary Goal: <span className="font-semibold">{reportDetailData.user.onboarding.primaryNeed}</span></p>
                      )}
                      {reportDetailData.user.onboarding.concerns?.length > 0 && (
                        <div>
                          <span className="text-slate-700">Key concerns:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {reportDetailData.user.onboarding.concerns.map((c: string, idx: number) => (
                              <span key={idx} className="bg-teal-100/60 text-teal-800 px-2 py-0.5 rounded-full font-medium text-[10px]">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mood Section */}
                  <div className="space-y-3">
                    <h5 className="font-display font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Heart className="size-4 text-teal-600" /> Mood check-ins</span>
                      {reportDetailData.avgMood && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          Avg: {reportDetailData.avgMood}/10
                        </span>
                      )}
                    </h5>
                    {reportDetailData.moods?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No mood check-ins logged during this period.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {reportDetailData.moods.map((m: any) => (
                          <div key={m.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex flex-col justify-between space-y-1.5 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-[10px] font-medium">
                                {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="size-5 rounded-full text-white font-bold grid place-items-center text-[10px]" style={{ backgroundColor: moodColor(m.score) }}>
                                {m.score}
                              </span>
                            </div>
                            {m.note && <p className="text-slate-600 italic line-clamp-2">"{m.note}"</p>}
                            {m.tags && m.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {m.tags.slice(0, 2).map((t: string, idx: number) => (
                                  <span key={idx} className="bg-slate-100 text-[9px] px-1 rounded text-slate-600 font-medium">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CBT Journals */}
                  <div className="space-y-4">
                    <h5 className="font-display font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                      <Smile className="size-4 text-teal-600" /> CBT Journal Reflections
                    </h5>
                    {reportDetailData.journals?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No CBT journal entries created during this period.</p>
                    ) : (
                      <div className="space-y-4">
                        {reportDetailData.journals.map((j: any) => (
                          <div key={j.id} className="p-4 bg-white border border-slate-200 rounded-2xl text-xs space-y-3 shadow-sm">
                            <div className="flex justify-between items-start">
                              <h6 className="font-bold text-slate-800 text-sm leading-tight">{j.prompt}</h6>
                              <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">
                                {new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                              <div>
                                <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Situation</span>
                                <p className="text-slate-600">{j.situation}</p>
                              </div>
                              <div>
                                <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Thought</span>
                                <p className="text-slate-600">{j.thought}</p>
                              </div>
                              <div>
                                <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Feeling</span>
                                <p className="text-slate-600">{j.feeling}</p>
                              </div>
                              <div>
                                <span className="font-bold text-teal-600 uppercase text-[9px] block mb-0.5 font-sans">Reframe</span>
                                <p className="text-teal-700 font-semibold">{j.reframe}</p>
                              </div>
                            </div>
                            {j.aiResponse && (
                              <div className="mt-2 p-3 rounded-xl bg-[#FCFAF7] border border-teal-100">
                                <span className="font-bold uppercase text-[9px] text-teal-600 flex items-center gap-1 mb-1">
                                  <Sparkles className="size-3" /> Manas Response
                                </span>
                                <p className="text-slate-600 italic">"{j.aiResponse}"</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Chats */}
                  <div className="space-y-3">
                    <h5 className="font-display font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                      <Sparkles className="size-4 text-teal-600" /> Manas AI Chat Activity
                    </h5>
                    {reportDetailData.chats?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No AI conversation activity logged during this period.</p>
                    ) : (
                      <div className="space-y-2">
                        {reportDetailData.chats.map((c: any, idx: number) => (
                          <div key={c.sessionId || idx} className="flex justify-between items-center bg-white p-3.5 border border-slate-200 rounded-xl text-xs shadow-sm">
                            <div className="space-y-0.5 max-w-[80%]">
                              <span className="text-[10px] font-bold text-slate-400">Session ID: #{c.sessionId?.slice(-6) || 'N/A'}</span>
                              <p className="text-slate-700 font-medium line-clamp-1">{c.summary}</p>
                            </div>
                            <div className="text-right text-[10px]">
                              <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[8px] ${
                                c.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                                c.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                Risk: {c.riskLevel}
                              </span>
                              <p className="text-slate-400 mt-1.5 font-medium">
                                {new Date(c.updatedAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
