import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import API from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Share2, Calendar, ChevronRight, AlertCircle, Sparkles, Clock, Heart, Smile, CheckCircle2, ArrowLeft, Wallet, Plus } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const Route = createFileRoute('/reports')({ component: ReportsPage });

const AI_DOCTORS = [
  // { name: "Dr. Manas", role: "AI Emotional Wellness Specialist", initials: "DM", avatarBg: "bg-teal-600" },
  { name: "Dr. Amy Reid", role: "AI CBT Specialist", initials: "AR", avatarBg: "bg-blue-600" },
  { name: "Dr. Soniya", role: "AI Mindfulness Specialist", initials: "DS", avatarBg: "bg-purple-600" },
  { name: "Dr. Lisa", role: "AI Trauma-Informed Specialist", initials: "DL", avatarBg: "bg-rose-600" },
  { name: "Dr. Mohan", role: "AI Positive Psychology Expert", initials: "DM", avatarBg: "bg-amber-600" },
  { name: "Dr. Ram", role: "AI Clinical Wellness Counselor", initials: "DR", avatarBg: "bg-emerald-600" }
];

function moodColor(score: number) {
  if (score <= 3) return '#e11d48'; // Rose
  if (score <= 5) return '#f59e0b'; // Amber
  if (score <= 7) return '#10b981'; // Emerald
  return '#0d9488'; // Teal
}

function ReportsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => API.subscription.get(),
    retry: false,
  });
  const currentTier = subscription?.tier ?? "free";

  const [period, setPeriod] = useState<'day' | 'week' | 'fortnight' | 'month'>('fortnight');
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [unlocking, setUnlocking] = useState<boolean>(false);
  const [selectedAIDoctor, setSelectedAIDoctor] = useState<string>('Dr. Manas');

  useEffect(() => {
    if (currentTier === "free") {
      setPeriod("fortnight");
    } else {
      setPeriod("week");
    }
  }, [currentTier]);

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

    const originalGetComputedStyle = window.getComputedStyle;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext('2d');

    const oklchToRgb = (oklchStr: string) => {
      if (!tempCtx) return 'rgb(0,0,0)';
      try {
        tempCtx.clearRect(0, 0, 1, 1);
        tempCtx.fillStyle = oklchStr;
        tempCtx.fillRect(0, 0, 1, 1);
        const data = tempCtx.getImageData(0, 0, 1, 1).data;
        return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
      } catch (err) {
        return 'rgb(0,0,0)';
      }
    };

    try {
      window.getComputedStyle = function (el, pseudoElt) {
        const style = originalGetComputedStyle(el, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            const value = target[prop as keyof CSSStyleDeclaration];
            if (prop === 'getPropertyValue') {
              return function(name: string) {
                const val = target.getPropertyValue(name);
                if (typeof val === 'string' && val.includes('okl')) {
                  return val.replace(/okl(ch|ab)\([^)]+\)/g, (match) => oklchToRgb(match));
                }
                return val;
              };
            }
            if (typeof value === 'string' && value.includes('okl')) {
              return value.replace(/okl(ch|ab)\([^)]+\)/g, (match) => oklchToRgb(match));
            }
            if (typeof value === 'function') {
              return value.bind(target);
            }
            return value;
          },
        });
      };

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FCFAF7', // Canvas base color matching our theme
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('report-document');
          if (el) {
            // Force fixed desktop dimensions for standard A4 aspect/capture layout
            el.style.width = '800px';
            el.style.minWidth = '800px';
            el.style.maxWidth = '800px';
            el.style.padding = '32px';

            // Inject Google fonts directly to ensure correct font rendering inside the iframe
            const link = clonedDoc.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
            clonedDoc.head.appendChild(link);

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
      window.getComputedStyle = originalGetComputedStyle;
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
  const sortedMoods = [...(reportData?.moods || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
                {(currentTier === "free" ? (['day', 'fortnight', 'month'] as const) : (['day', 'week', 'month'] as const)).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm capitalize transition cursor-pointer ${
                      period === p
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70'
                    }`}
                  >
                    {p === 'fortnight' ? '15 Days' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Doctor Selector Card */}
            <div className="rounded-3xl bg-card p-6 shadow-sm border border-border space-y-4">
              <h2 className="font-display font-bold text-lg text-primary-deep flex items-center gap-2">
                <Sparkles className="size-5 text-accent" /> Select Doctor Reviewer
              </h2>
              <p className="text-xs text-muted-foreground">Choose which AI companion evaluates your patterns and signs the clinical analysis.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AI_DOCTORS.map((doc) => (
                  <button
                    key={doc.name}
                    type="button"
                    onClick={() => setSelectedAIDoctor(doc.name)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-28 cursor-pointer ${
                      selectedAIDoctor === doc.name
                        ? 'border-primary bg-primary-soft/30 ring-2 ring-primary/20'
                        : 'border-border/60 hover:bg-secondary/35 bg-secondary/10'
                    }`}
                  >
                    <div className={`size-8 rounded-full ${doc.avatarBg} text-white flex items-center justify-center font-bold text-[10px] shadow-sm`}>
                      {doc.initials}
                    </div>
                    <div className="mt-1">
                      <h4 className="font-bold text-[11px] text-slate-800 line-clamp-1">{doc.name}</h4>
                      <p className="text-[9px] text-muted-foreground leading-tight line-clamp-1">{doc.role}</p>
                    </div>
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

        {/* AI Therapist Analysis & Summary (Only for Weekly or 15-Day Report) */}
        {(period === 'week' || period === 'fortnight') && reportData && (
          <div className="rounded-3xl bg-card p-6 shadow-sm border border-border space-y-6">
            <div className="flex items-center justify-between border-b border-border/85 pb-4">
              <div>
                <h2 className="font-display font-bold text-xl text-primary-deep flex items-center gap-2">
                  <Sparkles className="size-5 text-accent" /> {period === 'week' ? 'Weekly' : '15-Day'} Clinical Summary
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Personalized emotional insights and patterns from the last {period === 'week' ? '7' : '15'} days.</p>
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
                    <div className={`size-10 rounded-full ${AI_DOCTORS.find(d => d.name === selectedAIDoctor)?.avatarBg || 'bg-accent'} text-white flex items-center justify-center font-bold text-sm`}>
                      {AI_DOCTORS.find(d => d.name === selectedAIDoctor)?.initials || 'DM'}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-primary-deep text-sm">Therapist Clinical Analysis</h3>
                      <p className="text-[10px] text-muted-foreground">Drafted by {selectedAIDoctor} • {AI_DOCTORS.find(d => d.name === selectedAIDoctor)?.role || 'Emotional Wellness Specialist'}</p>
                    </div>
                  </div>
                  
                  {/* Analysis Text content formatted cleanly */}
                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line border-l-2 border-accent/30 pl-4 py-1 italic">
                    {reportData.aiReport.aiAnalysis.replaceAll("Dr. Manas", selectedAIDoctor)}
                  </div>
                </div>

                {/* Therapist Booking Recommendation Callout */}
                <div className="rounded-2xl bg-secondary/30 border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-primary-deep text-sm flex items-center gap-1.5">
                      <Heart className="size-4 text-accent" /> Ready for deeper guidance?
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xl">
                      Based on {selectedAIDoctor}'s analysis of your {period === 'week' ? 'weekly' : '15-day'} logs, scheduling a direct 1-on-1 counseling session with a professional therapist can help you build custom coping mechanisms.
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
                    <h3 className="font-display font-bold text-lg">Unlock {period === 'week' ? 'Weekly' : '15-Day'} Therapist Clinical Evaluation</h3>
                    <p className="text-xs text-white/80 max-w-lg leading-relaxed">
                      Get a comprehensive clinical evaluation of your {period === 'week' ? 'weekly' : '15-day'} emotional patterns, mood trends, and journal reflections reviewed by our expert counselor to guide your healing journey.
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
                style={{ fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
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
                    <p className="text-slate-600 font-semibold">{new Date(reportData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="font-bold text-primary-deep mt-2">Coverage Period</p>
                    <p className="text-slate-600 font-semibold capitalize">{reportData.period} ({new Date(reportData.startDate).toLocaleDateString('en-IN')} - {new Date(reportData.endDate).toLocaleDateString('en-IN')})</p>
                  </div>
                </div>

                {/* Patient Summary */}
                <div className="grid grid-cols-3 gap-4 bg-white/50 border border-border/40 p-4 rounded-2xl">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Patient Profile</span>
                    <span className="font-bold text-primary-deep text-sm">{reportData.user?.fullName || 'Anonymous Patient'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Streak Days</span>
                    <span className="font-bold text-primary-deep text-sm">{reportData.user?.streak || 0} Days</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Average Mood</span>
                    <span className="font-bold text-primary-deep text-sm">
                      {reportData.avgMood !== null ? `${reportData.avgMood} / 10` : 'No mood logged'}
                    </span>
                  </div>
                </div>

                {/* Clinical Therapist Analysis (If Paid) */}
                {reportData.aiReport?.paid && (
                  <div className="bg-white p-5 rounded-2xl border border-primary/20 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-full ${AI_DOCTORS.find(d => d.name === selectedAIDoctor)?.avatarBg || 'bg-accent'} text-white flex items-center justify-center font-bold text-[10px]`}>
                        {AI_DOCTORS.find(d => d.name === selectedAIDoctor)?.initials || 'DM'}
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-primary-deep text-xs">Therapist Clinical Evaluation</h4>
                        <p className="text-[9px] text-muted-foreground">Drafted by {selectedAIDoctor} • {AI_DOCTORS.find(d => d.name === selectedAIDoctor)?.role || 'Emotional Wellness Specialist'}</p>
                      </div>
                    </div>
                    <div className="text-slate-700 text-xs leading-relaxed whitespace-pre-line border-l-2 border-accent/30 pl-4 py-1 italic">
                      {reportData.aiReport.aiAnalysis.replaceAll("Dr. Manas", selectedAIDoctor)}
                    </div>
                  </div>
                )}

                {/* Mood Trend Visualization */}
                {sortedMoods.length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-border/40 space-y-3 animate-fade-in">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mood Trend Graph</span>
                    <div className="relative w-full h-[150px] bg-[#EEF6F5]/20 rounded-xl p-3 border border-border/30">
                      <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
                        {/* Area Gradient Definitions */}
                        <defs>
                          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2E6E65" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#2E6E65" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Level lines (2, 4, 6, 8, 10) */}
                        {[2, 4, 6, 8, 10].map((level) => {
                          const y = 100 - (level / 10) * 80;
                          return (
                            <g key={level}>
                              <line x1="25" y1={y} x2="580" y2={y} stroke="#E2E8F0" strokeWidth="0.75" strokeDasharray="3,3" />
                              <text x="5" y={y + 3} fill="#94A3B8" fontSize="8" fontWeight="bold">{level}</text>
                            </g>
                          );
                        })}

                        {/* Gradient area under line */}
                        {sortedMoods.length > 1 && (
                          <path
                            d={`M 30 100 L ${sortedMoods.map((m, i) => `${(i / (sortedMoods.length - 1)) * 530 + 30} ${100 - (m.score / 10) * 80}`).join(' L ')} L ${(sortedMoods.length - 1) / (sortedMoods.length - 1) * 530 + 30} 100 Z`}
                            fill="url(#moodGradient)"
                          />
                        )}

                        {/* Trend line */}
                        {sortedMoods.length > 1 && (
                          <polyline
                            fill="none"
                            stroke="#2E6E65"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={sortedMoods.map((m, i) => `${(i / (sortedMoods.length - 1)) * 530 + 30},${100 - (m.score / 10) * 80}`).join(' ')}
                          />
                        )}

                        {/* Circles & Labels */}
                        {sortedMoods.map((m, i) => {
                          const x = sortedMoods.length > 1 ? (i / (sortedMoods.length - 1)) * 530 + 30 : 305;
                          const y = 100 - (m.score / 10) * 80;
                          return (
                            <g key={m.id || i}>
                              <circle cx={x} cy={y} r="5" fill="#FFFFFF" stroke="#2E6E65" strokeWidth="2.5" />
                              <circle cx={x} cy={y} r="2.5" fill="#F4845F" />
                              <text x={x} y={y - 8} fill="#1B4C46" fontSize="8" fontWeight="extrabold" textAnchor="middle">{m.score}</text>
                              <text x={x} y="112" fill="#64748B" fontSize="8" fontWeight="semibold" textAnchor="middle">
                                {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                )}

                {/* Mood Tracker Summary */}
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg text-primary-deep border-b border-border/50 pb-1.5 flex items-center gap-2">
                    <Heart className="text-accent" size={16} /> Mood Logs ({reportData.moods?.length || 0})
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
                    <Smile className="text-accent" size={16} /> CBT Journal Entries ({reportData.journals?.length || 0})
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
                                <Sparkles className="text-accent" size={12} /> Manas AI Reflection
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
                    <Sparkles className="text-accent" size={16} /> Manas AI Chat Activity ({reportData.chats?.length || 0})
                  </h3>
                  {reportData.chats?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No conversation logs logged in this timeframe.</p>
                  ) : (
                    <div className="space-y-2">
                      {reportData.chats.map((c: any, idx: number) => (
                        <div key={c.sessionId || idx} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-border/40 text-xs">
                          <div className="space-y-1.5 flex-1 pr-4">
                            <span className="text-xs font-bold text-slate-500">Session ID: #{c.sessionId?.slice(-6) || 'N/A'}</span>
                            <p className="text-slate-800 font-semibold text-sm whitespace-pre-wrap break-words">{c.summary}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`px-2 py-0.5 rounded-full font-bold tracking-wider uppercase text-[10px] ${
                              c.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                              c.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              Risk: {c.riskLevel}
                            </span>
                            <p className="text-slate-600 mt-1 font-semibold text-xs">
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
      
      {/* Downloading PDF Animation Overlay */}
      <AnimatePresence>
        {downloading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-white"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full mx-4 text-center space-y-6 shadow-2xl"
            >
              {/* Custom animated loader */}
              <div className="relative flex justify-center">
                <div className="size-20 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                <FileText className="size-8 text-accent absolute top-6 left-6 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg text-white">Generating PDF Report</h3>
                <p className="text-xs text-slate-400">Please wait while Manas structures your emotional logs and formats your download...</p>
              </div>
              {/* Visual progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-accent h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
