import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, TrendingUp, Star, Video, Brain, ChevronRight, ChevronLeft, Plus, Minus,
  LogOut, MessageCircle, Shield, Loader2, FileText, Heart, Smile, Sparkles,
  BookOpen, AlertCircle, Building2, Users, X, Trash2, Menu, ChevronDown, Check,
  CheckCircle2, Radio, Crown, Zap, UserCheck, ShieldCheck, MoreHorizontal,
  Activity, LayoutDashboard, CalendarDays, Lock, ShieldAlert, AlertTriangle
} from 'lucide-react';
import API from '@/lib/api';
import logoUrl from '@/assets/logo.png';
import { formatAdLink, getNormalizedPosterUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useClerk, useAuth } from '@clerk/clerk-react';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { toast } from 'sonner';
import { openSubscriptionCheckout } from "@/lib/razorpay";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

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

const normalizeAvailability = (rawAvail?: any[]) => {
  const slotsByDay = new Map<number, string[]>();
  if (Array.isArray(rawAvail)) {
    rawAvail.forEach((item) => {
      if (item && typeof item.day === 'number') {
        const slotsArray = Array.isArray(item.slots) ? item.slots : [];
        slotsByDay.set(item.day, slotsArray);
      }
    });
  }
  return DAYS.map((_, dayIndex) => ({
    day: dayIndex,
    slots: slotsByDay.get(dayIndex) || [],
  }));
};

function riskBadge(level: string) {
  const map: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    medium: 'bg-amber-50 text-amber-800 border border-amber-200',
    high: 'bg-rose-50 text-rose-800 border border-rose-200',
    unknown: 'bg-slate-100 text-slate-500 border border-slate-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[level] ?? map.unknown}`}>
      {level}
    </span>
  );
}

function moodColor(score: number) {
  if (score <= 3) return '#EF4444';
  if (score <= 5) return '#F59E0B';
  if (score <= 7) return '#10B981';
  return '#1F8769';
}

