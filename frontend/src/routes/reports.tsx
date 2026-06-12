import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import API from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Share2, Calendar, ChevronRight, AlertCircle, Sparkles, Clock, Heart, Smile, CheckCircle2, ArrowLeft, Wallet, Plus } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const Route = createFileRoute('/reports')({ component: ReportsPage });

function moodColor(score: number) {
  if (score <= 3) return '#e11d48'; // Rose
  if (score <= 5) return '#f59e0b'; // Amber
  if (score <= 7) return '#10b981'; // Emerald
  return '#0d9488'; // Teal
}

function ReportsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [unlocking, setUnlocking] = useState<boolean>(false);

  const { data: walletData } = useQuery({
    queryKey: ["walletBalance"],
    queryFn: () => API.payment.getWalletBalance(),
  });
  const walletBalance = walletData?.walletBalance ?? 0;

  const handleUnlockAIReport = async () => {
    if (!reportData?.startDate || !reportData?.endDate) {
      toast.error("No report data loaded yet.");
      return;
    }
    if (walletBalance < 29) {
      toast.error("Insufficient wallet balance (₹29 required). Please add funds to your wallet.");
      navigate({ to: "/wallet" });
      return;
    }

    setUnlocking(true);
    toast.info("Processing wallet payment of ₹29...");

    try {
      await API.payment.payReportWallet({
        startDate: reportData.startDate,
        endDate: reportData.endDate,
      });
      toast.success("AI Therapist Analysis unlocked successfully using wallet!");
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      refetchReport();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to unlock therapist analysis");
    } finally {
      setUnlocking(false);
    }
  };

  // Queries
  const { data: reportData, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['report', period],
    queryFn: () => API.user.getReport(period),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => API.booking.list(),
  });

  const { data: sharesData, isLoading: sharesLoading } = useQuery({
    queryKey: ['reportShares'],
    queryFn: () => API.user.getShares(),
  });

  const shareMutation = useMutation({
    mutationFn: (data: { therapistId: string; period: string; notes?: string }) =>
      API.user.shareReport(data),
    onSuccess: () => {
      toast.success("Report shared successfully with your therapist!");
      queryClient.invalidateQueries({ queryKey: ['reportShares'] });
      setNotes("");
      setSelectedTherapist("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to share report");
    }
  });

  // Extract unique therapists that the user has booked
  const uniqueTherapists = Array.from(
    new Map(
      (bookingsData?.bookings || [])
        .filter((b: any) => b.therapistId)
        .map((b: any) => [b.therapistId, { id: b.therapistId, name: b.therapistName }])
    ).values()
  );

  const handleDownload = async () => {
    const element = document.getElementById('report-document');
    if (!element) return;
    setDownloading(true);
    toast.info("Generating PDF report...");

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FCFAF7', // Canvas base color matching our theme
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('report-document');
          if (el) {
            const overrides = {
              '--background': '#FCFAF7',
              '--foreground': '#2D3748',
              '--card': '#FFFFFF',
              '--card-foreground': '#2D3748',
              '--primary': '#2E6E65',
              '--primary-foreground': '#FCFCFC',
              '--primary-soft': '#EEF6F5',
              '--primary-deep': '#1B4C46',
              '--secondary': '#F0F4F4',
              '--muted': '#F0F0F0',
              '--muted-foreground': '#6B7280',
              '--accent': '#F4845F',
              '--accent-foreground': '#4A1D1A',
              '--accent-soft': '#FCEEEA',
              '--gold': '#F4C261',
              '--gold-foreground': '#5A3D0A',
              '--border': '#E2E8F0',
              '--crisis': '#DC2626',
              '--destructive': '#DC2626',
              '--ring': '#2E6E65',
            };
            Object.entries(overrides).forEach(([key, val]) => {
              el.style.setProperty(key, val);
            });
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`mymindtherapyfriend_wellness_report_${period}.pdf`);
      toast.success("Report downloaded successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTherapist) {
      toast.error("Please select a therapist to share with.");
      return;
    }
    shareMutation.mutate({
      therapistId: selectedTherapist,
      period,
      notes: notes.trim() || undefined
    });
  };

  const shares = sharesData?.shares || [];

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-accent mb-2 hover:underline">
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold text-primary-deep flex items-center gap-2">
              <FileText className="size-8 text-accent" /> Wellness Reports
            </h1>
            <p className="text-muted-foreground mt-1">Download your wellness activity or share it directly with your therapist.</p>
          </div>
        </div>

        {/* Configurations grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Controls Card */}
          <div className="md:col-span-2 space-y-6">
            {/* Period Selector Card */}
            <div className="rounded-3xl bg-card p-6 shadow-sm border border-border">
              <h2 className="font-display font-bold text-lg text-primary-deep mb-3 flex items-center gap-2">
                <Calendar className="size-5 text-accent" /> Choose Report Timeframe
              </h2>
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm capitalize transition ${
                      period === p
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Share Card */}
            <div className="rounded-3xl bg-card p-6 shadow-sm border border-border">
              <h2 className="font-display font-bold text-lg text-primary-deep mb-3 flex items-center gap-2">
                <Share2 className="size-5 text-accent" /> Share with Therapist
              </h2>
              {uniqueTherapists.length === 0 ? (
                <div className="rounded-2xl bg-secondary/20 p-5 text-center border border-dashed border-border">
                  <AlertCircle className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">You don't have any booked therapists yet.</p>
                  <Link to="/therapists" className="mt-3 inline-block bg-primary text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl transition hover:bg-primary-deep">
                    Find a Therapist
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleShare} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">1. Select Therapist</label>
                    <select
                      value={selectedTherapist}
                      onChange={(e) => setSelectedTherapist(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition"
                      required
                    >
                      <option value="">-- Choose Therapist --</option>
                      {uniqueTherapists.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">2. Optional Note to Therapist</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Hi Doctor, sharing my wellness summary for our next session..."
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary outline-none transition"
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={shareMutation.isPending}
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 rounded-xl shadow-md transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {shareMutation.isPending ? 'Sharing...' : <><Share2 className="size-4" /> Share {period} Report</>}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Share History Card */}
          <div className="rounded-3xl bg-card p-6 shadow-sm border border-border flex flex-col max-h-[460px]">
            <h2 className="font-display font-bold text-lg text-primary-deep mb-3 flex items-center gap-2">
              <Clock className="size-5 text-accent" /> Sharing History
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {sharesLoading ? (
                <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Loading shares...</div>
              ) : shares.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No reports shared yet.</p>
              ) : (
                shares.map((s: any) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-primary-deep">
                      <span>Shared with {s.therapistName}</span>
                      <span className="capitalize text-accent font-semibold">{s.period}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="size-3" /> {new Date(s.sharedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {s.notes && (
                      <p className="mt-2 text-muted-foreground italic border-l-2 border-primary/20 pl-2">
                        "{s.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Therapist Analysis & Weekly Summary (Only for Weekly Report) */}
        {period === 'week' && reportData && (
          <div className="rounded-3xl bg-card p-6 shadow-sm border border-border space-y-6">
            <div className="flex items-center justify-between border-b border-border/85 pb-4">
              <div>
                <h2 className="font-display font-bold text-xl text-primary-deep flex items-center gap-2">
                  <Sparkles className="size-5 text-accent" /> Weekly Clinical Summary
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Personalized emotional insights and patterns from the last 7 days.</p>
              </div>
              {reportData.aiReport?.paid && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Unlocked
                </span>
              )}
            </div>

            {/* If Paid, show Therapist Clinical Report */}
            {reportData.aiReport?.paid ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-primary-soft/30 border border-primary/20 p-5 md:p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                    <Sparkles className="size-24 text-primary" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
                      DM
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-primary-deep text-sm">Therapist Clinical Analysis</h3>
                      <p className="text-[10px] text-muted-foreground">Drafted by Dr. Manas • Emotional Wellness Specialist</p>
                    </div>
                  </div>
                  
                  {/* Analysis Text content formatted cleanly */}
                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line border-l-2 border-accent/30 pl-4 py-1 italic">
                    {reportData.aiReport.aiAnalysis}
                  </div>
                </div>

                {/* Therapist Booking Recommendation Callout */}
                <div className="rounded-2xl bg-secondary/30 border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-primary-deep text-sm flex items-center gap-1.5">
                      <Heart className="size-4 text-accent" /> Ready for deeper guidance?
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      Based on Dr. Manas's analysis of your weekly logs, scheduling a direct 1-on-1 counseling session with a human therapist can help you build custom coping mechanisms.
                    </p>
                  </div>
                  <Link
                    to="/therapists"
                    className="bg-accent hover:bg-accent/90 text-white font-bold text-xs py-3 px-5 rounded-xl text-center shadow-md transition whitespace-nowrap"
                  >
                    Find & Book a Therapist
                  </Link>
                </div>
              </div>
            ) : (
              /* If Unpaid, show Normal Summary + Unlock Card */
              <div className="space-y-5">
                {/* Normal Summary Section */}
                <div className="p-4 bg-secondary/20 rounded-2xl border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Normal Summary</span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {reportData.normalSummary}
                  </p>
                </div>

                {/* Premium Unlock CTA Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-deep to-primary-soft p-6 text-white border border-primary/20 space-y-4">
                  <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
                    <Sparkles className="size-48" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="bg-white/20 text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full inline-block">
                      Clinical Therapist Report
                    </span>
                    <h3 className="font-display font-bold text-lg">Unlock Weekly Therapist Clinical Evaluation</h3>
                    <p className="text-xs text-white/80 max-w-lg leading-relaxed">
                      Get a comprehensive clinical evaluation of your weekly emotional patterns, mood trends, and journal reflections reviewed by our expert counselor to guide your healing journey.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/10">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-white/70 block uppercase tracking-wider font-semibold">Premium Report Fee</span>
                      <span className="text-xl font-bold font-display">₹29.00 <span className="text-[10px] font-normal text-white/80">from wallet balance</span></span>
                    </div>
                    
                    <div className="flex gap-2 ml-auto">
                      {walletBalance >= 29 ? (
                        <button
                          onClick={handleUnlockAIReport}
                          disabled={unlocking}
                          className="bg-accent hover:bg-accent/95 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Wallet className="size-3.5" /> {unlocking ? 'Unlocking...' : 'Pay ₹29 from Wallet'}
                        </button>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <span className="text-xs text-white/80 mr-1">Balance: ₹{walletBalance.toFixed(2)}</span>
                          <Link
                            to="/wallet"
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-lg flex items-center gap-1.5"
                          >
                            <Plus className="size-3.5" /> Add Funds
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Download Action Widget */}
        <div className="flex items-center justify-between rounded-3xl bg-primary-soft/40 border border-primary/30 p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-deep text-lg">Download PDF Report</h3>
              <p className="text-xs text-muted-foreground">Get a physical copy of your logs to print or save.</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading || reportLoading}
            className="bg-primary hover:bg-primary-deep text-primary-foreground font-bold px-6 py-3 rounded-xl transition shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            {downloading ? 'Generating...' : <><Download className="size-4" /> Download</>}
          </button>
        </div>

        {/* Wellness Report Document Preview */}
        <div className="rounded-3xl bg-card p-6 shadow-sm border border-border space-y-4">
          <h2 className="font-display font-bold text-lg text-primary-deep">Report Document Preview</h2>
          <div className="border border-border/80 rounded-2xl overflow-hidden shadow-inner bg-secondary/20 p-2 md:p-6 flex justify-center">
            {reportLoading ? (
              <div className="h-96 flex flex-col items-center justify-center text-muted-foreground py-10">
                <div className="size-10 bg-accent animate-pulse rounded-full mb-3" />
                <span>Loading report summary...</span>
              </div>
            ) : reportData ? (
              /* A4 container styled to render perfectly on both web and PDF capture */
              <div
                id="report-document"
                className="w-full max-w-[700px] bg-[#FCFAF7] border border-border/40 shadow-lg p-8 text-slate-800 space-y-8 font-sans rounded-xl relative"
              >
                {/* Logo & Header */}
                <div className="flex justify-between items-start border-b border-primary/20 pb-6">
                  <div>
                    <span className="font-display text-xs font-bold text-accent uppercase tracking-widest">Wellness Report</span>
                    <h2 className="font-display text-3xl font-bold text-primary-deep mt-1">mymindtherapyfriend</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Emotional wellness & therapy companion</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-primary-deep">Date Generated</p>
                    <p className="text-muted-foreground">{new Date(reportData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="font-bold text-primary-deep mt-2">Coverage Period</p>
                    <p className="text-muted-foreground capitalize">{reportData.period} ({new Date(reportData.startDate).toLocaleDateString('en-IN')} - {new Date(reportData.endDate).toLocaleDateString('en-IN')})</p>
                  </div>
                </div>

                {/* Patient Summary */}
                <div className="grid grid-cols-3 gap-4 bg-white/50 border border-border/40 p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Patient Profile</span>
                    <span className="font-bold text-primary-deep text-sm">{reportData.user?.fullName || 'Anonymous Patient'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Streak Days</span>
                    <span className="font-bold text-primary-deep text-sm">{reportData.user?.streak || 0} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Average Mood</span>
                    <span className="font-bold text-primary-deep text-sm">
                      {reportData.avgMood !== null ? `${reportData.avgMood} / 10` : 'No mood logged'}
                    </span>
                  </div>
                </div>

                {/* Mood Tracker Summary */}
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg text-primary-deep border-b border-border/50 pb-1.5 flex items-center gap-2">
                    <Heart className="size-4 text-accent" /> Mood Logs ({reportData.moods?.length || 0})
                  </h3>
                  {reportData.moods?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No mood check-ins recorded in this timeframe.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {reportData.moods.map((m: any) => (
                        <div key={m.id} className="p-3 bg-white rounded-xl border border-border/40 text-xs flex flex-col justify-between space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-[10px]">
                              {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="size-5 rounded-full text-white font-bold grid place-items-center text-[10px]" style={{ backgroundColor: moodColor(m.score) }}>
                              {m.score}
                            </span>
                          </div>
                          {m.note && <p className="text-slate-600 italic line-clamp-2">"{m.note}"</p>}
                          {m.tags && m.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {m.tags.slice(0, 3).map((t: string, idx: number) => (
                                <span key={idx} className="bg-primary-soft/40 text-[9px] px-1 rounded text-primary-deep font-medium">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CBT Journal Logs */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-primary-deep border-b border-border/50 pb-1.5 flex items-center gap-2">
                    <Smile className="size-4 text-accent" /> CBT Journal Entries ({reportData.journals?.length || 0})
                  </h3>
                  {reportData.journals?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No CBT journal reflections added in this timeframe.</p>
                  ) : (
                    <div className="space-y-4">
                      {reportData.journals.map((j: any) => (
                        <div key={j.id} className="p-4 bg-white rounded-2xl border border-border/40 text-xs space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">{j.prompt}</h4>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-medium ml-2">
                              {new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">
                            <div>
                              <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider block mb-0.5">Situation</span>
                              <p className="text-slate-700">{j.situation}</p>
                            </div>
                            <div>
                              <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider block mb-0.5">Automatic Thought</span>
                              <p className="text-slate-700">{j.thought}</p>
                            </div>
                            <div>
                              <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider block mb-0.5">Emotional Feeling</span>
                              <p className="text-slate-700">{j.feeling}</p>
                            </div>
                            <div>
                              <span className="font-bold text-primary uppercase text-[9px] tracking-wider block mb-0.5">Reframed Narrative</span>
                              <p className="text-primary-deep font-semibold">{j.reframe}</p>
                            </div>
                          </div>
                          {j.aiResponse && (
                            <div className="mt-2.5 p-3 rounded-xl bg-[#FCFAF7] border border-primary/10">
                              <span className="font-bold uppercase text-[9px] tracking-wider text-accent flex items-center gap-1 mb-1">
                                <Sparkles className="size-3" /> Manas AI Reflection
                              </span>
                              <p className="text-slate-600 italic">"{j.aiResponse}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Chat Activity summaries */}
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg text-primary-deep border-b border-border/50 pb-1.5 flex items-center gap-2">
                    <Sparkles className="size-4 text-accent" /> Manas AI Chat Activity ({reportData.chats?.length || 0})
                  </h3>
                  {reportData.chats?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No conversation logs logged in this timeframe.</p>
                  ) : (
                    <div className="space-y-2">
                      {reportData.chats.map((c: any, idx: number) => (
                        <div key={c.sessionId || idx} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-border/40 text-xs">
                          <div className="space-y-0.5 max-w-[80%]">
                            <span className="text-[10px] font-bold text-muted-foreground">Session ID: #{c.sessionId?.slice(-6) || 'N/A'}</span>
                            <p className="text-slate-700 font-medium line-clamp-1">{c.summary}</p>
                          </div>
                          <div className="text-right text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full font-bold tracking-wider uppercase text-[8px] ${
                              c.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                              c.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              Risk: {c.riskLevel}
                            </span>
                            <p className="text-muted-foreground mt-1.5 font-medium">
                              {new Date(c.updatedAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer disclaimer */}
                <div className="border-t border-border/30 pt-4 text-center text-[10px] text-muted-foreground">
                  <p>mymindtherapyfriend is an emotional wellness platform. This summary is intended to assist in personal reflection and therapy, and is not a clinical diagnosis.</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No data found for this period.</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
