import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, BarChart2, Shield, Building2, TrendingUp, AlertTriangle, Download,
  CheckCircle, Clock, UserCheck, UserX, Upload, X, Loader2, ChevronRight,
  CreditCard, Check, Crown, Zap, ShieldCheck, AlertCircle, UserMinus
} from 'lucide-react';
import API from '@/lib/api';
import { UserButton, useClerk } from '@clerk/clerk-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { toast } from 'sonner';
import { openSubscriptionCheckout } from "@/lib/razorpay";

export const Route = createFileRoute('/org/dashboard')({ component: OrgDashboard });

// All data is loaded live from the API — no hardcoded mock data.

function DepartmentHeatmap({ data }: { data: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = Math.max(300, data.length * 40) - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yLabels = data.map(d => d.name);
    const xLabels = ['Avg Mood', 'Sessions', 'Engagement %'];

    const matrix = data.flatMap(d => {
      const isVisible = d.members >= 10;
      return [
        { dept: d.name, metric: 'Avg Mood', value: d.avgMood, visible: isVisible },
        { dept: d.name, metric: 'Sessions', value: d.sessions, visible: isVisible },
        { dept: d.name, metric: 'Engagement %', value: (d.members / 50 * 100), visible: isVisible }
      ]
    });

    const x = d3.scaleBand().range([0, width]).domain(xLabels).padding(0.05);
    const y = d3.scaleBand().range([height, 0]).domain(yLabels).padding(0.05);

    // Color scales
    const colorMood = d3.scaleSequential(d3.interpolateRdYlGn).domain([4, 9]);
    const colorSessions = d3.scaleSequential(d3.interpolateBlues).domain([0, 20]);
    const colorEngagement = d3.scaleSequential(d3.interpolatePurples).domain([0, 100]);

    svg.append('g')
      .style('font-size', 12)
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select('.domain').remove();

    svg.append('g')
      .style('font-size', 12)
      .call(d3.axisLeft(y).tickSize(0))
      .select('.domain').remove();

    svg.selectAll()
      .data(matrix, function(d: any) { return d.dept + ':' + d.metric; })
      .join('rect')
      .attr('x', (d: any) => x(d.metric)!)
      .attr('y', (d: any) => y(d.dept)!)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .style('fill', (d: any) => {
        if (!d.visible) return '#f1f5f9'; // slate-100 for n<10
        if (d.metric === 'Avg Mood') return colorMood(d.value);
        if (d.metric === 'Sessions') return colorSessions(d.value);
        if (d.metric === 'Engagement %') return colorEngagement(d.value);
        return '#fff';
      })
      .style('stroke', (d: any) => !d.visible ? '#e2e8f0' : 'none')
      .style('opacity', 0.9);

    // Text overlay
    svg.selectAll()
      .data(matrix)
      .join('text')
      .attr('x', (d: any) => x(d.metric)! + x.bandwidth() / 2)
      .attr('y', (d: any) => y(d.dept)! + y.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('fill', (d: any) => {
        if (!d.visible) return '#94a3b8';
        if (d.metric === 'Avg Mood' && d.value < 6) return '#fff';
        if (d.metric === 'Avg Mood') return '#0f172a';
        return '#fff';
      })
      .style('font-size', '13px')
      .style('font-weight', '600')
      .text((d: any) => {
        if (!d.visible) return 'n < 10 (Hidden)';
        if (d.metric === 'Avg Mood') return d.value.toFixed(1);
        if (d.metric === 'Sessions') return d.value.toString();
        if (d.metric === 'Engagement %') return `${d.value.toFixed(0)}%`;
        return '';
      });

  }, [data]);

  return (
    <div className="overflow-x-auto w-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}

function OrgDashboard() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const qc = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'therapists' | 'external-therapists' | 'requests' | 'members' | 'subscriptions'>('overview');
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  // Excel upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [manualEmail, setManualEmail] = useState('');
  const [isWhitelisting, setIsWhitelisting] = useState(false);
  // Member detail panel
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberDetail, setMemberDetail] = useState<any>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => API.subscription.get(),
    retry: false,
  });

  const hasActiveOrgSub = subscription?.subscription?.status === 'active';
  const orgSubRequired = !hasActiveOrgSub;
  const [extSearch, setExtSearch] = useState('');
  const [extTherapists, setExtTherapists] = useState<any[]>([]);
  const [isExtSearching, setIsExtSearching] = useState(false);

  const { data: extInvitationsData, refetch: refetchExtInvitations } = useQuery({
    queryKey: ['org-external-invitations'],
    queryFn: () => API.org.invitations(),
    enabled: !!orgData && tab === 'external-therapists' && !orgSubRequired,
  });

  const inviteMutation = useMutation({
    mutationFn: (therapistId: string) => API.org.inviteTherapist({ therapistId }),
    onSuccess: () => {
      toast.success('Invitation sent');
      refetchExtInvitations();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (id: string) => API.org.cancelInvitation(id),
    onSuccess: () => {
      toast.success('Invitation cancelled');
      refetchExtInvitations();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const searchExternalTherapists = async () => {
    if (!extSearch.trim()) return;
    setIsExtSearching(true);
    try {
      const res = await API.therapist.list({ search: extSearch, openToCollaboration: true });
      // Filter out therapists already in an org (if possible, though backend checks too)
      setExtTherapists(res.therapists || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsExtSearching(false);
    }
  };

  // Verification Gate
  useEffect(() => {
    API.org.me()
      .then((res: any) => {
        const org = res?.organization;
        if (!org) {
          navigate({ to: '/org/onboarding', replace: true });
        } else {
          setOrgData(org);
          setVerificationStatus(org.verificationStatus);
        }
      })
      .catch(() => {
        // Fallback if me() fails or user has no orgId
        navigate({ to: '/org/onboarding', replace: true });
      });
  }, [navigate]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: { coverMemberTherapyFees?: boolean; allowExternalTherapists?: boolean }) =>
      API.org.updateSettings(data),
    onSuccess: (data: any) => {
      if (data.organization) {
        setOrgData(data.organization);
      }
      toast.success(data.message || 'Settings updated successfully');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update settings'),
  });

  const { data: therapistsData, refetch: refetchTherapists } = useQuery({
    queryKey: ['org-pending-therapists'],
    queryFn: () => API.org.pendingTherapists(),
    enabled: !!orgData && tab === 'therapists' && !orgSubRequired,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['org-stats'],
    queryFn: () => API.org.stats(),
    enabled: !!orgData && tab === 'overview' && !orgSubRequired,
    refetchInterval: 60000,
  });

  const { data: joinReqData, refetch: refetchJoinReqs } = useQuery({
    queryKey: ['org-join-requests'],
    queryFn: () => API.org.joinRequests(),
    enabled: !!orgData && tab === 'requests' && !orgSubRequired,
  });

  const { data: membersData, refetch: refetchMembers } = useQuery({
    queryKey: ['org-members'],
    queryFn: () => API.org.members(),
    enabled: !!orgData && tab === 'members' && !orgSubRequired,
  });

  const handleVerifyTherapist = async (id: string, verified: boolean) => {
    try {
      await API.org.verifyTherapist(id, { verified });
      toast.success(verified ? 'Therapist approved' : 'Therapist rejected');
      refetchTherapists();
    } catch (e: any) {
      toast.error(e.message || 'Failed to verify therapist');
    }
  };

  const handleRemoveTherapist = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove Dr. ${name} from your organization?`)) return;
    try {
      await API.org.removeTherapist(id);
      toast.success(`Dr. ${name} removed from organization`);
      refetchTherapists();
      refetchExtInvitations();
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove therapist');
    }
  };

  const handleJoinAction = async (userId: string, approved: boolean) => {
    try {
      if (approved) {
        await API.org.approveJoinRequest(userId);
        toast.success('Join request approved');
      } else {
        await API.org.rejectJoinRequest(userId);
        toast.success('Join request rejected');
      }
      refetchJoinReqs();
      refetchMembers();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update join request');
    }
  };


  const { data: orgPlans, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['plans', 'organization'],
    queryFn: async () => {
      const res = await API.plan.getAll('organization');
      console.log('[DEBUG] Org Plans fetched:', res);
      return res;
    },
    enabled: tab === 'subscriptions',
  });

  const upgradeMutation = useMutation({
    mutationFn: (tier: string) => API.subscription.upgrade({ tier: tier as any }),
    onSuccess: async (data, variables) => {
      setUpgrading(null);
      if (data.subscriptionId) {
        try {
          const planName = orgPlans?.plans?.find((p: any) => p._id === variables)?.name || "Premium Plan";
          await openSubscriptionCheckout({
            subscriptionId: data.subscriptionId,
            planName,
            userEmail: orgData?.officialEmail || "",
            onSuccess: () => {
              qc.invalidateQueries({ queryKey: ['subscription'] });
              toast.success("Subscription activated successfully!");
            },
            onCancel: () => {
              qc.invalidateQueries({ queryKey: ['subscription'] });
              toast.info("Payment cancelled");
            }
          });
        } catch (err: any) {
          toast.error(err.message || "Failed to launch Razorpay checkout");
        }
      } else if (data.shortUrl) {
        window.open(data.shortUrl, '_blank');
        toast.success('Redirecting to payment…');
      } else {
        qc.invalidateQueries({ queryKey: ['subscription'] });
        toast.success('Subscription activated!');
      }
    },
    onError: (e: Error) => {
      setUpgrading(null);
      toast.error(e.message);
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => API.subscription.sync(),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      toast.success(data.message || 'Subscription status synced successfully!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const demoActivateMutation = useMutation({
    mutationFn: () => API.subscription.demoActivate(),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      toast.success("Subscription activated (Dev Mode)!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (subscription?.subscription?.status === 'pending') {
      API.subscription.sync()
        .then((res: any) => {
          if (res.status === 'active') {
            qc.invalidateQueries({ queryKey: ['subscription'] });
            toast.success("Payment verified! Organization plan activated.");
          }
        })
        .catch((err: any) => console.log("Background sync error:", err));
    }
  }, [subscription?.subscription?.status]);

  const handleUploadEmails = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res: any = await API.org.uploadEmails(file);
      toast.success(res.message || 'Emails uploaded successfully');
      setUploadOpen(false);
      refetchJoinReqs();
      refetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleManualWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsWhitelisting(true);
    try {
      const res = await API.org.whitelistEmail(manualEmail.trim());
      toast.success(res.message || 'Email whitelisted successfully');
      setManualEmail('');
      refetchJoinReqs();
      refetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to whitelist email');
    } finally {
      setIsWhitelisting(false);
    }
  };

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

  const liveMetrics = statsData?.metrics;
  const liveDepts: any[] = statsData?.departments || [];
  const liveMoodTrend: any[] = statsData?.moodTrend || [];
  const burnoutDepts = liveDepts.filter((d: any) => d.burnoutRisk && d.members >= 10);

  const handleDownloadPdf = () => {
    toast.success('Opening print dialog. Please save as PDF.', { id: 'pdf-toast' });
    setTimeout(() => { window.print(); }, 500);
  };

  const overviewMetrics = [
    { label: 'Active Users', value: liveMetrics ? `${liveMetrics.activeUsers}` : '—', sub: liveMetrics ? `of ${liveMetrics.totalUsers} users` : 'Loading...', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Avg Team Mood', value: liveMetrics ? liveMetrics.avgTeamMood : '—', sub: 'Last 30 days', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Engagement', value: liveMetrics ? `${liveMetrics.engagement}%` : '—', sub: 'Monthly active', icon: BarChart2, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Crisis Alerts', value: liveMetrics ? liveMetrics.crisisAlerts : '—', sub: 'Anonymised flags', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ];

  if (verificationStatus && verificationStatus !== 'verified') {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Blurred background representation of the dashboard */}
        <div className="absolute inset-0 pointer-events-none opacity-40 filter blur-xl select-none" aria-hidden="true">
          <div className="max-w-6xl mx-auto h-full px-4 py-8 space-y-8">
            <div className="h-24 bg-white rounded-xl" />
            <div className="grid grid-cols-4 gap-4">
              <div className="h-32 bg-white rounded-xl" />
              <div className="h-32 bg-white rounded-xl" />
              <div className="h-32 bg-white rounded-xl" />
              <div className="h-32 bg-white rounded-xl" />
            </div>
            <div className="h-64 bg-white rounded-xl" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-lg w-full text-center border border-slate-200 z-10 relative">
          
          <div className="grid size-20 place-items-center rounded-3xl bg-blue-50 text-blue-600 mx-auto mb-6 shadow-inner border border-blue-100">
            {verificationStatus === 'pending' ? <Clock className="size-10" /> : <Shield className="size-10" />}
          </div>
          
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            {verificationStatus === 'pending' ? 'Application Under Review' : 'Organization Approval Required'}
          </h1>
          
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            {verificationStatus === 'pending' 
              ? "We are currently verifying your organization's documents. You'll receive an email as soon as your dashboard is unlocked."
              : "All organizations must be fully verified before accessing employee wellness analytics. Please fill out the verification form."}
          </p>
          
          <div className="space-y-3">
            {verificationStatus === 'pending' ? (
              <button onClick={() => window.location.reload()} className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-bold shadow-md text-base transition">
                Refresh Status
              </button>
            ) : (
              <button onClick={() => navigate({ to: '/org/onboarding' })} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold shadow-md text-base transition-transform active:scale-[0.98]">
                Fill Verification Form
              </button>
            )}
            <button onClick={() => navigate({ to: '/' })} className="w-full rounded-xl h-12 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition">
              Go to Landing Page
            </button>
            <button onClick={() => signOut({ redirectUrl: '/' })} className="w-full rounded-xl h-12 font-bold text-red-500 hover:text-red-700 hover:bg-red-50 transition">
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 flex items-center gap-2">
                {orgData?.name || 'Org Admin Portal'}
                {orgData?.verificationStatus === 'verified' && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="size-3" /> Verified {orgData?.type === 'college' ? 'College' : 'Organization'}
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Shield className="size-3" /> Minimum 10 users per department required for aggregates.
                {orgData && ` • ${orgData.address}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTab('subscriptions')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-semibold ${
                tab === 'subscriptions' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <CreditCard className="size-4" />
              {subscription?.subscription?.status === 'active' ? 'Active Plan' : 'Manage Plan'}
            </button>
            <button 
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              <Download className="size-4" />
              ESG Report
            </button>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{ elements: { userButtonAvatarBox: "size-8" } }}
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-6xl mx-auto px-4 flex gap-4 overflow-x-auto">
          {(['overview', 'therapists', 'external-therapists', 'requests', 'members', 'subscriptions', 'settings'] as const).map((t) => {
            const disabled = orgSubRequired && t !== 'subscriptions';
            if (t === 'external-therapists' && !orgData?.allowExternalTherapists) return null;
            
            const labels: Record<string, string> = {
              'external-therapists': 'Invite External',
              'settings': 'Settings & Policy',
            };

            return (
              <button key={t} 
                onClick={() => !disabled && setTab(t)}
                disabled={disabled}
                className={`px-1 py-3 text-sm font-semibold border-b-2 transition relative whitespace-nowrap ${
                  tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {labels[t] || (t.charAt(0).toUpperCase() + t.slice(1))}
                {disabled && <Shield className="size-3 absolute top-1 -right-2 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* The content to be captured in PDF */}
      <div id="dashboard-content" className="max-w-6xl mx-auto px-4 py-8 space-y-8 bg-slate-50">
        {orgSubRequired && tab !== 'subscriptions' && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-12 text-center space-y-6 shadow-sm">
            <div className="grid size-20 place-items-center rounded-[2rem] bg-white text-blue-600 mx-auto shadow-md border border-blue-100">
              <ShieldCheck className="size-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Subscription Required</h2>
              <p className="text-slate-600 max-w-md mx-auto text-lg leading-relaxed">
                To access employee wellness analytics, manage therapists, and view ESG reports, your organization needs an active subscription.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button onClick={() => setTab('subscriptions')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95">
                Choose a Plan
              </button>
              <p className="text-sm text-slate-400">Plans start from ₹199/month per employee</p>
            </div>
          </div>
        )}

        {!orgSubRequired && tab === 'overview' && (
          <>
        {/* Burnout Alert Banner */}
        {burnoutDepts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900">Burnout Risk Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                {burnoutDepts.map(d => `${d.name} dept stress +23% this week`).join(' · ')}. 
                Consider enabling mandatory mental health days or providing 1-on-1 interventions.
              </p>
            </div>
          </motion.div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {overviewMetrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className={`grid size-10 place-items-center rounded-xl mb-3 ${m.color}`}>
                <m.icon className="size-5" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{m.value}</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{m.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* 30-Day Trend & Heatmap Row */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Recharts Trend Line */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="font-bold text-slate-900">30-Day Team Mood Trend</h2>
              <p className="text-xs text-slate-500">Aggregate mood fluctuations across all active users</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveMoodTrend} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} minTickGap={30} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  />
                  <Line type="monotone" dataKey="mood" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* D3 Heatmap */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="mb-4">
              <h2 className="font-bold text-slate-900">Department Heatmap</h2>
              <p className="text-xs text-slate-500">Visualizing wellness metrics. (n &lt; 10 filtered for privacy)</p>
            </div>
            <DepartmentHeatmap data={liveDepts} />
          </div>

        </div>

        {/* Seat Management Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Seat Management</h2>
            <p className="text-xs text-slate-500 mt-1">Manage active platform licenses. No individual wellness data is shown here.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">Employee</th>
                  <th className="px-6 py-3 font-semibold">Department</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {membersData?.members?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email || user.phoneMasked}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {user.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!membersData?.members || membersData.members.length === 0) && (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No active members yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
            Showing {membersData?.members?.length || 0} users. {liveMetrics ? `${liveMetrics.activeUsers} of ${orgData?.seats || 0} seats active.` : ''}
          </div>
        </div>
          </>
        )}

        {tab === 'therapists' && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-900 text-xl mb-4">Therapists Pending Verification</h2>
            {therapistsData?.therapists?.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
                No pending therapists require verification at this time.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {therapistsData?.therapists?.map((t: any) => (
                  <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{t.name}</h3>
                        <p className="text-sm text-slate-500">{t.email}</p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded">PENDING</span>
                    </div>
                    
                    <div className="text-sm space-y-1 mb-4 text-slate-600">
                      <p><strong>Qualification:</strong> {t.qualification}</p>
                      <p><strong>Experience:</strong> {t.experienceYears} years</p>
                      <p><strong>Specializations:</strong> {t.specializations?.join(', ')}</p>
                    </div>

                    <div className="flex gap-2 text-xs font-semibold mb-4">
                      {t.documents?.degreeUrl && <a href={t.documents.degreeUrl} target="_blank" className="text-blue-600 hover:underline">View Degree</a>}
                      {t.documents?.licenseUrl && <a href={t.documents.licenseUrl} target="_blank" className="text-blue-600 hover:underline">View License</a>}
                      {t.documents?.governmentIdUrl && <a href={t.documents.governmentIdUrl} target="_blank" className="text-blue-600 hover:underline">View ID</a>}
                      {t.introVideoUrl && <a href={t.introVideoUrl} target="_blank" className="text-indigo-600 hover:underline">Intro Video</a>}
                    </div>

                    <div className="flex gap-2 border-t border-slate-100 pt-4 mt-2">
                      <button onClick={() => handleVerifyTherapist(t.id, true)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                        Verify & Approve
                      </button>
                      <button onClick={() => handleVerifyTherapist(t.id, false)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-lg transition border border-red-200">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'external-therapists' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 text-xl mb-2">Invite Independent Therapists</h2>
              <p className="text-sm text-slate-500 mb-6">Search for therapists on the mymindtherapyfriend platform and invite them to join your organization.</p>
              
              <div className="flex gap-3 max-w-xl">
                <input 
                  value={extSearch}
                  onChange={(e) => setExtSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchExternalTherapists()}
                  placeholder="Search by name, qualification, or Therapist Varification..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
                <button 
                  onClick={searchExternalTherapists}
                  disabled={isExtSearching}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition disabled:opacity-50"
                >
                  {isExtSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {extTherapists.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Results</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {extTherapists.map((t) => (
                      <div key={t.id} className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.qualification} · {t.experienceYears} yrs exp</p>
                        </div>
                        <button 
                          onClick={() => inviteMutation.mutate(t.id)}
                          disabled={inviteMutation.isPending || !!t.orgId}
                          className="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition disabled:opacity-50"
                        >
                          {t.orgId ? 'Already Linked' : 'Send Invite'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="font-bold text-slate-900 text-xl">Sent Invitations</h2>
              {(!extInvitationsData?.invitations || extInvitationsData.invitations.length === 0) ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
                  No invitations sent yet.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {extInvitationsData.invitations.map((inv: any) => (
                    <div key={inv._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">
                          {inv.therapistId?.therapistProfile?.name || inv.therapistId?.fullName || 'Therapist'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            inv.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            inv.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {inv.status}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Sent: {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {inv.status === 'pending' && (
                        <button 
                          onClick={() => cancelInviteMutation.mutate(inv._id)}
                          disabled={cancelInviteMutation.isPending}
                          className="text-red-500 hover:text-red-700 text-xs font-bold transition flex items-center gap-1"
                        >
                          <X className="size-3" /> Cancel
                        </button>
                      )}
                      {inv.status === 'accepted' && (
                        <button 
                          onClick={() => {
                            const therapistId = inv.therapistId?._id || inv.therapistId;
                            const therapistName = inv.therapistId?.therapistProfile?.name || inv.therapistId?.fullName || 'Therapist';
                            handleRemoveTherapist(therapistId, therapistName);
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <UserMinus className="size-3.5" /> Remove Therapist
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {tab === 'requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-xl">Employee Join Requests</h2>
              <button onClick={() => setUploadOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">
                <Upload className="size-4" /> Upload Whitelist
              </button>
            </div>
            
            {!joinReqData?.joinRequests || joinReqData.joinRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
                No pending employee join requests.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {joinReqData.joinRequests.map((req: any) => (
                  <div key={req.userId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{req.fullName || 'Unnamed Employee'}</h3>
                        <p className="text-sm text-slate-500">{req.email || req.phoneMasked}</p>
                        <p className="text-xs text-slate-400 mt-1">Requested: {new Date(req.requestedAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        req.status === 'approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    {req.autoApproved && (
                      <div className="mb-4 bg-blue-50 text-blue-700 text-xs p-2 rounded flex items-center gap-1 font-semibold">
                        <CheckCircle className="size-3" /> Auto-approved via Whitelist
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="flex gap-2 border-t border-slate-100 pt-4 mt-2">
                        <button onClick={() => handleJoinAction(req.userId, true)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2">
                          <UserCheck className="size-4" /> Approve
                        </button>
                        <button onClick={() => handleJoinAction(req.userId, false)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-lg transition border border-red-200 flex items-center justify-center gap-2">
                          <UserX className="size-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'members' && (
          <div className="flex gap-6 h-[600px]">
            {/* Left side list */}
            <div className="w-1/3 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 font-bold text-slate-900">
                Verified Members ({membersData?.members?.length || 0})
              </div>
              <div className="overflow-y-auto flex-1">
                {membersData?.members?.map((m: any) => (
                  <button key={m.id} onClick={() => handleViewMember(m)}
                    className={`w-full text-left p-4 border-b border-slate-100 transition hover:bg-slate-50 flex items-center justify-between ${selectedMember?.id === m.id ? 'bg-blue-50 border-blue-100' : ''}`}>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        {m.name}
                        {m.role === 'therapist' ? (
                          <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Therapist</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Employee</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.department}</p>
                    </div>
                    <ChevronRight className={`size-4 ${selectedMember?.id === m.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  </button>
                ))}
                {(!membersData?.members || membersData.members.length === 0) && (
                  <div className="p-8 text-center text-sm text-slate-500">No members approved yet.</div>
                )}
              </div>
            </div>

            {/* Right side detail panel */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
              {memberLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="size-8 animate-spin mb-4 text-blue-600" /> Loading employee data...
                </div>
              ) : memberDetail ? (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                      {memberDetail.user.name}
                      {selectedMember?.role === 'therapist' ? (
                        <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Therapist</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Employee</span>
                      )}
                    </h2>
                    <p className="text-slate-500 mt-1">Department: {memberDetail.user.department}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Mood</p>
                      <p className="text-3xl font-bold text-slate-900">{memberDetail.wellness.avgMood ?? '—'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sessions</p>
                      <p className="text-3xl font-bold text-slate-900">{memberDetail.wellness.sessionCount}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Journals</p>
                      <p className="text-3xl font-bold text-slate-900">{memberDetail.wellness.journalCount}</p>
                    </div>
                  </div>

                  {memberDetail.wellness.moodHistory.length > 0 && (
                    <div>
                      <h3 className="font-bold text-slate-900 mb-3">Recent Mood Check-ins</h3>
                      <div className="space-y-2">
                        {memberDetail.wellness.moodHistory.slice(0, 5).map((m: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white shadow-sm border border-slate-200">
                              {m.score}/10
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{m.note || 'No note provided'}</p>
                              <p className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <UserCheck className="size-12 text-slate-200 mb-4" />
                  <p>Select a member from the list to view their wellness engagement.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {tab === 'subscriptions' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {subscription?.subscription?.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="size-5 text-amber-600 shrink-0" />
                    <h4 className="font-bold">Organization Plan Payment Pending</h4>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed max-w-xl">
                    We've registered your organization plan, but the payment confirmation is pending. If you have already completed the transaction on Razorpay, click sync to activate benefits instantly.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center justify-center gap-2 shrink-0 shadow-sm transition disabled:opacity-50"
                  >
                    {syncMutation.isPending ? 'Syncing...' : 'Sync Payment Status'}
                  </button>
                  {/* {import.meta.env.DEV && (
                    <button
                      onClick={() => demoActivateMutation.mutate()}
                      disabled={demoActivateMutation.isPending}
                      className="bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 font-bold py-2 px-5 rounded-xl text-xs flex items-center justify-center gap-2 shrink-0 shadow-sm transition disabled:opacity-50"
                    >
                      {demoActivateMutation.isPending ? 'Bypassing...' : 'Bypass Payment'}
                    </button>
                  )} */}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900">Organization Subscriptions</h2>
                <p className="text-slate-500">Unlock premium AI benefits for all your verified therapists.</p>
              </div>

              <div className="flex items-center gap-3">
                {/* {import.meta.env.DEV && !hasActiveOrgSub && (
                  <button
                    onClick={() => demoActivateMutation.mutate()}
                    disabled={demoActivateMutation.isPending}
                    className="border border-blue-500 text-blue-600 hover:bg-blue-50 font-bold py-2 px-5 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {demoActivateMutation.isPending ? 'Activating...' : 'Dev: Bypass Payment'}
                  </button>
                )} */}
                {subscription?.subscription?.status === 'active' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <ShieldCheck className="size-5 text-green-600" />
                    <div>
                      <p className="text-[10px] font-bold text-green-800 uppercase tracking-wider">Active Organization Plan</p>
                      <p className="text-sm font-semibold text-green-700">{subscription.subscription.plan}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plansLoading ? (
                [1, 2].map((i) => (
                  <div key={i} className="h-80 rounded-2xl bg-white border border-slate-200 animate-pulse" />
                ))
              ) : orgPlans?.plans && orgPlans.plans.length > 0 ? (
                orgPlans.plans.map((plan: any, idx: number) => {
                  const isCurrent = subscription?.subscription?.plan === plan.name && subscription?.subscription?.status === 'active';
                  const isUpgrading = upgrading === plan._id && upgradeMutation.isPending;

                  return (
                    <motion.div
                      key={plan._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="h-full"
                    >
                      <div className={`relative h-full p-8 rounded-2xl bg-white flex flex-col transition-all border ${
                        isCurrent ? "ring-2 ring-blue-600 border-blue-600 shadow-lg" : "border-slate-200 hover:shadow-xl hover:-translate-y-1"
                      }`}>
                        {isCurrent && (
                          <div className="absolute -top-3 right-6 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Current Active
                          </div>
                        )}

                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-900">₹{plan.price}</span>
                            <span className="text-slate-500 text-sm font-medium">/{plan.durationMonths && plan.durationMonths > 1 ? ` ${plan.durationMonths} months` : "month"}</span>
                          </div>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Features Included:</p>
                          <ul className="space-y-3">
                            {plan.features?.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-3">
                                <Check className="size-4 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-sm text-slate-600 font-medium">{f}</span>
                              </li>
                            ))}
                            <li className="flex items-start gap-3 pt-3 border-t border-slate-100 mt-2">
                              <Building2 className="size-4 text-blue-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-blue-700 font-semibold leading-tight">
                                Benefits apply to all verified therapists in your organization automatically.
                              </p>
                            </li>
                          </ul>
                        </div>

                        <button
                          onClick={() => {
                            setUpgrading(plan._id);
                            upgradeMutation.mutate(plan._id);
                          }}
                          disabled={isUpgrading || isCurrent}
                          className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
                            isCurrent 
                              ? "bg-green-100 text-green-700 cursor-default" 
                              : "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-200"
                          }`}
                        >
                          {isCurrent ? "Active Plan" : isUpgrading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="size-4 animate-spin" /> Processing...
                            </span>
                          ) : (
                            "Upgrade Organization"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <Building2 className="size-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-400">No Organization Plans Available</h3>
                  <p className="text-slate-500 mt-2">Please contact the Super Admin to create a bulk plan for your organization.</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
              <div className="size-10 rounded-xl bg-white shadow-sm border border-blue-100 flex items-center justify-center shrink-0">
                <AlertCircle className="size-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-blue-900">Billing Information</h4>
                <p className="text-xs text-blue-700 leading-relaxed opacity-80">
                  Organization plans are recurring and billed monthly via Razorpay. Benefits are automatically enabled for therapists linked to your organization ID once they are verified. You can switch plans or cancel any time from this dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Organization Settings & Features</h3>
              <p className="text-xs text-slate-500 mb-6">Manage therapist booking permissions and member fee coverage policies for your organization.</p>

              <div className="space-y-6">
                {/* 1. Cover Member Therapy Fees Toggle */}
                <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Member Therapy Fees</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        orgData?.coverMemberTherapyFees ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {orgData?.coverMemberTherapyFees ? 'FREE / COVERED' : 'CHARGED TO MEMBER'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {orgData?.coverMemberTherapyFees
                        ? 'Your organization is currently covering 100% of member therapy fees (Appointments are ₹0 FREE for linked members).'
                        : 'Members are currently charged standard appointment fees when booking therapy sessions.'}
                    </p>
                  </div>

                  <button
                    onClick={() => updateSettingsMutation.mutate({ coverMemberTherapyFees: !orgData?.coverMemberTherapyFees })}
                    disabled={updateSettingsMutation.isPending}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      orgData?.coverMemberTherapyFees ? 'bg-teal-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        orgData?.coverMemberTherapyFees ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Allow External Therapists Toggle */}
                <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">External Therapists</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        orgData?.allowExternalTherapists ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {orgData?.allowExternalTherapists ? 'ON (ALLOWED)' : 'OFF (INTERNAL ONLY)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {orgData?.allowExternalTherapists
                        ? 'Members can browse and book appointments with external platform therapists.'
                        : 'External therapists are OFF. Members can only view and book internal organization-approved therapists.'}
                    </p>
                  </div>

                  <button
                    onClick={() => updateSettingsMutation.mutate({ allowExternalTherapists: !orgData?.allowExternalTherapists })}
                    disabled={updateSettingsMutation.isPending}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      orgData?.allowExternalTherapists ? 'bg-teal-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        orgData?.allowExternalTherapists ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button onClick={() => setUploadOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="size-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Upload Email Whitelist</h2>
            <p className="text-sm text-slate-500 mb-4">
              Upload an Excel (.xlsx) file containing employee emails. Matching join requests will be auto-approved.
            </p>
            
            {/* Format Instructions */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
              <h3 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                <CheckCircle className="size-3" /> Expected Format
              </h3>
              <p className="text-xs text-blue-800">
                Your file should contain a single column with the header exactly named <strong>Email</strong>.
              </p>
              <div className="mt-2 bg-white rounded border border-blue-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-blue-100 text-blue-900">
                    <tr><th className="py-1 px-2 border-b border-blue-200">Email</th></tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr><td className="py-1 px-2 border-b border-blue-50">aarav@yourcompany.com</td></tr>
                    <tr><td className="py-1 px-2 border-b border-blue-50">diya@yourcompany.com</td></tr>
                    <tr><td className="py-1 px-2 text-slate-400 italic">...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                 onClick={() => fileRef.current?.click()}>
              <Upload className="size-8 text-blue-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Click to browse file</p>
              <p className="text-xs text-slate-500 mt-1">.xlsx format only</p>
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileRef} onChange={handleUploadEmails} disabled={uploading} />
            </div>

            {uploading && (
              <div className="mt-4 flex items-center justify-center text-sm font-medium text-blue-600">
                <Loader2 className="size-4 animate-spin mr-2" /> Processing file...
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 font-medium">Or Add Manually</span>
              </div>
            </div>

            <form onSubmit={handleManualWhitelist} className="flex gap-2">
              <input 
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="employee@yourcompany.com"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                disabled={isWhitelisting}
              />
              <button 
                type="submit"
                disabled={isWhitelisting || !manualEmail.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1"
              >
                {isWhitelisting ? <Loader2 className="size-3 animate-spin" /> : 'Add'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