function FeatureLockNotice({
  title,
  description,
  reason,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  title: string;
  description: string;
  reason: 'verification_pending' | 'verification_required' | 'subscription_required';
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  const isPending = reason === 'verification_pending';
  const isSub = reason === 'subscription_required';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
      <div className={`size-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
        isSub ? 'bg-emerald-50 text-[#1F8769] border border-emerald-100' :
        isPending ? 'bg-amber-50 text-amber-700 border border-amber-100' :
        'bg-rose-50 text-rose-700 border border-rose-100'
      }`}>
        {isSub ? <Crown className="size-8" /> : isPending ? <Clock className="size-8" /> : <ShieldAlert className="size-8" />}
      </div>

      <div className="space-y-2">
        <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
          isSub ? 'bg-emerald-50 text-[#1F8769] border border-emerald-100' :
          isPending ? 'bg-amber-50 text-amber-800 border border-amber-100' :
          'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {isSub ? 'Practitioner Plan Required' : isPending ? 'Verification Under Review' : 'Verification Incomplete'}
        </span>
        <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto font-medium leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button
          onClick={onAction}
          className="w-full sm:w-auto bg-[#1F8769] hover:bg-[#186D55] text-white rounded-xl h-11 px-6 font-bold shadow-md shadow-[#1F8769]/20 text-xs cursor-pointer transition active:scale-95"
        >
          {actionLabel}
        </Button>
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            onClick={onSecondaryAction}
            className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-11 px-6 font-bold text-xs cursor-pointer"
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function TherapistDashboard() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'schedule' | 'availability' | 'earnings' | 'profile' | 'subscription' | 'invitations' | 'organization' | 'reports' | 'group-sessions'>('schedule');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [briefBookingId, setBriefBookingId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [viewJournalsBookingId, setViewJournalsBookingId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ day: number; slots: string[] }[]>(() =>
    normalizeAvailability(DAYS.map((_, day) => ({ day, slots: day >= 1 && day <= 5 ? ['10:00', '14:00', '16:00'] : [] })))
  );
  const [savedAvailability, setSavedAvailability] = useState<string>(() =>
    JSON.stringify(normalizeAvailability(DAYS.map((_, day) => ({ day, slots: day >= 1 && day <= 5 ? ['10:00', '14:00', '16:00'] : [] }))))
  );
  const [unsavedLeaveModalOpen, setUnsavedLeaveModalOpen] = useState(false);
  const [pendingTargetTab, setPendingTargetTab] = useState<'schedule' | 'availability' | 'earnings' | 'profile' | 'subscription' | 'invitations' | 'organization' | 'reports' | 'group-sessions' | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [calendarDate, setCalendarDate] = useState(() => new Date());

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
  const isVerified = verificationStatus === 'verified';
  const isVerificationPending = verificationStatus === 'pending';
  const isVerificationIncomplete = !isVerified && !isVerificationPending;

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

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['therapist-stats'],
    queryFn: () => API.therapist.meStats(),
    enabled: !subRequired && isVerified,
    retry: false,
  });

  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['therapist-bookings'],
    queryFn: () => API.therapist.meBookings(),
    refetchInterval: 300000,
    enabled: !subRequired && isVerified,
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
    onSuccess: () => {
      setSavedAvailability(JSON.stringify(availability));
      toast.success('Availability saved');
      qc.invalidateQueries({ queryKey: ['therapist-stats'] });
      qc.invalidateQueries({ queryKey: ['auth-me'] });
    },
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

  const { data: therapistAdData } = useQuery({
    queryKey: ['adBanner', 'therapist'],
    queryFn: () => API.adBanner.get('therapist'),
    retry: false,
  });

  const rawTherapistBanners = therapistAdData?.banners || (therapistAdData?.adBanner ? [therapistAdData.adBanner] : (therapistAdData?.banner ? [therapistAdData.banner] : []));
  const activeTherapistBanners = rawTherapistBanners.filter((b: any) => b && b.isActive !== false && (b.title || b.description));

  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberDetail, setMemberDetail] = useState<any>(null);
  const [memberLoading, setMemberLoading] = useState(false);

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

  const profile = statsData?.profile || meData?.therapistProfile;
  const counselorDisplayName = profile?.name || meData?.fullName || 'Counsellor';

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
    if (subscriptionData && subRequired && tab === 'schedule') {
      setTab('subscription');
    }
  }, [subscriptionData, subRequired]);

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
        const norm = normalizeAvailability(profile.availability);
        setAvailability(norm);
        setSavedAvailability(JSON.stringify(norm));
      }
    }
  }, [profile]);

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

  const stats = statsData?.stats;
  const bookings: any[] = bookingsData?.bookings ?? [];
  const revenueByMonth = bookingsData?.revenueByMonth ?? {};

  const chartData = Object.entries(revenueByMonth)
    .map(([monthKey, amount]) => {
      const [year, month] = monthKey.split('-');
      const date = new Date(Number(year), Number(month) - 1, 1);
      const name = date.toLocaleDateString('en-IN', { month: 'short' });
      return {
        key: monthKey,
        name,
        gross: Number(amount),
        net: Math.round(Number(amount) * 0.70),
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  const today = new Date().toDateString();
  const todayBookings = bookings.filter((b) => new Date(b.slot).toDateString() === today && b.status === 'confirmed');
  const upcomingBookings = bookings.filter((b) => new Date(b.slot) > new Date() && b.status === 'confirmed')
    .sort((a, b) => new Date(a.slot).getTime() - new Date(b.slot).getTime());

  const canJoin = (slot: string) => {
    const diff = new Date(slot).getTime() - Date.now();
    return diff <= 15 * 60 * 1000 && diff > -2 * 60 * 60 * 1000;
  };

  const toggleSlot = (dayIndex: number, slot: string) => {
    setAvailability((prev) => {
      const currentNormalized = normalizeAvailability(prev);
      return currentNormalized.map((d) => {
        if (d.day !== dayIndex) return d;
        const exists = d.slots.includes(slot);
        const updatedSlots = exists
          ? d.slots.filter((s) => s !== slot)
          : [...d.slots, slot].sort();
        return { ...d, slots: updatedSlots };
      });
    });
  };

  // Calendar calculations for mini calendar card
  const calendarMonthTitle = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const { calDays, calPadding } = useMemo(() => {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();

    const padding = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      padding.push(prevMonthDays - i);
    }

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return { calDays: days, calPadding: padding };
  }, [calendarDate]);

  const hasBookingOnDate = (day: number) => {
    return bookings.some((b) => {
      const d = new Date(b.slot);
      return (
        d.getFullYear() === calendarDate.getFullYear() &&
        d.getMonth() === calendarDate.getMonth() &&
        d.getDate() === day
      );
    });
  };

  const isTodayDate = (day: number) => {
    const n = new Date();
    return (
      n.getFullYear() === calendarDate.getFullYear() &&
      n.getMonth() === calendarDate.getMonth() &&
      n.getDate() === day
    );
  };

  const displayedBookings = useMemo(() => {
    if (scheduleFilter === 'today') return todayBookings;
    if (scheduleFilter === 'upcoming') return upcomingBookings;
    return bookings;
  }, [scheduleFilter, todayBookings, upcomingBookings, bookings]);

  const isAvailabilityDirty = useMemo(() => {
    if (!savedAvailability) return false;
    return JSON.stringify(availability) !== savedAvailability;
  }, [availability, savedAvailability]);

  // Alert before leaving page/window if there are unsaved availability changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (tab === 'availability' && isAvailabilityDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tab, isAvailabilityDirty]);

  const handleTabChange = (newTab: typeof tab) => {
    if (tab === 'availability' && newTab !== 'availability' && isAvailabilityDirty) {
      setPendingTargetTab(newTab);
      setUnsavedLeaveModalOpen(true);
      return;
    }
    setTab(newTab);
  };

  const isTabDisabled = (key: string) => {
    const requiresAccess = ['schedule', 'availability', 'group-sessions', 'reports'].includes(key);
    if (!requiresAccess) return false;
    return subRequired || !isVerified;
  };

  // Sidebar navigation items
  const mainNavItems = [
    { key: 'schedule', label: 'Consultations', icon: Calendar, disabled: isTabDisabled('schedule') },
    { key: 'availability', label: 'Weekly Availability', icon: Clock, disabled: isTabDisabled('availability') },
    { key: 'group-sessions', label: 'Live Group Audio', icon: Radio, disabled: isTabDisabled('group-sessions') },
  ];

  const clinicalNavItems = [
    { key: 'profile', label: 'Counsellor Profile', icon: UserCheck, disabled: false },
    { key: 'subscription', label: 'Practitioner Tier', icon: Crown, hide: isOrgLinked, disabled: false },
    { key: isOrgLinked ? 'organization' : 'invitations', label: 'Organization Affiliation', icon: Building2, disabled: false },
    { key: 'reports', label: 'Shared Client Reports', icon: FileText, disabled: isTabDisabled('reports') },
  ].filter(i => !i.hide);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/sign-in', replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-2xl bg-[#1F8769] flex items-center justify-center text-white animate-pulse shadow-lg shadow-[#1F8769]/20">
            <Activity className="size-5" />
          </div>
          <span className="text-xs font-semibold text-slate-400">Loading Counsellor Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col md:flex-row text-slate-800 font-sans antialiased selection:bg-[#EBF7F2] selection:text-[#1F8769]">
      {/* DESKTOP SIDEBAR (Non-scrollable, fits cleanly in viewport) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-slate-100 flex-col justify-between p-5 sticky top-0 h-screen overflow-hidden">
        <div className="space-y-6">
          {/* Brand Logo & Portal Tagline */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <img src={logoUrl} alt="mymindtherapyfriend Logo" className="size-8 object-contain shrink-0" />
            <div className="min-w-0">
              <span className="font-display font-extrabold text-sm text-slate-900 tracking-tight leading-none block truncate">
                mymindtherapyfriend
              </span>
              <span className="text-[10px] font-bold text-[#1F8769] uppercase tracking-wider block mt-0.5">
                Counsellor Portal
              </span>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-5">
            {/* Main Menu Group */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-1.5 font-display">
                Main Menu
              </span>
              {mainNavItems.map((item) => {
                const isActive = tab === item.key;
                return (
                  <button
                    key={item.key}
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled) {
                        handleTabChange(item.key as any);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#EBF7F2] text-[#1F8769] shadow-2xs font-extrabold cursor-pointer'
                        : item.disabled
                        ? 'text-slate-300 opacity-40 cursor-not-allowed select-none'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`size-4 shrink-0 ${isActive ? 'text-[#1F8769]' : item.disabled ? 'text-slate-300' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.disabled && (
                      <Lock className="size-3 text-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Practice & Clinic Group */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-1.5 font-display">
                Practice & Clinic
              </span>
              {clinicalNavItems.map((item) => {
                const isActive = tab === item.key;
                return (
                  <button
                    key={item.key}
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled) {
                        handleTabChange(item.key as any);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#EBF7F2] text-[#1F8769] shadow-2xs font-extrabold cursor-pointer'
                        : item.disabled
                        ? 'text-slate-300 opacity-40 cursor-not-allowed select-none'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`size-4 shrink-0 ${isActive ? 'text-[#1F8769]' : item.disabled ? 'text-slate-300' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.disabled && (
                      <Lock className="size-3 text-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Account Action */}
            <div className="pt-2">
              <button
                onClick={() => signOut({ redirectUrl: '/' })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="size-4 text-rose-500 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-72 max-w-[85%] bg-white h-full p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <img src={logoUrl} alt="Logo" className="size-8 object-contain" />
                    <div>
                      <span className="font-display font-bold text-sm text-slate-900 block leading-tight">mymindtherapyfriend</span>
                      <span className="text-[10px] font-bold text-[#1F8769]">Counsellor Portal</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-1 font-display">
                      Main Menu
                    </span>
                    {mainNavItems.map((item) => (
                      <button
                        key={item.key}
                        disabled={item.disabled}
                        onClick={() => {
                          if (!item.disabled) {
                            handleTabChange(item.key as any);
                            setSidebarOpen(false);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${
                          tab === item.key
                            ? 'bg-[#EBF7F2] text-[#1F8769]'
                            : item.disabled
                            ? 'text-slate-300 opacity-40 cursor-not-allowed select-none'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.disabled && <Lock className="size-3 text-slate-300" />}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-1 font-display">
                      Practice & Clinic
                    </span>
                    {clinicalNavItems.map((item) => (
                      <button
                        key={item.key}
                        disabled={item.disabled}
                        onClick={() => {
                          if (!item.disabled) {
                            handleTabChange(item.key as any);
                            setSidebarOpen(false);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${
                          tab === item.key
                            ? 'bg-[#EBF7F2] text-[#1F8769]'
                            : item.disabled
                            ? 'text-slate-300 opacity-40 cursor-not-allowed select-none'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.disabled && <Lock className="size-3 text-slate-300" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => signOut({ redirectUrl: '/' })}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* TOP HEADER BAR (Clean, No Search Bar) */}
        <header className="sticky top-0 z-30 bg-[#F8F9FB]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 border-b border-slate-200/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-2xs cursor-pointer"
              aria-label="Open Navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                {tab === 'schedule' ? 'Consultations & Sessions' :
                 tab === 'availability' ? 'Weekly Availability' :
                 tab === 'group-sessions' ? 'Live Group Audio' :
                 tab === 'profile' ? 'Counsellor Profile' :
                 tab === 'subscription' ? 'Practitioner Membership Tier' :
                 tab === 'organization' || tab === 'invitations' ? 'Organization Affiliation' :
                 'Shared Client Reports'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Date Chip */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 shadow-2xs">
              <Calendar className="size-3.5 text-slate-400" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Dynamic Counsellor Status */}
            {isVerified ? (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBF7F2] text-[#1F8769] text-xs font-bold border border-emerald-200/80">
                <span className="size-2 rounded-full bg-[#1F8769] animate-pulse" />
                <span>{subRequired ? 'Verified • Free Plan' : 'Verified Counsellor'}</span>
              </div>
            ) : isVerificationPending ? (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                <Clock className="size-3.5 text-amber-600" />
                <span>Verification Under Review</span>
              </div>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                <AlertCircle className="size-3.5 text-rose-600" />
                <span>Verification Incomplete</span>
              </div>
            )}

            <UserProfileDropdown />
          </div>
        </header>

        {/* CANVAS WORKSPACE */}
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* TOP BANNER 1: Verification Status Banner */}
          {!isVerified && (
            <div className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-2xs ${
              isVerificationPending
                ? 'bg-amber-50/90 border-amber-200/80 text-amber-900'
                : 'bg-rose-50/90 border-rose-200/80 text-rose-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  isVerificationPending ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isVerificationPending ? <Clock className="size-5" /> : <ShieldAlert className="size-5" />}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">
                    {isVerificationPending ? 'Application Under Clinical Review' : 'Counsellor Verification Required'}
                  </h4>
                  <p className={`text-[11px] sm:text-xs font-medium mt-0.5 ${
                    isVerificationPending ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {isVerificationPending
                      ? "Your clinical qualifications, RCI registration, and intro video are currently being reviewed. Live client sessions will unlock upon approval."
                      : "To accept patient consultations and open your calendar, please submit your degree certificates and clinical credentials."}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => isVerificationPending ? window.location.reload() : navigate({ to: '/therapist/onboarding' })}
                className={`text-xs font-bold rounded-xl h-10 px-4 shrink-0 shadow-sm cursor-pointer ${
                  isVerificationPending
                    ? 'bg-amber-800 hover:bg-amber-900 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isVerificationPending ? 'Refresh Application Status' : 'Complete Verification'}
              </Button>
            </div>
          )}

          {/* TOP BANNER 2: Inactive Subscription Plan Banner */}
          {subRequired && (
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#1F8769]/10 text-[#1F8769] shrink-0">
                  <Crown className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Practitioner Membership Inactive (Free Tier)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5">
                    Upgrade to an active practitioner tier to unlock consultation booking slots, video rooms, and multi-party live audio sessions.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setTab('subscription')}
                className="bg-[#1F8769] hover:bg-[#186D55] text-white text-xs font-bold rounded-xl h-10 px-5 shadow-sm shadow-[#1F8769]/20 shrink-0 cursor-pointer transition active:scale-95"
              >
                <Crown className="size-3.5 mr-1.5" /> View Plans & Upgrade
              </Button>
            </div>
          )}

          {/* WELCOME ROW & TOP 3 EXECUTIVE KPI CARDS (Only on Schedule Tab when verified & subscribed) */}
          {tab === 'schedule' && isVerified && !subRequired && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-900">
                    Welcome back, {counselorDisplayName.split(' ')[0]} 👋
                  </h1>
                </div>
              </div>

              {/* TOP 3 EXECUTIVE KPI CARDS (Small in Height, 100% Real Backend Data) */}
              {!statsLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Today's Consultations */}
                  <div className="bg-[#1F8769] text-white rounded-2xl p-4 sm:p-4.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-white/20 text-white">
                          <Calendar className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white/95 tracking-tight">Today's Consultations</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
                        {todayBookings.length > 0 ? `${todayBookings.length} Today` : 'Scheduled'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
                        {todayBookings.length}
                      </span>
                      <span className="text-[11px] text-white/80 font-medium text-right">
                        {todayBookings.length === 1 ? '1 session scheduled today' : `${todayBookings.length} sessions scheduled today`}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Upcoming Consultations */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-emerald-50 text-[#1F8769]">
                          <Clock className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 tracking-tight">Upcoming Appointments</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-[#1F8769] px-2 py-0.5 rounded-full border border-emerald-100">
                        Confirmed
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900">
                        {upcomingBookings.length}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium text-right">
                        {upcomingBookings.length} upcoming client sessions
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Completed Consultations & Revenue */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-4.5 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-teal-50 text-[#1F8769]">
                          <CheckCircle2 className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 tracking-tight">Completed Sessions</span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/80">
                        ★ {profile?.rating ? profile.rating.toFixed(1) : '5.0'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900">
                        {stats?.completedSessions ?? 0}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium text-right truncate max-w-[190px]">
                        Gross: ₹{(stats?.grossRevenue || 0).toLocaleString('en-IN')} (70% Payout: ₹{Math.round((stats?.grossRevenue || 0) * 0.7).toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Counselor Dashboard Advertisement Banners (Managed by Admin) */}
          {activeTherapistBanners.length > 0 && (
            <div className={`grid gap-4 ${activeTherapistBanners.length >= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {activeTherapistBanners.map((ad: any, idx: number) => {
                const targetLink = formatAdLink(ad.buttonLink || ad.targetUrl);
                const isExternal = targetLink.startsWith('http');
                const poster = getNormalizedPosterUrl(ad.imageUrl);
                return (
                  <div
                    key={idx}
                    className="rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 p-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-stretch gap-4 relative overflow-hidden group"
                  >
                    <div className="relative z-10 flex-1 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        {ad.badgeText && (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full">
                            {ad.badgeText}
                          </span>
                        )}
                        {ad.title && (
                          <h3 className="font-display text-xl font-bold tracking-tight text-white leading-tight">
                            {ad.title}
                          </h3>
                        )}
                        {ad.description && (
                          <p className="text-sm text-slate-200/90 leading-relaxed font-normal">
                            {ad.description}
                          </p>
                        )}
                      </div>
                      {ad.buttonText && (ad.buttonLink || ad.targetUrl) && (
                        <div className="pt-3 relative z-10">
                          <a
                            href={targetLink}
                            target={isExternal ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition active:scale-[0.98]"
                          >
                            {ad.buttonText} <ChevronRight className="size-4" />
                          </a>
                        </div>
                      )}
                    </div>
                    {poster && (
                      <div className="sm:w-40 h-32 sm:h-auto shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-md bg-slate-950/60 relative">
                        <img src={poster} alt="Ad Poster" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* OVERVIEW / SCHEDULE TAB */}
          {tab === 'schedule' && (
            !isVerified ? (
              <FeatureLockNotice
                title="Consultations & Schedule Locked"
                description={
                  isVerificationPending
                    ? "Your clinical verification is currently under review by our medical board. Patient consultations and schedule bookings will become active once approved."
                    : "To uphold patient care standards, all counsellors must complete credential verification before taking sessions."
                }
                reason={isVerificationPending ? 'verification_pending' : 'verification_required'}
                actionLabel={isVerificationPending ? 'Refresh Application Status' : 'Complete Verification'}
                onAction={() => (isVerificationPending ? window.location.reload() : navigate({ to: '/therapist/onboarding' }))}
                secondaryActionLabel="Explore Practitioner Plans"
                onSecondaryAction={() => setTab('subscription')}
              />
            ) : subRequired ? (
              <FeatureLockNotice
                title="Practitioner Membership Required"
                description="You are currently on the Free tier. An active practitioner subscription is required to unlock your consultation calendar, receive patient appointments, and conduct video sessions."
                reason="subscription_required"
                actionLabel="View Practitioner Plans"
                onAction={() => setTab('subscription')}
                secondaryActionLabel="Edit Counsellor Bio"
                onSecondaryAction={() => setTab('profile')}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT 2 COLUMNS: Consultations Schedule */}
              <div className="lg:col-span-2 space-y-6">

                {/* Consultations Schedule List */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                        <span>Consultation Schedule</span>
                        <span className="text-xs font-extrabold bg-[#EBF7F2] text-[#1F8769] px-2.5 py-0.5 rounded-full">
                          {displayedBookings.length}
                        </span>
                      </h3>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1 rounded-2xl">
                      <button
                        onClick={() => setScheduleFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          scheduleFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        All ({bookings.length})
                      </button>
                      <button
                        onClick={() => setScheduleFilter('today')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          scheduleFilter === 'today'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Today ({todayBookings.length})
                      </button>
                      <button
                        onClick={() => setScheduleFilter('upcoming')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          scheduleFilter === 'upcoming'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Upcoming ({upcomingBookings.length})
                      </button>
                    </div>
                  </div>

                  {bookingsLoading && (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                      ))}
                    </div>
                  )}

                  {displayedBookings.length === 0 && !bookingsLoading && (
                    <div className="py-12 text-center space-y-3">
                      <div className="size-14 rounded-2xl bg-[#EBF7F2] text-[#1F8769] flex items-center justify-center mx-auto">
                        <Calendar className="size-7" />
                      </div>
                      <h4 className="font-display font-bold text-slate-800 text-base">No Consultations Found</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                        Ensure your weekly availability slots are open so clients can book appointments.
                      </p>
                      <Button
                        onClick={() => setTab('availability')}
                        className="bg-[#1F8769] hover:bg-[#186D55] text-white text-xs font-bold px-4 py-2 rounded-xl"
                      >
                        Configure Available Hours
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {displayedBookings.map((b) => {
                      const isReadyToJoin = canJoin(b.slot);
                      const slotDate = new Date(b.slot);
                      const isToday = new Date().toDateString() === slotDate.toDateString();

                      return (
                        <div
                          key={b.id}
                          className="bg-white rounded-2xl border border-slate-100/90 p-4 sm:p-5 hover:border-emerald-300 transition-all duration-200 shadow-2xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-[#EBF7F2] text-[#1F8769] font-bold text-xs flex items-center justify-center shrink-0">
                                #{b.id?.slice(-4) ?? 'anon'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-display font-bold text-sm text-slate-900">
                                    Client Consultation
                                  </h4>
                                  {isToday && (
                                    <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.2 rounded-full">
                                      Today
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                                  <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                    <Calendar className="size-3 text-slate-400" />
                                    {slotDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                    <Clock className="size-3 text-slate-400" />
                                    {slotDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Video Join Button */}
                            <div>
                              {isReadyToJoin ? (
                                <button
                                  onClick={() => navigate({ to: `/session/${b.id}` })}
                                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1F8769] hover:bg-[#186D55] text-white rounded-xl font-bold text-xs shadow-md shadow-[#1F8769]/20 transition active:scale-95 cursor-pointer"
                                >
                                  <span className="size-2 rounded-full bg-white animate-ping" />
                                  <Video className="size-3.5" /> Start Video Consultation
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                                  <Clock className="size-3 text-slate-300" /> Room opens 15m prior
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
                            <button
                              onClick={() => setBriefBookingId(b.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#1F8769] text-[11px] font-bold border border-teal-100 transition cursor-pointer"
                            >
                              <Brain className="size-3 text-[#1F8769]" /> AI Brief
                            </button>

                            {(!b.journalShareState || b.journalShareState === 'none') && (
                              <button
                                disabled={requestJournalMutation.isPending}
                                onClick={() => requestJournalMutation.mutate(b.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 transition cursor-pointer disabled:opacity-50"
                              >
                                <BookOpen className="size-3 text-amber-600" />
                                {requestJournalMutation.isPending && requestJournalMutation.variables === b.id ? "Requesting..." : "Request CBT Journal"}
                              </button>
                            )}

                            {b.journalShareState === 'requested' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-100">
                                <Clock className="size-3 text-amber-500 animate-spin" /> Consent Pending
                              </span>
                            )}

                            {b.journalShareState === 'approved' && (
                              <button
                                onClick={() => setViewJournalsBookingId(b.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition cursor-pointer"
                              >
                                <BookOpen className="size-3 text-emerald-600" /> View Shared Journals
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT 1 COLUMN: Interactive Calendar Card & Quick Shortcuts */}
              <div className="lg:col-span-1 space-y-6">
                {/* Calendar Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-[#1F8769]">
                        <CalendarDays className="size-4" />
                      </div>
                      <h3 className="font-display font-bold text-sm text-slate-800">
                        Calendar
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{calendarMonthTitle}</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                          className="p-1 hover:text-slate-700 hover:bg-slate-50 rounded"
                        >
                          <ChevronLeft className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                          className="p-1 hover:text-slate-700 hover:bg-slate-50 rounded"
                        >
                          <ChevronRight className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div>
                    <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 pb-2">
                      <span>S</span>
                      <span>M</span>
                      <span>T</span>
                      <span>W</span>
                      <span>T</span>
                      <span>F</span>
                      <span>S</span>
                    </div>

                    <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs">
                      {calPadding.map((pad, idx) => (
                        <div key={`pad-${idx}`} className="py-1 text-slate-300 font-medium select-none">
                          {pad}
                        </div>
                      ))}

                      {calDays.map((d) => {
                        const isToday = isTodayDate(d);
                        const hasBooking = hasBookingOnDate(d);

                        return (
                          <div
                            key={d}
                            className="py-1 flex flex-col items-center justify-center relative cursor-pointer"
                          >
                            <span
                              className={`size-7 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                                isToday
                                  ? 'border-2 border-[#1F8769] text-[#1F8769] bg-[#EBF7F2]/60'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {d}
                            </span>
                            {hasBooking && (
                              <span className="size-1 rounded-full bg-[#1F8769] absolute bottom-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mini Session Summary below Calendar */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-display">
                      Next Consultation
                    </span>
                    {upcomingBookings.length > 0 ? (
                      <div className="p-3.5 rounded-2xl bg-[#EBF7F2]/60 border border-emerald-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Client #{upcomingBookings[0].id?.slice(-4)}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {new Date(upcomingBookings[0].slot).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {canJoin(upcomingBookings[0].slot) ? (
                          <button
                            onClick={() => navigate({ to: `/session/${upcomingBookings[0].id}` })}
                            className="px-3 py-1.5 bg-[#1F8769] hover:bg-[#186D55] text-white text-[10px] font-bold rounded-lg shadow-sm"
                          >
                            Join Now
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                            Confirmed
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No upcoming sessions today.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

          {/* GROUP AUDIO SESSIONS TAB */}
          {tab === 'group-sessions' && (
            !isVerified ? (
              <FeatureLockNotice
                title="Live Group Audio Sessions Locked"
                description={
                  isVerificationPending
                    ? "Hosting live group audio support circles is locked while your credentials are under review by our clinical board."
                    : "Please complete your clinical credential verification to host multi-party live audio sessions."
                }
                reason={isVerificationPending ? 'verification_pending' : 'verification_required'}
                actionLabel={isVerificationPending ? 'Refresh Application Status' : 'Complete Verification'}
                onAction={() => (isVerificationPending ? window.location.reload() : navigate({ to: '/therapist/onboarding' }))}
                secondaryActionLabel="Explore Practitioner Plans"
                onSecondaryAction={() => setTab('subscription')}
              />
            ) : subRequired ? (
              <FeatureLockNotice
                title="Practitioner Plan Required for Group Audio"
                description="Hosting live multi-party group audio therapy rooms is included with active practitioner memberships."
                reason="subscription_required"
                actionLabel="Upgrade Practitioner Plan"
                onAction={() => setTab('subscription')}
                secondaryActionLabel="Edit Counsellor Bio"
                onSecondaryAction={() => setTab('profile')}
              />
            ) : (
              <GroupAudioSessionsTherapistTab />
            )
          )}

          {/* AVAILABILITY TAB */}
          {tab === 'availability' && (
            !isVerified ? (
              <FeatureLockNotice
                title="Weekly Availability Calendar Locked"
                description={
                  isVerificationPending
                    ? "Your clinical verification is currently under review. Recurring availability slots will become configurable once approved."
                    : "Please complete your clinical credential verification to activate your consultation calendar slots."
                }
                reason={isVerificationPending ? 'verification_pending' : 'verification_required'}
                actionLabel={isVerificationPending ? 'Refresh Application Status' : 'Complete Verification'}
                onAction={() => (isVerificationPending ? window.location.reload() : navigate({ to: '/therapist/onboarding' }))}
                secondaryActionLabel="Explore Practitioner Plans"
                onSecondaryAction={() => setTab('subscription')}
              />
            ) : subRequired ? (
              <FeatureLockNotice
                title="Practitioner Plan Required for Calendar Slots"
                description="Defining weekly consultation hours and recurring booking slots requires an active practitioner subscription."
                reason="subscription_required"
                actionLabel="Choose a Practitioner Plan"
                onAction={() => setTab('subscription')}
                secondaryActionLabel="Edit Profile"
                onSecondaryAction={() => setTab('profile')}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">
                      Weekly Availability Calendar
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Configure recurring consultation slots. Highlighted slots appear live on your booking page.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {isAvailabilityDirty && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs animate-pulse">
                        <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
                        Unsaved Changes
                      </span>
                    )}
                    <Button
                      onClick={() => availabilityMutation.mutate()}
                      disabled={availabilityMutation.isPending}
                      className="bg-[#1F8769] hover:bg-[#186D55] text-white rounded-xl h-11 px-6 font-bold shadow-md shadow-[#1F8769]/20 active:scale-95 transition text-xs cursor-pointer"
                    >
                      {availabilityMutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" /> Saving…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4 mr-2" /> Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Timetable Card */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-x-auto max-h-[640px] overflow-y-auto p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <div className="min-w-[620px] grid grid-cols-8 gap-2.5">
                    <div className="space-y-2.5">
                      <div className="sticky top-0 bg-white pb-3 border-b border-slate-100 mb-2 h-[34px] z-10 font-bold text-[11px] text-slate-400 uppercase tracking-wider flex items-center justify-end pr-2">
                        Time
                      </div>
                      {DEFAULT_SLOTS.map(s => (
                        <div key={s} className="h-10 flex items-center justify-end pr-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          {formatSlotDisplay(s)}
                        </div>
                      ))}
                    </div>

                    {DAYS.map((day, i) => (
                      <div key={i} className="space-y-2.5">
                        <div className="sticky top-0 bg-white text-center font-display font-bold text-xs sm:text-sm text-slate-800 pb-3 border-b border-slate-100 mb-2 z-10 uppercase tracking-wider">
                          {day}
                        </div>
                        {DEFAULT_SLOTS.map((slot) => {
                          const active = availability.find((d) => d.day === i)?.slots.includes(slot);
                          return (
                            <button
                              type="button"
                              key={slot}
                              onClick={() => toggleSlot(i, slot)}
                              className={`w-full h-10 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer select-none flex items-center justify-center ${
                                active
                                  ? 'bg-[#1F8769] text-white border-2 border-[#16664F] shadow-sm font-extrabold active:scale-95'
                                  : 'bg-slate-50 text-slate-400 border border-slate-200/70 hover:bg-slate-100 hover:text-slate-700 active:scale-95'
                              }`}
                            >
                              {active ? '✓ Open' : '—'}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}

          {/* COUNSELLOR PROFILE TAB */}
          {tab === 'profile' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Clinical Practitioner Profile
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Maintain your credentials, therapeutic specialization, consultation fee, and video introduction.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Intro Video Link (YouTube / Vimeo / Google Drive)
                    </label>
                    <input
                      value={profileForm.introVideoUrl}
                      onChange={e => setProfileForm(p => ({...p, introVideoUrl: e.target.value}))}
                      placeholder="https://youtu.be/..."
                      className="w-full px-4 py-3 bg-[#F8F9FB] border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#1F8769]/20 focus:border-[#1F8769] outline-none text-xs sm:text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Official Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm(p => ({...p, email: e.target.value}))}
                        placeholder="counsellor@example.com"
                        className="w-full px-4 py-3 bg-[#F8F9FB] border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#1F8769]/20 focus:border-[#1F8769] outline-none text-xs sm:text-sm font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Personal Website</label>
                      <input
                        type="url"
                        value={profileForm.website}
                        onChange={e => setProfileForm(p => ({...p, website: e.target.value}))}
                        placeholder="https://counsellor.com"
                        className="w-full px-4 py-3 bg-[#F8F9FB] border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#1F8769]/20 focus:border-[#1F8769] outline-none text-xs sm:text-sm font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))}
                        placeholder="+919876543210"
                        className="w-full px-4 py-3 bg-[#F8F9FB] border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#1F8769]/20 focus:border-[#1F8769] outline-none text-xs sm:text-sm font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Specialisations & Focus Areas (Comma separated)
                    </label>
                    <input
                      value={profileForm.specializations}
                      onChange={e => setProfileForm(p => ({...p, specializations: e.target.value}))}
                      placeholder="Cognitive Behavioral Therapy, Anxiety, Depression, Relationship Counseling"
                      className="w-full px-4 py-3 bg-[#F8F9FB] border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#1F8769]/20 focus:border-[#1F8769] outline-none text-xs sm:text-sm font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Clinical Bio & Therapeutic Approach
                    </label>
                    <textarea
                      rows={4}
                      value={profileForm.bio}
                      onChange={e => setProfileForm(p => ({...p, bio: e.target.value}))}
                      placeholder="Describe your training, clinical philosophy, and therapeutic approach..."
                      className="w-full px-4 py-3 bg-[#F8F9FB] border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#1F8769]/20 focus:border-[#1F8769] outline-none text-xs sm:text-sm resize-none font-medium text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#EBF7F2] border border-emerald-100">
                    <label className="flex items-start gap-3.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={profileForm.openToCollaboration}
                        onChange={e => setProfileForm(p => ({...p, openToCollaboration: e.target.checked}))}
                        className="size-5 text-[#1F8769] border-slate-300 rounded focus:ring-[#1F8769] cursor-pointer mt-0.5"
                      />
                      <div>
                        <span className="block text-sm font-bold text-slate-900 group-hover:text-[#1F8769] transition">
                          Open to Institutional Collaboration & Corporate Invitations
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Allow corporate companies, schools, and institutional partners to discover your profile and send affiliation invitations.
                        </span>
                      </div>
                    </label>
                  </div>

                  <Button
                    onClick={() => profileMutation.mutate(profileForm)}
                    disabled={profileMutation.isPending}
                    className="w-full bg-[#1F8769] hover:bg-[#186D55] text-white rounded-2xl h-12 font-bold shadow-md shadow-[#1F8769]/20 active:scale-95 transition cursor-pointer text-xs sm:text-sm"
                  >
                    {profileMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" /> Saving Profile...
                      </>
                    ) : (
                      'Save Profile Details'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION & BILLING TAB */}
          {tab === 'subscription' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Practitioner Membership & Billing
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Manage your verified counsellor subscription and client listing tier.
                  </p>
                </div>
                {subscriptionData?.subscription && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-200 bg-[#EBF7F2] text-[#1F8769]">
                    <span className="size-2 rounded-full bg-[#1F8769] animate-pulse" />
                    <span>{subscriptionData.subscription.plan} — {subscriptionData.subscription.status.toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Sync Banner if pending */}
              {subscriptionData?.subscription?.status === 'pending' && (
                <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 text-center space-y-4 max-w-lg mx-auto shadow-sm">
                  <div className="size-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                    <AlertCircle className="size-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-950 font-display">Payment Confirmation Pending</h3>
                    <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                      If you completed payment via Razorpay, gateway verification may take a moment. Click below to refresh and instantly synchronize your tier.
                    </p>
                  </div>
                  <Button
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md active:scale-95 transition cursor-pointer"
                  >
                    {syncMutation.isPending ? "Syncing..." : "Verify & Sync Status"}
                  </Button>
                </div>
              )}

              {/* Active Plan Hero Card */}
              {hasActiveSub && (
                <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1F8769] text-white p-8 sm:p-10 shadow-xl">
                  <div className="relative z-10 space-y-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="size-3" /> Active Verified Tier
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
                      {subscriptionData.subscription.plan}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-white/90 font-medium">
                      <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl">
                        <Calendar className="size-4" />
                        <span>Expires: {new Date(subscriptionData.subscription.endDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl">
                        <Star className="size-4 text-amber-300 fill-amber-300" />
                        <span>Priority Directory Placement</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Plans Section */}
              <div className="space-y-5">
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Available Counsellor Membership Tiers
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan: any) => {
                    const isCurrent = subscriptionData?.subscription?.plan === plan.name && hasActiveSub;
                    const isUpgrading = upgrading === plan._id && upgradeMutation.isPending;
                    return (
                      <div
                        key={plan._id}
                        className={`bg-white rounded-3xl border p-7 sm:p-8 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-1 ${
                          isCurrent ? 'border-[#1F8769] ring-2 ring-[#1F8769]/20' : 'border-slate-100'
                        }`}
                      >
                        <div className="space-y-4">
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest bg-[#EBF7F2] text-[#1F8769] px-3 py-1 rounded-full">
                              Current Plan
                            </span>
                          )}
                          <h4 className="font-display text-2xl font-bold text-slate-900">{plan.name}</h4>
                          <div className="flex items-baseline gap-1 border-b border-slate-100 pb-4">
                            <span className="text-3xl font-extrabold font-display text-[#1F8769]">₹{plan.price}</span>
                            <span className="text-xs text-slate-400 font-medium">
                              /{plan.durationMonths && plan.durationMonths > 1 ? ` ${plan.durationMonths} mo` : ' mo'}
                            </span>
                          </div>
                          <ul className="space-y-2.5 text-xs font-medium text-slate-600">
                            {plan.features.map((f: string, i: number) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="text-[#1F8769] font-bold">✓</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-8">
                          {isCurrent ? (
                            <div className="w-full rounded-xl h-11 font-bold bg-slate-50 text-slate-400 flex items-center justify-center text-xs">
                              ✓ Currently Active
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                setUpgrading(plan._id);
                                upgradeMutation.mutate(plan._id);
                              }}
                              disabled={isUpgrading}
                              className="w-full rounded-xl h-11 font-bold bg-[#1F8769] hover:bg-[#186D55] text-white shadow-md active:scale-95 transition cursor-pointer text-xs"
                            >
                              {isUpgrading ? <Loader2 className="size-4 animate-spin" /> : 'Select & Upgrade'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* INVITATIONS TAB */}
          {tab === 'invitations' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-slate-900">Organization Invitations</h2>
              {invData?.invitations?.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400 shadow-xs">
                  <Building2 className="size-12 mx-auto mb-3 text-slate-200" />
                  <p className="font-medium text-xs sm:text-sm">No pending invitations from institutional partners.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {invData?.invitations?.map((inv: any) => (
                    <div key={inv._id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{inv.orgId?.name}</h3>
                          <p className="text-xs text-slate-400">{inv.orgId?.officialEmail}</p>
                          <span className="inline-block text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                            {inv.orgId?.type}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-[#EBF7F2] text-[#1F8769]">
                          <Building2 className="size-5" />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => respondMutation.mutate({ id: inv._id, action: 'accepted' })}
                          disabled={respondMutation.isPending}
                          className="flex-1 bg-[#1F8769] hover:bg-[#186D55] text-white rounded-xl font-bold text-xs"
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => respondMutation.mutate({ id: inv._id, action: 'rejected' })}
                          disabled={respondMutation.isPending}
                          variant="outline"
                          className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LINKED ORGANIZATION TAB */}
          {tab === 'organization' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-900">Linked Organization Members</h2>
                <Button
                  onClick={() => {
                    if (confirm("Are you sure you want to leave your currently linked organization?")) {
                      leaveOrgMutation.mutate();
                    }
                  }}
                  disabled={leaveOrgMutation.isPending}
                  variant="outline"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl"
                >
                  <LogOut className="size-3.5 mr-1" /> Leave Organization
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[500px]">
                {/* Left side list */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-600">
                    Members ({membersData?.members?.length || 0})
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                    {membersData?.members?.map((m: any) => (
                      <button
                        key={m.id}
                        onClick={() => handleViewMember(m)}
                        className={`w-full text-left p-4 transition hover:bg-slate-50 flex items-center justify-between cursor-pointer ${
                          selectedMember?.id === m.id ? 'bg-[#EBF7F2]/60' : ''
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{m.name}</p>
                          <p className="text-[11px] text-slate-400">{m.department || 'General'}</p>
                        </div>
                        <ChevronRight className="size-4 text-slate-400" />
                      </button>
                    ))}
                    {(!membersData?.members || membersData.members.length === 0) && (
                      <div className="p-8 text-center text-xs text-slate-400">No members found.</div>
                    )}
                  </div>
                </div>

                {/* Right side detail */}
                <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xs p-6 overflow-y-auto">
                  {memberLoading ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      <Loader2 className="size-6 animate-spin mr-2 text-[#1F8769]" /> Loading member data...
                    </div>
                  ) : memberDetail ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-display font-bold text-2xl text-slate-900">{memberDetail.user.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Department: {memberDetail.user.department}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#F8F9FB] p-5 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Mood</p>
                          <p className="text-2xl font-bold text-[#1F8769] mt-1">{memberDetail.wellness.avgMood ?? '—'}</p>
                        </div>
                        <div className="bg-[#F8F9FB] p-5 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sessions</p>
                          <p className="text-2xl font-bold text-[#1F8769] mt-1">{memberDetail.wellness.sessionCount}</p>
                        </div>
                        <div className="bg-[#F8F9FB] p-5 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Journals</p>
                          <p className="text-2xl font-bold text-[#1F8769] mt-1">{memberDetail.wellness.journalCount}</p>
                        </div>
                      </div>

                      {memberDetail.wellness.moodHistory.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-xs text-slate-700">Recent Mood Check-ins</h4>
                          <div className="space-y-2">
                            {memberDetail.wellness.moodHistory.slice(0, 5).map((m: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl text-xs">
                                <span className="size-8 rounded-lg bg-[#EBF7F2] text-[#1F8769] font-bold flex items-center justify-center shrink-0">
                                  {m.score}
                                </span>
                                <div>
                                  <p className="font-semibold text-slate-800">{m.note || 'No note'}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(m.createdAt).toLocaleDateString('en-IN')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8 space-y-2">
                      <Users className="size-10 text-slate-200" />
                      <p className="text-xs font-medium">Select a member from the left to view wellness overview.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SHARED WELLNESS REPORTS TAB */}
          {tab === 'reports' && (
            !isVerified ? (
              <FeatureLockNotice
                title="Shared Clinical Reports Locked"
                description={
                  isVerificationPending
                    ? "Patient clinical reports and AI progress summaries are locked while your credentials are under review by our medical board."
                    : "Please complete your clinical verification to access shared client wellness reports."
                }
                reason={isVerificationPending ? 'verification_pending' : 'verification_required'}
                actionLabel={isVerificationPending ? 'Refresh Application Status' : 'Complete Verification'}
                onAction={() => (isVerificationPending ? window.location.reload() : navigate({ to: '/therapist/onboarding' }))}
                secondaryActionLabel="Explore Practitioner Plans"
                onSecondaryAction={() => setTab('subscription')}
              />
            ) : subRequired ? (
              <FeatureLockNotice
                title="Practitioner Plan Required for Client Reports"
                description="Viewing patient shared CBT reflections, mental health metrics, and clinical evaluations is included with active practitioner memberships."
                reason="subscription_required"
                actionLabel="Upgrade Practitioner Plan"
                onAction={() => setTab('subscription')}
                secondaryActionLabel="Edit Profile"
                onSecondaryAction={() => setTab('profile')}
              />
            ) : (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-bold text-slate-900">Shared Wellness Reports</h2>
                {sharedReportsLoading ? (
                  <div className="h-32 rounded-3xl bg-slate-100 animate-pulse" />
                ) : (sharedReportsData?.reports ?? []).length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400">
                    <FileText className="size-12 mx-auto mb-3 text-slate-200" />
                    <p className="font-medium text-xs sm:text-sm">No client shared reports yet.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {(sharedReportsData?.reports ?? []).map((r: any) => (
                      <div key={r.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{r.userName}</h3>
                            <p className="text-xs text-slate-400 font-medium">{r.userPhoneMasked || 'Anonymous Client'}</p>
                            <span className="inline-block text-[10px] bg-[#EBF7F2] text-[#1F8769] px-2 py-0.5 rounded-full font-bold uppercase mt-2">
                              {r.period} Report
                            </span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-[#EBF7F2] text-[#1F8769]">
                            <FileText className="size-5" />
                          </div>
                        </div>
                        {r.notes && (
                          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 italic border-l-2 border-[#1F8769]">
                            "{r.notes}"
                          </div>
                        )}
                        <Button
                          onClick={() => setSelectedReportId(r.id)}
                          className="w-full bg-[#1F8769] hover:bg-[#186D55] text-white rounded-xl py-2.5 text-xs font-bold"
                        >
                          View Full Clinical Report
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </main>

      {/* AI Brief Modal */}
      <AnimatePresence>
        {briefBookingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4"
            onClick={() => setBriefBookingId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <Brain className="size-5 text-[#1F8769]" />
                  <h3 className="font-bold text-slate-900 font-display">AI Pre-Session Brief</h3>
                </div>
                <button onClick={() => setBriefBookingId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {briefLoading && (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />)}
                </div>
              )}

              {briefData && (
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">Clinical Risk:</span>
                    {riskBadge(briefData.riskLevel)}
                    {briefData.avgMood && (
                      <span className="text-xs text-slate-400">Avg mood: {briefData.avgMood}/10</span>
                    )}
                  </div>

                  {(briefData.clientName || briefData.onboardingDetails) && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Onboarding</p>
                      <p className="text-xs font-semibold text-slate-800">Name: {briefData.clientName}</p>
                      {briefData.onboardingDetails && (
                        <>
                          {briefData.onboardingDetails.primaryNeed && (
                            <p className="text-xs text-slate-600">Primary Goal: <span className="font-semibold">{briefData.onboardingDetails.primaryNeed}</span></p>
                          )}
                          {briefData.onboardingDetails.concerns?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {briefData.onboardingDetails.concerns.map((c: string, idx: number) => (
                                <span key={idx} className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {briefData.groqSummary && (
                    <div className="bg-[#EBF7F2] border border-emerald-100 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-[#1F8769] uppercase tracking-wider mb-1">AI Clinical Summary</p>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{briefData.groqSummary}</p>
                    </div>
                  )}

                  {briefData.recentJournals?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent CBT Excerpts</p>
                      {briefData.recentJournals.map((j: any, i: number) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 italic">
                          "{j.excerpt}…"
                        </div>
                      ))}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4"
            onClick={() => setViewJournalsBookingId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-5 text-[#1F8769]" />
                  <h3 className="font-display font-bold text-slate-900 text-base">Shared CBT Journal Entries</h3>
                </div>
                <button onClick={() => setViewJournalsBookingId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingJournals && (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
                  </div>
                )}

                {!loadingJournals && (!sharedJournals || sharedJournals.length === 0) && (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No journal entries recorded by client leading up to this session.
                  </div>
                )}

                {!loadingJournals && sharedJournals && sharedJournals.map((j: any) => (
                  <div key={j._id || j.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">
                        {new Date(j.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      {j.moodScore && (
                        <span className="font-bold text-[#1F8769] bg-white px-2 py-0.5 rounded-md border border-slate-100">
                          Mood: {j.moodScore}/10
                        </span>
                      )}
                    </div>
                    {j.situation && <p className="text-slate-700"><strong>Situation:</strong> {j.situation}</p>}
                    {j.thought && <p className="text-slate-700"><strong>Thought:</strong> {j.thought}</p>}
                    {j.reframe && <p className="text-[#1F8769] font-semibold"><strong>Reframe:</strong> {j.reframe}</p>}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4"
            onClick={() => setSelectedReportId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-[#1F8769]" />
                  <h3 className="font-bold text-slate-900 font-display text-base">Shared Wellness Report</h3>
                </div>
                <button onClick={() => setSelectedReportId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {reportDetailLoading && (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />)}
                </div>
              )}

              {reportDetailData && (
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <h4 className="font-display text-xl font-bold text-slate-900">{reportDetailData.user?.fullName}</h4>
                      <p className="text-xs text-slate-400">{reportDetailData.user?.phoneMasked || 'Anonymous Client'}</p>
                    </div>
                    <span className="bg-[#EBF7F2] text-[#1F8769] px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {reportDetailData.period} Report
                    </span>
                  </div>

                  {reportDetailData.moods?.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-bold text-xs text-slate-700">Mood Check-ins (Avg: {reportDetailData.avgMood}/10)</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {reportDetailData.moods.map((m: any) => (
                          <div key={m.id} className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                            <span className="text-slate-500">{new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            <span className="size-5 rounded-full text-white font-bold grid place-items-center text-[10px]" style={{ backgroundColor: moodColor(m.score) }}>
                              {m.score}
                            </span>
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

      {/* UNSAVED AVAILABILITY CHANGES ALERT MODAL */}
      <AnimatePresence>
        {unsavedLeaveModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                  <AlertTriangle className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Unsaved Availability Changes
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    You have modified your consultation slots without saving. If you switch tabs, these changes will be discarded.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 font-medium flex items-center gap-2">
                <span>⚠️ Choose whether to save your new slots before leaving or discard them.</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Button
                  onClick={async () => {
                    try {
                      await availabilityMutation.mutateAsync();
                      setSavedAvailability(JSON.stringify(availability));
                      if (pendingTargetTab) {
                        setTab(pendingTargetTab);
                      }
                      setUnsavedLeaveModalOpen(false);
                      setPendingTargetTab(null);
                    } catch {
                      // Handled by mutation onError
                    }
                  }}
                  disabled={availabilityMutation.isPending}
                  className="flex-1 bg-[#1F8769] hover:bg-[#186D55] text-white rounded-xl h-10 font-bold text-xs cursor-pointer shadow-sm"
                >
                  {availabilityMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving…
                    </>
                  ) : (
                    'Save & Switch Tab'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (savedAvailability) {
                      try {
                        setAvailability(JSON.parse(savedAvailability));
                      } catch {
                        // ignore error
                      }
                    }
                    if (pendingTargetTab) {
                      setTab(pendingTargetTab);
                    }
                    setUnsavedLeaveModalOpen(false);
                    setPendingTargetTab(null);
                  }}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl h-10 font-bold text-xs cursor-pointer"
                >
                  Discard Changes
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setUnsavedLeaveModalOpen(false);
                    setPendingTargetTab(null);
                  }}
                  className="text-slate-500 hover:bg-slate-100 rounded-xl h-10 font-bold text-xs cursor-pointer"
                >
                  Stay
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupAudioSessionsTherapistTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['group-sessions'],
    queryFn: () => API.groupSessions.list(),
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: (formData: any) =>
      API.groupSessions.create({
        title: formData.title,
        internalStartTime: new Date().toISOString(),
        internalEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        maxUsers: 11,
      }),
    onSuccess: () => {
      toast.success('Group audio session created ✓');
      setShowCreateModal(false);
      setForm({ title: '' });
      qc.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create group session'),
  });

  const claimMutation = useMutation({
    mutationFn: (sessionId: string) => API.groupSessions.claimSlot(sessionId),
    onSuccess: () => {
      toast.success('You claimed this session slot as Counselor!');
      qc.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to claim session slot'),
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => API.groupSessions.delete(sessionId),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Group audio session deleted ✓');
      qc.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete audio session'),
  });

  const approveMutation = useMutation({
    mutationFn: ({ sessionId, targetUserId, action }: { sessionId: string; targetUserId: string; action: 'allow' | 'deny' }) =>
      API.groupSessions.approveUser(sessionId, { targetUserId, action }),
    onSuccess: (data) => {
      toast.success(data.message || 'User status updated');
      qc.invalidateQueries({ queryKey: ['group-sessions'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update user status'),
  });

  const sessions: any[] = data?.sessions || [];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 text-[#1F8769] animate-spin" />
        <p className="text-xs font-semibold">Loading group audio sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Audio Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7F2] text-[#1F8769] text-xs font-bold mb-2">
            <Radio className="size-3.5 text-[#1F8769]" />
            <span>Multi-Party Audio Sessions</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Group Audio Sessions</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
            Host live audio-only discussions with up to 11 participants. Participants remain anonymous for clinical privacy.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#1F8769] hover:bg-[#186D55] text-white font-bold rounded-xl h-11 px-5 shadow-md shadow-[#1F8769]/20 shrink-0 text-xs sm:text-sm active:scale-95 transition cursor-pointer"
        >
          <Plus className="size-4 mr-1.5" /> Create Audio Session
        </Button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Total Audio Rooms</span>
            <span className="text-2xl font-extrabold font-display text-slate-900 mt-1 block">{sessions.length}</span>
          </div>
          <div className="size-10 rounded-xl bg-teal-50 text-[#1F8769] flex items-center justify-center font-bold">
            <Radio className="size-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Rooms with Counselor</span>
            <span className="text-2xl font-extrabold font-display text-emerald-700 mt-1 block">
              {sessions.filter(s => s.isCounselorAssigned).length}
            </span>
          </div>
          <div className="size-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <UserCheck className="size-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Open to Claim</span>
            <span className="text-2xl font-extrabold font-display text-amber-700 mt-1 block">
              {sessions.filter(s => !s.isCounselorAssigned).length}
            </span>
          </div>
          <div className="size-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="size-5" />
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 sm:p-14 text-center space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="size-16 rounded-2xl bg-[#EBF7F2] text-[#1F8769] flex items-center justify-center mx-auto shadow-inner">
            <Radio className="size-8 text-[#1F8769]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-lg">No Group Audio Sessions Yet</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-medium">
              Click "Create Audio Session" above to host live group discussions.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#1F8769] hover:bg-[#186D55] text-white rounded-xl h-11 px-6 font-bold shadow-md shadow-[#1F8769]/20 transition active:scale-95 text-xs cursor-pointer"
          >
            <Plus className="size-4 mr-1.5" /> Create Audio Session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((s) => {
            const isAssigned = s.isCounselorAssigned;
            const waitingUsers = s.waitingQueue || [];

            return (
              <div
                key={s._id}
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      isAssigned ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    <span className={`size-2 rounded-full ${isAssigned ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                    {isAssigned ? 'Occupied' : '🟢 Open for Counselor'}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${s.title}"?`)) deleteMutation.mutate(s._id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base">{s.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Max 11 Participants</p>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Host Counselor:</span>
                    <strong className="text-slate-800">{s.counselorName || 'Unassigned (Available)'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Admitted:</span>
                    <strong className="text-[#1F8769] font-bold">{s.admittedUsers?.length || 0} / 11 Users</strong>
                  </div>
                </div>

                {waitingUsers.length > 0 && (
                  <div className="bg-amber-50 rounded-2xl p-3 space-y-2 border border-amber-100">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Users className="size-3.5" /> Waiting Room ({waitingUsers.length})
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {waitingUsers.map((u: any) => (
                        <div key={u.userId} className="flex items-center justify-between bg-white p-2 rounded-xl text-xs shadow-2xs">
                          <span className="font-bold text-slate-800 truncate max-w-[100px]">{u.anonymousName}</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate({ sessionId: s._id, targetUserId: u.userId, action: 'allow' })}
                              className="bg-emerald-600 text-white text-[10px] px-2 h-6 font-bold rounded-lg"
                            >
                              Allow
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate({ sessionId: s._id, targetUserId: u.userId, action: 'deny' })}
                              className="bg-slate-100 text-slate-600 text-[10px] px-1.5 h-6 rounded-lg"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  {!isAssigned ? (
                    <Button
                      onClick={() => claimMutation.mutate(s._id)}
                      disabled={claimMutation.isPending}
                      className="w-full bg-[#1F8769] hover:bg-[#186D55] text-white font-bold rounded-xl py-2.5 text-xs shadow-md"
                    >
                      {claimMutation.isPending ? 'Assigning...' : 'Assign / Claim Slot 🟢'}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate({ to: `/group-audio/$sessionId/room`, params: { sessionId: s._id } })}
                        className="flex-1 bg-[#1F8769] hover:bg-[#186D55] text-white font-bold rounded-xl py-2.5 text-xs shadow-md"
                      >
                        Launch Room 🎙️
                      </Button>
                      <Button
                        onClick={() => claimMutation.mutate(s._id)}
                        disabled={claimMutation.isPending}
                        variant="outline"
                        className="border-slate-200 text-slate-600 text-xs rounded-xl px-3"
                      >
                        Unassign
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-900 text-lg">Create Group Audio Session</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Session Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Stress Management & Anxiety Group Discussion"
                  className="w-full bg-[#F8F9FB] border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#1F8769]/20"
                />
              </div>
              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.title.trim()}
                className="w-full bg-[#1F8769] hover:bg-[#186D55] text-white font-bold py-3 rounded-2xl shadow-md text-xs sm:text-sm"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Group Session'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
