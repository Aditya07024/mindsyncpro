import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Users, Heart, HeartPulse, Coins, UserMinus, MessageCircle, Wrench, Sparkles, Building2, User, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { useStore, type Concern, type NeedType } from '@/lib/store';
import { ManasAvatar } from '@/components/ManasAvatar';
import API from '@/lib/api';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/onboarding')({ component: Onboarding });

const CONCERNS: { id: Concern; label: string; icon: any }[] = [
  { id: 'work', label: 'Work Stress', icon: Briefcase },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'loneliness', label: 'Loneliness', icon: UserMinus },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'relationships', label: 'Relationships', icon: Heart },
  { id: 'money', label: 'Money', icon: Coins },
];

const MOOD_EMOJIS = ['😞','😟','😕','😐','🙂','😊','😄','😁','🤩','🥰'];

function moodBg(score: number) {
  const t = (score - 1) / 9;
  const hueStart = 180;
  const hueEnd = 35;
  const hue = hueStart + (hueEnd - hueStart) * t;
  const light = 0.55 + 0.15 * t;
  return `oklch(${light} 0.10 ${hue})`;
}

function Onboarding() {
  const nav = useNavigate();
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  // Steps: 0=name, 1=type selection, 2=org picker (if linked), 3=mood, 4=concerns, 5=need, 6=Manas greeting
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [userType, setUserType] = useState<'individual' | 'org' | null>(null);

  // Org selection
  const [orgs, setOrgs] = useState<{ _id: string; name: string; type: string }[]>([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<{ _id: string; name: string } | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [joinMessage, setJoinMessage] = useState('');

  // Wellness data
  const [mood, setMood] = useState(5);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [need, setNeed] = useState<NeedType | null>(null);
  const [streamed, setStreamed] = useState('');
  const [streaming, setStreaming] = useState(false);

  // Auto-redirect therapists/admins
  useEffect(() => {
    API.auth.me().then(async (me: any) => {
      let role = me?.role ?? 'user';
      const intendedRole = localStorage.getItem('Mindsyncpro_intent_role');

      if (intendedRole) {
        localStorage.removeItem('Mindsyncpro_intent_role');
        if (intendedRole !== role) {
          try {
            await API.auth.setRole(intendedRole);
            role = intendedRole;
          } catch (err) {
            console.error('Failed to set intended role:', err);
          }
        }
      }

      if (role === 'therapist') nav({ to: '/therapist/onboarding', replace: true });
      else if (role === 'org_admin') nav({ to: '/org/onboarding', replace: true });
      else if (role === 'super_admin') nav({ to: '/admin/dashboard', replace: true });
      else if (me?.onboarding?.completedAt) nav({ to: '/dashboard', replace: true });
    }).catch(() => {});
  }, [nav]);

  // Load verified orgs when user selects org type
  useEffect(() => {
    if (step === 2) {
      setOrgLoading(true);
      API.org.verifiedOrgs()
        .then((res: any) => setOrgs(res?.organizations || []))
        .catch(() => setOrgs([]))
        .finally(() => setOrgLoading(false));
    }
  }, [step]);

  const toggleConcern = (c: Concern) => {
    setConcerns((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  };

  const handleTypeSelect = (type: 'individual' | 'org') => {
    setUserType(type);
    if (type === 'individual') {
      setStep(3); // Skip org step
    } else {
      setStep(2); // Show org picker
    }
  };

  const handleOrgNext = async () => {
    if (!selectedOrg) { setStep(3); return; }
    setJoinStatus('loading');
    try {
      const res: any = await API.org.requestJoin({ orgId: selectedOrg._id, email: employeeEmail });
      setJoinMessage(res.message || 'Join request submitted!');
      setJoinStatus('done');
    } catch (e: any) {
      setJoinMessage(e.message || 'Could not submit join request. You can continue anyway.');
      setJoinStatus('error');
    }
  };

  const filteredOrgs = orgs.filter(o =>
    o.name.toLowerCase().includes(orgSearch.toLowerCase())
  );

  const startFirstMessage = async (chosenNeed: NeedType) => {
    setNeed(chosenNeed);
    completeOnboarding({ firstName: firstName.trim() || 'friend', mood, concerns, need: chosenNeed });

    // Save to database
    try {
      await API.auth.updateOnboarding({
        moodScore: mood,
        concerns,
        primaryNeed: chosenNeed,
        completed: true,
      });
      
      // Update name if provided
      if (firstName.trim()) {
        await API.auth.updateProfile({ "Full name": firstName.trim() });
      }
    } catch (e) {
      console.error('Failed to save onboarding state:', e);
    }
    window.location.href = '/dashboard';
    return;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ── STEP 0: Name ── */}
        {step === 0 && (
          <motion.div key="s0" exit={{ opacity: 0 }} className="flex min-h-screen flex-col items-center justify-center bg-warm-gradient px-6 text-center text-primary-foreground">
            <div className="relative mb-12 size-48 flex items-center justify-center">
              <div className="absolute inset-0 animate-breathe rounded-full bg-white/20" />
              <div className="absolute inset-4 animate-breathe rounded-full bg-white/30" style={{ animationDelay: '0.4s' }} />
              <img src={logoUrl} alt="Mindsyncpro Logo" className="relative z-10 size-24 object-contain" />
            </div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }} className="font-display text-5xl font-bold md:text-6xl">
              Apna Dil Kholo
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="mt-4 text-lg text-primary-foreground/80">
              A safe space, just for you.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.8 }} className="mt-12 w-full max-w-xs space-y-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setStep(1)}
                placeholder="What should I call you?"
                className="w-full rounded-full border-0 bg-white/15 px-5 py-3 text-center text-primary-foreground placeholder:text-primary-foreground/60 backdrop-blur outline-none focus:bg-white/25"
              />
              <button onClick={() => setStep(1)} className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:scale-[1.02]">
                Begin
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ── STEP 1: Individual vs Org ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
            className="flex min-h-screen flex-col items-center justify-center bg-canvas-gradient px-6">
            <div className="w-full max-w-lg text-center mb-10">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                className="inline-flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-4">
                <Users className="size-8" />
              </motion.div>
              <h2 className="font-display text-3xl font-bold text-primary-deep md:text-4xl">
                Hi {firstName ? firstName : 'there'} 👋
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                Are you joining as an individual, or through your organisation?
              </p>
            </div>

            <div className="w-full max-w-lg grid sm:grid-cols-2 gap-4">
              {/* Individual Card */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelect('individual')}
                className="group relative overflow-hidden rounded-3xl bg-white border-2 border-border p-7 text-left shadow-sm hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                  <User className="size-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-primary-deep">Individual</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Join on your own. Your data stays private and only visible to you.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-violet-600">
                  Get started <span aria-hidden>→</span>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-50/0 to-violet-50/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.button>

              {/* Linked with Org Card */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTypeSelect('org')}
                className="group relative overflow-hidden rounded-3xl bg-white border-2 border-border p-7 text-left shadow-sm hover:border-blue-400/60 hover:shadow-lg transition-all"
              >
                <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                  <Building2 className="size-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-primary-deep">Linked with Organisation</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Connect through your company or college to access your organisation's wellness programme.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  Connect <span aria-hidden>→</span>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50/0 to-blue-50/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Org Picker ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.45 }}
            className="flex min-h-screen flex-col items-center justify-center bg-canvas-gradient px-6 py-12">
            <div className="w-full max-w-md">
              <button onClick={() => setStep(1)} className="mb-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                ← Back
              </button>
              <div className="rounded-3xl bg-white border border-border shadow-sm p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="grid size-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-primary-deep">Find Your Organisation</h2>
                    <p className="text-xs text-muted-foreground">Search from verified organisations on Mindsyncpro</p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    placeholder="Search organisation name..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Org list */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {orgLoading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="size-5 animate-spin mr-2" /> Loading organisations...
                    </div>
                  ) : filteredOrgs.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {orgs.length === 0 ? 'No verified organisations found.' : 'No results match your search.'}
                    </div>
                  ) : (
                    filteredOrgs.map(org => (
                      <button
                        key={org._id}
                        onClick={() => setSelectedOrg(selectedOrg?._id === org._id ? null : { _id: org._id, name: org.name })}
                        className={`w-full text-left rounded-xl px-4 py-3 border-2 transition-all flex items-center gap-3 ${
                          selectedOrg?._id === org._id
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-transparent bg-slate-50 hover:border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          selectedOrg?._id === org._id ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{org.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{org.type}</p>
                        </div>
                        {selectedOrg?._id === org._id && (
                          <CheckCircle2 className="size-5 text-blue-500 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Employee Email Input (Visible when an org is selected) */}
                <AnimatePresence>
                  {selectedOrg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div className="pt-2">
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Your Official Email (Optional)</label>
                        <input
                          type="email"
                          value={employeeEmail}
                          onChange={(e) => setEmployeeEmail(e.target.value)}
                          placeholder="e.g. aditya@college.edu"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 px-1">
                          Provide your official email for instant automatic approval.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status after request */}
                {joinStatus === 'done' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-sm flex items-start gap-2">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-green-600" />
                    {joinMessage}
                  </motion.div>
                )}
                {joinStatus === 'error' && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-sm">
                    {joinMessage}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  {joinStatus === 'idle' || joinStatus === 'loading' ? (
                    <>
                      <button
                        onClick={handleOrgNext}
                        disabled={joinStatus === 'loading'}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {joinStatus === 'loading'
                          ? <><Loader2 className="size-4 animate-spin" /> Sending request...</>
                          : selectedOrg ? `Request to join ${selectedOrg.name}` : 'Continue without organisation'}
                      </button>
                      {/* <button onClick={() => setStep(3)} className="w-full text-sm text-muted-foreground hover:text-foreground py-1">
                        Skip for now
                      </button> */}
                    </>
                  ) : (
                    <button
                      onClick={() => setStep(3)}
                      className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:scale-[1.01]"
                    >
                      Continue →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Mood ── */}
        {step === 3 && (
          <motion.div
            key="s3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 text-center transition-colors duration-500"
            style={{ backgroundColor: moodBg(mood) }}
          >
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">How are you feeling right now?</h2>
            <div className="mt-12 text-8xl">{MOOD_EMOJIS[mood - 1]}</div>
            <div className="mt-8 w-full max-w-md">
              <input
                type="range"
                min={1}
                max={10}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="w-full accent-white"
              />
              <div className="mt-2 flex justify-between text-sm text-primary-foreground/80">
                <span>Heavy</span>
                <span className="font-semibold">{mood}/10</span>
                <span>Light</span>
              </div>
            </div>
            <button onClick={() => setStep(4)} className="mt-10 rounded-full bg-white px-8 py-3 font-semibold text-primary transition hover:scale-[1.02]">
              Continue
            </button>
          </motion.div>
        )}

        {/* ── STEP 4: Concerns ── */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-screen flex-col items-center justify-center bg-canvas-gradient px-6">
            <h2 className="font-display text-3xl font-bold text-primary-deep md:text-4xl">What's on your mind?</h2>
            <p className="mt-2 text-muted-foreground">Pick anything that fits. Or none.</p>
            <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
              {CONCERNS.map((c) => {
                const active = concerns.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleConcern(c.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition ${
                      active
                        ? 'border-accent bg-accent text-accent-foreground shadow-md'
                        : 'border-border bg-card text-foreground hover:border-primary/40'
                    }`}
                  >
                    <c.icon className="size-6" />
                    <span className="text-sm font-medium">{c.label}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep(5)} className="mt-10 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:scale-[1.02]">
              Continue
            </button>
          </motion.div>
        )}

        {/* ── STEP 5: Need ── */}
        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-screen flex-col items-center justify-center bg-canvas-gradient px-6">
            <h2 className="font-display text-3xl font-bold text-primary-deep md:text-4xl">What do you need today?</h2>
            <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
              {[
                { id: 'talk', icon: MessageCircle, label: 'Someone to talk to' },
                { id: 'tools', icon: Wrench, label: 'Tools & exercises' },
                { id: 'express', icon: Sparkles, label: 'Just to express myself' },
              ].map((opt) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => startFirstMessage(opt.id as NeedType)}
                  className="rounded-3xl bg-card p-6 text-left shadow-sm transition hover:shadow-lg"
                >
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <opt.icon className="size-6" />
                  </div>
                  <div className="mt-4 font-display text-lg font-semibold text-primary-deep">{opt.label}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP 6: Manas greeting ── */}
        {step === 6 && (
          <motion.div key="s6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen flex-col items-center justify-center bg-canvas-gradient px-6 py-16">
            <div className="w-full max-w-lg">
              <div className="flex items-end gap-3">
                <ManasAvatar size={48} />
                <div className="rounded-3xl rounded-bl-md bg-card p-5 shadow-md">
                  {streamed ? (
                    <p className="whitespace-pre-wrap text-foreground">{streamed}</p>
                  ) : (
                    <div className="flex gap-1.5 py-2">
                      <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                      <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                      <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                    </div>
                  )}
                </div>
              </div>
              {!streaming && streamed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 space-y-3"
                >
                  <button
                    onClick={() => nav({ to: '/chat' })}
                    className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:scale-[1.01]"
                  >
                    Continue talking with Manas
                  </button>

                  <button
                    onClick={() => {
                      window.location.href = '/dashboard';
                    }}
                    className="w-full rounded-full border border-border bg-card px-6 py-3 font-semibold text-foreground transition hover:scale-[1.01]"
                  >
                    Go to Dashboard
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
