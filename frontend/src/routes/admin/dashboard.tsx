import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, BarChart2, CheckCircle, XCircle, Search,
  TrendingUp, LogOut, AlertTriangle, Star, Eye, EyeOff, Building2,
  DollarSign, CreditCard, ArrowUpRight, BadgeCheck, Banknote
} from 'lucide-react';
import API from '@/lib/api';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export const Route = createFileRoute('/admin/dashboard')({ component: SuperAdminDashboard });

// Using centralized API from @/lib/api which handles Clerk tokens automatically

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'therapists' | 'organizations' | 'subscriptions' | 'plans' | 'earnings'>('overview');
  const [expandedTherapistId, setExpandedTherapistId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null);
  const [verifyModal, setVerifyModal] = useState<{ open: boolean; id: string; name: string; verify: boolean, type: 'therapist' | 'org' } | null>(null);
  const [toggleModal, setToggleModal] = useState<{ open: boolean; id: string; name: string; allow: boolean } | null>(null);
  const [planModal, setPlanModal] = useState<{ open: boolean, plan?: any } | null>(null);
  const [planForm, setPlanForm] = useState({ 
    name: '', 
    price: 0, 
    audience: 'therapist', 
    features: '', 
    isActive: true,
    durationMonths: 1,
    config: {
      dailyChatLimit: 300,
      hasPriorityBooking: false,
      therapistDiscount: 0,
      hasUnlimitedJournal: false,
      enableChat: true,
      enableTherapistAccess: true,
      enableJournaling: true,
      enableMoodCheck: true,
      enableBreathe: true,
      enableScheduling: true,
      enableBookings: true,
      enableEarnings: true,
      enableProfileControl: true,
      enableRosterManagement: true,
      enableTherapistAffiliation: true,
      enableAnalytics: true
    }
  });
  const [adminPassword, setAdminPassword] = useState('');

  const { data: therapistsData, isLoading: therapistsLoading } = useQuery({
    queryKey: ['admin-therapists'],
    queryFn: () => API.admin.pendingTherapists(),
  });

  const { data: subsData } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => API.subscription.admin.all(),
    enabled: tab === 'subscriptions',
  });

  const { data: orgsData, isLoading: orgsLoading } = useQuery({
    queryKey: ['admin-orgs'],
    queryFn: () => API.admin.pendingOrgs(),
    enabled: tab === 'organizations' || tab === 'overview',
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => API.plan.getAll(),
    enabled: tab === 'plans',
  });

  const { data: countsData } = useQuery({
    queryKey: ['admin-platform-counts'],
    queryFn: () => API.admin.platformCounts(),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified, password, type }: { id: string; verified: boolean; password?: string, type: 'therapist' | 'org' }) => {
      return type === 'therapist' 
        ? API.admin.verifyTherapist(id, { verified, password })
        : API.admin.verifyOrg(id, { verified, password });
    },
    onSuccess: (_, { verified, type }) => {
      setVerifyModal(null);
      setAdminPassword('');
      toast.success(verified ? `${type} verified ✓` : 'Verification removed');
      qc.invalidateQueries({ queryKey: [`admin-${type}s`] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, allow, password }: { id: string; allow: boolean; password?: string }) => {
      return API.admin.toggleExternalTherapists(id, { allow, password });
    },
    onSuccess: (_, { allow }) => {
      setToggleModal(null);
      setAdminPassword('');
      toast.success(allow ? 'External therapists enabled ✓' : 'External therapists disabled');
      qc.invalidateQueries({ queryKey: ['admin-orgs'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const planMutation = useMutation({
    mutationFn: ({ id, data, isDelete }: { id?: string, data?: any, isDelete?: boolean }) => {
      if (isDelete) return API.admin.deletePlan(id!, { password: adminPassword });
      if (id) return API.admin.updatePlan(id, { ...data, password: adminPassword });
      return API.admin.createPlan({ ...data, password: adminPassword });
    },
    onSuccess: (_, { isDelete }) => {
      setPlanModal(null);
      setAdminPassword('');
      toast.success(isDelete ? 'Plan marked inactive' : 'Plan saved successfully');
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      qc.invalidateQueries({ queryKey: ['subscription-plans'] });
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ therapistId, password }: { therapistId: string; password: string }) =>
      API.admin.markTherapistPaid(therapistId, { password }),
    onSuccess: (data) => {
      toast.success(data.message || 'Payout marked successfully ✓');
      setAdminPassword('');
      qc.invalidateQueries({ queryKey: ['admin-therapists'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const therapists: any[] = therapistsData?.therapists ?? [];
  const filteredTherapists = therapists.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.rciNumber?.toLowerCase().includes(search.toLowerCase())
  );
  const subscriptions: any[] = (subsData?.subscriptions ?? []).filter((s: any) => s.userId?.role !== 'super_admin');

  const orgs: any[] = orgsData?.organizations ?? [];
  const filteredOrgs = orgs.filter((o) =>
    o.name?.toLowerCase().includes(search.toLowerCase())
  );

  const plans: any[] = plansData?.plans ?? [];

  const platformStats = {
    totalTherapists: therapists.length,
    verified: therapists.filter((t) => t.verified).length,
    pending: therapists.filter((t) => !t.verified).length + orgs.filter((o) => o.verificationStatus !== 'verified').length,
    paidSubs: subscriptions.filter((s) => s.status === 'active').length,
    totalUsers: countsData?.userCount ?? 0,
    totalOrgs: countsData?.orgCount ?? orgs.length,
  };

  // Build chart data from all therapists (only those with earnings)
  const earningsChartData = therapists
    .filter(t => (t.grossEarnings ?? 0) > 0)
    .sort((a, b) => (b.grossEarnings ?? 0) - (a.grossEarnings ?? 0))
    .slice(0, 10)
    .map(t => ({
      name: (t.name ?? 'Unknown').split(' ')[0],
      Gross: t.grossEarnings ?? 0,
      'Net (70%)': t.totalPayout ?? 0,
    }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-800">
              <Shield className="size-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">mymindtherapyfriend Super Admin</p>
              <p className="text-xs text-slate-400">Ops · Verification · Analytics</p>
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

      {/* Tab Nav */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {(['overview', 'therapists', 'organizations', 'subscriptions', 'plans', 'earnings'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold capitalize transition border-b-2 ${
                tab === t ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Platform Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: platformStats.totalUsers, icon: Users, color: 'bg-sky-600' },
                { label: 'Total Therapists', value: platformStats.totalTherapists, icon: CheckCircle, color: 'bg-blue-600' },
                { label: 'Organizations', value: platformStats.totalOrgs, icon: Building2, color: 'bg-indigo-600' },
                { label: 'Active Subscriptions', value: platformStats.paidSubs, icon: TrendingUp, color: 'bg-violet-600' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <div className={`grid size-9 place-items-center rounded-lg ${s.color} mb-3`}>
                    <s.icon className="size-4 text-white" />
                  </div>
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'RCI Verified Therapists', value: platformStats.verified, color: 'text-green-400' },
                { label: 'Pending Review', value: platformStats.pending, color: 'text-amber-400' },
                { label: 'Total Gross Revenue', value: `₹${therapists.reduce((s, t) => s + (t.grossEarnings ?? 0), 0).toLocaleString('en-IN')}`, color: 'text-violet-400' },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Booking-based revenue summary */}
            <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 rounded-xl border border-emerald-800 p-6">
              <p className="text-xs text-emerald-400 uppercase tracking-wider font-bold mb-3">Total Booking Revenue</p>
              <p className="text-4xl font-black text-white">
                ₹{therapists.reduce((s, t) => s + (t.grossEarnings ?? 0), 0).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-emerald-300 mt-1">
                Payout due (70%): ₹{therapists.reduce((s, t) => s + (t.totalPayout ?? 0), 0).toLocaleString('en-IN')} · Commission (30%): ₹{therapists.reduce((s, t) => s + (t.platformCommission ?? 0), 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}

        {/* THERAPISTS TAB */}
        {tab === 'therapists' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white flex-1">Therapist Verification</h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or RCI…"
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
            </div>

            {therapistsLoading && (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-800 animate-pulse" />)}
              </div>
            )}

            <div className="space-y-3">
              {filteredTherapists.map((t) => (
                <div key={t.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-full bg-slate-700 text-white font-bold text-lg flex-shrink-0">
                    {t.name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">RCI: {t.rciNumber || 'Not provided'}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(t.specializations ?? []).slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                    {/* Expanded details */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-700 pt-3">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1">Professional Details</p>
                        <p className="text-xs text-slate-300">Tier: {t.experienceCategory}</p>
                        <p className="text-xs text-slate-300">Fee: ₹{t.sessionFee}</p>
                        <p className="text-xs text-slate-300">Qual: {t.qualification}</p>
                        <p className="text-xs text-slate-300 line-clamp-1" title={t.clinicDetails}>Clinic: {t.clinicDetails}</p>
                        {t.email && <p className="text-xs text-slate-300">Email: {t.email}</p>}
                        {t.website && (
                          <p className="text-xs text-slate-300 line-clamp-1" title={t.website}>
                            Website: <a href={t.website} target="_blank" rel="noreferrer" className="text-violet-450 text-violet-400 hover:underline">{t.website} ↗</a>
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1">Earnings & Payouts</p>
                        <p className="text-xs text-slate-300">Total Bookings: {t.totalBookings}</p>
                        <p className="text-xs text-slate-300">Sessions Given: {t.sessionsGiven}</p>
                        <p className="text-xs text-slate-300">Gross Earned (100%): ₹{(t.grossEarnings ?? 0).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-red-400">Platform Fee (30%): -₹{(t.platformCommission ?? 0).toLocaleString('en-IN')}</p>
                        <p className="text-xs font-bold text-emerald-450 text-emerald-400">Payout Due (70%): ₹{(t.totalPayout ?? 0).toLocaleString('en-IN')}</p>
                        <div className="flex flex-col gap-1 mt-1">
                          {t.documents?.degreeUrl && <a href={t.documents.degreeUrl} target="_blank" className="text-[11px] text-violet-400 hover:underline">Degree / Certificate ↗</a>}
                          {t.documents?.licenseUrl && <a href={t.documents.licenseUrl} target="_blank" className="text-[11px] text-violet-400 hover:underline">License / RCI ↗</a>}
                          {t.documents?.governmentIdUrl && <a href={t.documents.governmentIdUrl} target="_blank" className="text-[11px] text-violet-400 hover:underline">Government ID ↗</a>}
                          {t.introVideoUrl && <a href={t.introVideoUrl} target="_blank" className="text-[11px] text-blue-400 hover:underline">Intro Video ↗</a>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1">Payment Details</p>
                        {t.paymentDetails?.upiId ? (
                          <p className="text-xs text-slate-300 font-mono">UPI: {t.paymentDetails.upiId}</p>
                        ) : null}
                        {t.paymentDetails?.bankDetails ? (
                          <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-tight">{t.paymentDetails.bankDetails}</p>
                        ) : null}
                        {!t.paymentDetails?.upiId && !t.paymentDetails?.bankDetails ? (
                          <p className="text-xs text-slate-500 italic">No banking info added</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-4 flex-shrink-0 self-stretch">
                    <div className="flex items-center gap-1">
                      <Star className="size-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-slate-300">{t.rating?.toFixed(1) ?? '—'}</span>
                    </div>
                    {t.verified ? (
                      <button onClick={() => setVerifyModal({ open: true, id: t.id, name: t.name, verify: false, type: 'therapist' })}
                        className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-900/30 border border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-900/50 transition">
                        <XCircle className="size-3.5" /> Revoke
                      </button>
                    ) : (
                      <button onClick={() => setVerifyModal({ open: true, id: t.id, name: t.name, verify: true, type: 'therapist' })}
                        className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-900/30 border border-green-800 px-3 py-1.5 rounded-lg hover:bg-green-900/50 transition">
                        <CheckCircle className="size-3.5" /> Verify
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredTherapists.length === 0 && !therapistsLoading && (
                <p className="text-slate-500 text-sm text-center py-8">No therapists found</p>
              )}
            </div>
          </div>
        )}

        {/* ORGANIZATIONS TAB */}
        {tab === 'organizations' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white flex-1">Organization Verification</h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
            </div>

            {orgsLoading && (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-slate-800 animate-pulse" />)}
              </div>
            )}

            <div className="space-y-3">
              {filteredOrgs.map((o) => (
                <div key={o.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-xl bg-slate-700 text-white font-bold text-lg flex-shrink-0">
                    <Building2 className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{o.name}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">{o.type}</p>
                    
                    {/* Expanded details */}
                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-700 pt-3">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1">Contact Details</p>
                        <p className="text-xs text-slate-300">Rep: {o.contactPerson}</p>
                        <p className="text-xs text-slate-300">Email: {o.officialEmail}</p>
                        <p className="text-xs text-slate-300">Phone: {o.phone}</p>
                        <p className="text-xs text-slate-300 line-clamp-1">Address: {o.address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-1">Verification Links</p>
                        <div className="flex flex-col gap-1">
                          {o.documents?.registrationUrl && <a href={o.documents.registrationUrl} target="_blank" className="text-xs text-violet-400 hover:underline">Registration / Trust ↗</a>}
                          {o.documents?.accreditationUrl && <a href={o.documents.accreditationUrl} target="_blank" className="text-xs text-violet-400 hover:underline">Accreditation ↗</a>}
                          {o.documents?.governmentIdUrl && <a href={o.documents.governmentIdUrl} target="_blank" className="text-xs text-violet-400 hover:underline">Government ID ↗</a>}
                          {o.website && <a href={o.website} target="_blank" className="text-xs text-blue-400 hover:underline">Website ↗</a>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-4 flex-shrink-0 self-stretch">
                    <div className="flex flex-col items-end gap-2">
                      {o.verificationStatus === 'pending' && <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded">Pending</span>}
                      <button 
                        onClick={() => setToggleModal({ open: true, id: o.id, name: o.name, allow: !o.allowExternalTherapists })}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                          o.allowExternalTherapists 
                            ? 'bg-violet-900/40 text-violet-300 border border-violet-800 hover:bg-violet-900/60' 
                            : 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600'
                        }`}
                      >
                        {o.allowExternalTherapists ? 'External Therapists: ON' : 'External Therapists: OFF'}
                      </button>
                    </div>
                    {o.verificationStatus === 'verified' ? (
                      <button onClick={() => setVerifyModal({ open: true, id: o.id, name: o.name, verify: false, type: 'org' })}
                        className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-900/30 border border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-900/50 transition">
                        <XCircle className="size-3.5" /> Revoke
                      </button>
                    ) : (
                      <button onClick={() => setVerifyModal({ open: true, id: o.id, name: o.name, verify: true, type: 'org' })}
                        className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-900/30 border border-green-800 px-3 py-1.5 rounded-lg hover:bg-green-900/50 transition">
                        <CheckCircle className="size-3.5" /> Verify
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredOrgs.length === 0 && !orgsLoading && (
                <p className="text-slate-500 text-sm text-center py-8">No pending organizations found</p>
              )}
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {tab === 'subscriptions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">All Subscriptions</h2>
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">User</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Plan</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Start</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subscriptions.slice(0, 50).map((s) => (
                    <tr key={s._id} className="hover:bg-slate-750 transition">
                      <td className="px-4 py-3">
                        <div className="text-slate-300 font-medium text-sm">
                          {s.userId?.orgId?.name || s.userId?.therapistProfile?.name || s.userId?.fullName || 'Unknown User'}
                        </div>
                        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                          {s.userId?.role || 'user'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          s.plan === 'apna_therapist' ? 'bg-violet-900 text-violet-300' : 'bg-blue-900 text-blue-300'
                        }`}>{s.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${
                          s.status === 'active' ? 'text-green-400' : 'text-slate-500'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(s.startDate).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No subscriptions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLANS TAB */}
        {tab === 'plans' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Subscription Plans</h2>
              <button 
                onClick={() => {
                  setPlanForm({ 
                    name: '', price: 0, audience: 'therapist', features: '', isActive: true,
                    durationMonths: 1,
                    config: { 
                      dailyChatLimit: 300, hasPriorityBooking: false, therapistDiscount: 0, hasUnlimitedJournal: false,
                      enableChat: true, enableTherapistAccess: true, enableJournaling: true, enableMoodCheck: true, enableBreathe: true,
                      enableScheduling: true, enableBookings: true, enableEarnings: true, enableProfileControl: true,
                      enableRosterManagement: true, enableTherapistAffiliation: true, enableAnalytics: true
                    }
                  });
                  setPlanModal({ open: true });
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition"
              >
                + Create New Plan
              </button>
            </div>

            {plansLoading && (
              <div className="grid md:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-slate-800 animate-pulse" />)}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {plans.map(p => (
                <div key={p._id} className={`bg-slate-800 rounded-xl border p-5 ${p.isActive ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold uppercase tracking-widest">{p.audience}</span>
                    {!p.isActive && <span className="text-[10px] text-red-400 bg-red-950 px-2 py-0.5 rounded font-bold">INACTIVE</span>}
                  </div>
                  <h3 className="font-bold text-white text-xl">{p.name}</h3>
                  <div className="mt-1 text-3xl font-black text-violet-400">₹{p.price}<span className="text-sm font-bold text-slate-500"> / {p.durationMonths || 1} mo</span></div>
                  <ul className="mt-4 mb-6 space-y-2 text-xs font-medium text-slate-400">
                    {p.features.map((f: string, i: number) => (
                      <li key={i} className="flex gap-2"><span className="text-violet-500">✓</span> {f}</li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <button onClick={() => {
                        setPlanForm({ 
                          name: p.name, 
                          price: p.price, 
                          audience: p.audience, 
                          features: p.features.join('\n'), 
                          isActive: p.isActive,
                          durationMonths: p.durationMonths ?? 1,
                          config: {
                            dailyChatLimit: p.config?.dailyChatLimit ?? 300,
                            hasPriorityBooking: p.config?.hasPriorityBooking ?? false,
                            therapistDiscount: p.config?.therapistDiscount ?? 0,
                            hasUnlimitedJournal: p.config?.hasUnlimitedJournal ?? false,
                            enableChat: p.config?.enableChat ?? true,
                            enableTherapistAccess: p.config?.enableTherapistAccess ?? true,
                            enableJournaling: p.config?.enableJournaling ?? true,
                            enableMoodCheck: p.config?.enableMoodCheck ?? true,
                            enableBreathe: p.config?.enableBreathe ?? true,
                            enableScheduling: p.config?.enableScheduling ?? true,
                            enableBookings: p.config?.enableBookings ?? true,
                            enableEarnings: p.config?.enableEarnings ?? true,
                            enableProfileControl: p.config?.enableProfileControl ?? true,
                            enableRosterManagement: p.config?.enableRosterManagement ?? true,
                            enableTherapistAffiliation: p.config?.enableTherapistAffiliation ?? true,
                            enableAnalytics: p.config?.enableAnalytics ?? true
                          }
                        });
                        setPlanModal({ open: true, plan: p });
                      }}
                      className="flex-1 border border-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition">
                      Edit Plan
                    </button>
                    {p.isActive && (
                      <button onClick={() => {
                          if (confirm('Are you sure you want to deactivate this plan?')) {
                            const pwd = prompt('Enter Admin Password to confirm delete:');
                            if (pwd) {
                              setAdminPassword(pwd);
                              planMutation.mutate({ id: p._id, isDelete: true });
                            }
                          }
                        }}
                        className="border border-red-900/50 text-red-400 hover:bg-red-950/50 px-3 py-2 rounded-lg text-xs font-bold transition">
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {plans.length === 0 && !plansLoading && (
                <div className="col-span-3 text-center py-10 border border-dashed border-slate-700 rounded-2xl text-slate-500">
                  No subscription plans created yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* EARNINGS TAB */}
        {tab === 'earnings' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Therapist Booking Earnings</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Booking-based revenue only. Click a therapist row to expand all individual bookings.
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search therapist..."
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Platform-wide totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: 'Total Gross (Bookings)',
                  value: `₹${therapists.reduce((s, t) => s + (t.grossEarnings ?? 0), 0).toLocaleString('en-IN')}`,
                  color: 'text-blue-400',
                  sub: `${therapists.reduce((s, t) => s + (t.sessionsGiven ?? 0), 0)} paid sessions across all therapists`,
                },
                {
                  label: 'Platform Commission (30%)',
                  value: `₹${therapists.reduce((s, t) => s + (t.platformCommission ?? 0), 0).toLocaleString('en-IN')}`,
                  color: 'text-red-400',
                  sub: 'mymindtherapyfriend retained',
                },
                {
                  label: 'Total Payout Due (70%)',
                  value: `₹${filteredTherapists.reduce((s, t) => s + (t.totalPayout ?? 0), 0).toLocaleString('en-IN')}`,
                  color: 'text-emerald-400',
                  sub: 'To be disbursed to therapists',
                },
              ].map((card) => (
                <div key={card.label} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <p className="text-xs text-slate-400 font-semibold">{card.label}</p>
                  <p className={`text-2xl font-black mt-2 ${card.color}`}>{card.value}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Per-therapist expandable ledger */}
            <div className="space-y-3">
              {filteredTherapists.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">No therapists found.</p>
              )}
              {filteredTherapists.map((t) => {
                const isExpanded = expandedTherapistId === t.id;
                const bookings: any[] = t.bookingDetails ?? [];
                return (
                  <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    {/* Therapist summary row */}
                    <button
                      onClick={() => setExpandedTherapistId(isExpanded ? null : t.id)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-750 transition text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid size-10 place-items-center rounded-xl bg-slate-700 text-slate-200 font-bold text-sm">
                          {t.name?.charAt(0) ?? 'T'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.email || 'No email'} · {t.sessionsGiven} paid sessions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-xs text-slate-500">Gross</p>
                          <p className="font-bold text-white">₹{(t.grossEarnings ?? 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Platform (30%)</p>
                          <p className="font-medium text-red-400">-₹{(t.platformCommission ?? 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Payout (70%)</p>
                          <p className="font-bold text-emerald-400">₹{(t.totalPayout ?? 0).toLocaleString('en-IN')}</p>
                        </div>
                        {(t.totalPayout ?? 0) > 0 && (
                          <button
                            disabled={markPaidMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              const pwd = prompt('Enter Admin Password to confirm payout:');
                              if (pwd) markPaidMutation.mutate({ therapistId: t.id, password: pwd });
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-900/60 transition disabled:opacity-50"
                          >
                            <Banknote className="size-3.5" /> Mark Paid
                          </button>
                        )}
                        <span className="text-slate-500 text-xs">{isExpanded ? '▲' : '▼'} {bookings.length} bookings</span>
                      </div>
                    </button>

                    {/* Expanded booking rows */}
                    {isExpanded && (
                      <div className="border-t border-slate-700">
                        {bookings.length === 0 ? (
                          <p className="text-slate-500 text-xs px-5 py-3">No bookings yet.</p>
                        ) : (
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="bg-slate-900/60 text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-2">Booking ID</th>
                                <th className="px-5 py-2">Date & Slot</th>
                                <th className="px-5 py-2">Fee</th>
                                <th className="px-5 py-2">Status</th>
                                <th className="px-5 py-2">Payout (70%)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {bookings.map((b: any) => {
                                const isEarned = b.status === 'completed' || (b.status === 'confirmed' && b.paid);
                                return (
                                  <tr key={b.id} className="text-slate-300 hover:bg-slate-700/30">
                                    <td className="px-5 py-2 font-mono text-[11px] text-slate-400">#{String(b.id).slice(-6)}</td>
                                    <td className="px-5 py-2">
                                      {b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </td>
                                    <td className="px-5 py-2 font-semibold text-white">₹{(b.fee ?? 0).toLocaleString('en-IN')}</td>
                                    <td className="px-5 py-2">
                                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                        b.status === 'completed' ? 'bg-blue-900/40 text-blue-400' :
                                        b.status === 'confirmed' ? 'bg-green-900/40 text-green-400' :
                                        b.status === 'cancelled' ? 'bg-red-900/40 text-red-400' :
                                        'bg-slate-700 text-slate-400'
                                      }`}>{b.status}</span>
                                    </td>
                                    <td className="px-5 py-2 font-semibold">
                                      {isEarned
                                        ? <span className="text-emerald-400">₹{Math.round((b.fee ?? 0) * 0.7).toLocaleString('en-IN')}</span>
                                        : <span className="text-slate-600">—</span>
                                      }
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-900/40 font-bold border-t border-slate-600">
                                <td colSpan={2} className="px-5 py-3 text-slate-300">Total ({t.sessionsGiven} paid)</td>
                                <td className="px-5 py-3 text-white">₹{(t.grossEarnings ?? 0).toLocaleString('en-IN')}</td>
                                <td className="px-5 py-3"></td>
                                <td className="px-5 py-3 text-emerald-400">₹{(t.totalPayout ?? 0).toLocaleString('en-IN')}</td>
                              </tr>
                            </tfoot>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Verify Password Modal */}
      <AnimatePresence>
        {verifyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/50">
                <h3 className="font-bold text-white">
                  {verifyModal.verify ? 'Verify Therapist' : 'Revoke Verification'}
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-400 mb-4">
                  {verifyModal.verify 
                    ? `Are you sure you want to verify Dr. ${verifyModal.name}? They will gain full access to the platform.`
                    : `Are you sure you want to revoke verification for Dr. ${verifyModal.name}? Their access will be restricted.`}
                </p>
                
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Admin Action Password</label>
                <input 
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                />
              </div>
              <div className="px-5 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                <button 
                  onClick={() => { setVerifyModal(null); setAdminPassword(''); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white transition">
                  Cancel
                </button>
                <button 
                  disabled={!adminPassword || verifyMutation.isPending}
                  onClick={() => verifyModal && verifyMutation.mutate({ id: verifyModal.id, verified: verifyModal.verify, password: adminPassword, type: verifyModal.type })}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${
                    verifyModal?.verify ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}>
                  {verifyMutation.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle External Therapists Modal */}
      <AnimatePresence>
        {toggleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/50">
                <h3 className="font-bold text-white">
                  {toggleModal.allow ? 'Enable External Therapists' : 'Disable External Therapists'}
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-400 mb-4">
                  {toggleModal.allow 
                    ? `Allow ${toggleModal.name} to send join requests to independent therapists?`
                    : `Disallow ${toggleModal.name} from sending join requests to independent therapists?`}
                </p>
                
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Admin Action Password</label>
                <input 
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                />
              </div>
              <div className="px-5 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                <button 
                  onClick={() => { setToggleModal(null); setAdminPassword(''); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white transition">
                  Cancel
                </button>
                <button 
                  disabled={!adminPassword || toggleMutation.isPending}
                  onClick={() => toggleModal && toggleMutation.mutate({ id: toggleModal.id, allow: toggleModal.allow, password: adminPassword })}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${
                    toggleModal?.allow ? 'bg-violet-600 hover:bg-violet-700' : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}>
                  {toggleMutation.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Form Modal */}
      <AnimatePresence>
        {planModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md max-h-full flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                <h3 className="font-bold text-white">
                  {planModal.plan ? 'Edit Subscription Plan' : 'Create New Plan'}
                </h3>
              </div>
              <div className="p-5 overflow-y-auto space-y-4">
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Plan Name</label>
                    <input value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Price (₹)</label>
                    <input type="number" value={planForm.price} onChange={e => setPlanForm({...planForm, price: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Validity</label>
                    <select value={planForm.durationMonths} onChange={e => setPlanForm({...planForm, durationMonths: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none">
                      <option value={1}>1 Month</option>
                      <option value={2}>2 Months</option>
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                      <option value={24}>24 Months</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Audience</label>
                  <select value={planForm.audience} onChange={e => {
                    const aud = e.target.value;
                    const updates: any = { audience: aud };
                    if (aud === 'user' && !planForm.features) {
                      updates.features = "Unlimited AI messages\nUnlimited journal entries\n30-day mood calendar\nAll 5 breathing exercises\n20% therapist discount\nPriority booking + instant access\nCrisis line 24/7";
                      updates.config = {
                        ...planForm.config,
                        dailyChatLimit: null,
                        hasUnlimitedJournal: true,
                        hasPriorityBooking: true,
                        therapistDiscount: 20,
                        enableMoodCheck: true,
                        enableBreathe: true,
                        enableChat: true
                      };
                    }
                    setPlanForm({...planForm, ...updates});
                  }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none">
                    <option value="therapist">Therapist</option>
                    <option value="user">User</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Features (one per line)</label>
                  <textarea value={planForm.features} onChange={e => setPlanForm({...planForm, features: e.target.value})} rows={5}
                    placeholder="Listing in directory\n10 bookings per month\nPriority support"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none" />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                    Plan Capabilities ({planForm.audience} focus)
                  </p>
                  
                  {/* USER PLAN OPTIONS */}
                  {planForm.audience === 'user' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Daily AI Messages</label>
                          <input type="number" 
                            value={planForm.config.dailyChatLimit === null ? '' : planForm.config.dailyChatLimit} 
                            onChange={e => setPlanForm({
                              ...planForm, 
                              config: { ...planForm.config, dailyChatLimit: e.target.value === '' ? (null as unknown as number) : Number(e.target.value) }
                            })}
                            placeholder="Unlimited"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Therapist Discount %</label>
                          <input type="number" 
                            value={planForm.config.therapistDiscount} 
                            onChange={e => setPlanForm({
                              ...planForm, 
                              config: { ...planForm.config, therapistDiscount: Number(e.target.value) }
                            })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.hasUnlimitedJournal} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, hasUnlimitedJournal: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Unlimited CBT Journaling</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.hasPriorityBooking} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, hasPriorityBooking: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Priority Booking Access</span>
                        </label>
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/50">
                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Toggle Portal Features</p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableChat ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableChat: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Manas AI Chat</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableTherapistAccess ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableTherapistAccess: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Therapist Matching & Booking</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableJournaling ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableJournaling: e.target.checked}})} />
                          <span className="text-sm text-slate-300">CBT Journal logs</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableMoodCheck ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableMoodCheck: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Mood Diary check-ins</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableBreathe ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableBreathe: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Breath Coaching widget</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* THERAPIST PLAN OPTIONS */}
                  {planForm.audience === 'therapist' && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Toggle Portal Features</p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableScheduling ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableScheduling: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Schedule Management (Slots)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableBookings ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableBookings: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Sessions Booking Logs</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableEarnings ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableEarnings: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Earnings Sheets & Statements</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableProfileControl ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableProfileControl: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Professional Listing Profile Edits</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ORGANIZATION PLAN OPTIONS */}
                  {planForm.audience === 'organization' && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Toggle Portal Features</p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableRosterManagement ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableRosterManagement: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Roster Management (Invites & Seats)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableTherapistAffiliation ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableTherapistAffiliation: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Therapist Affiliation Network</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.config.enableAnalytics ?? true} 
                            onChange={e => setPlanForm({...planForm, config: {...planForm.config, enableAnalytics: e.target.checked}})} />
                          <span className="text-sm text-slate-300">Workplace Mood & Bento Analytics</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={planForm.isActive} onChange={e => setPlanForm({...planForm, isActive: e.target.checked})}
                      className="rounded border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500" />
                    <span className="text-sm text-slate-200 group-hover:text-white transition font-bold">Plan is Active (visible to users)</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Admin Action Password</label>
                  <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Required to save"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none" />
                </div>

              </div>
              <div className="px-5 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3 mt-auto">
                <button onClick={() => { setPlanModal(null); setAdminPassword(''); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white transition">
                  Cancel
                </button>
                <button disabled={!adminPassword || planMutation.isPending || !planForm.name}
                  onClick={() => planMutation.mutate({ 
                    id: planModal.plan?._id, 
                    data: { ...planForm, features: planForm.features.split('\n').filter(Boolean) } 
                  })}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition disabled:opacity-50">
                  {planMutation.isPending ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
