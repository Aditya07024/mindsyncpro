import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth, useClerk, SignInButton } from '@clerk/clerk-react';
import { UserProfileDropdown } from './UserProfileDropdown';
import { Home, MessageCircle, Heart, Users, CalendarCheck, Wallet, User as UserIcon, Gift, Sparkles, X } from 'lucide-react';
import { CrisisButton } from './CrisisButton';
import API from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import logoUrl from '@/assets/logo.png';

const tabs = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/chat', icon: MessageCircle, label: 'Manas' },
  { to: '/therapists', icon: Users, label: 'Counsellors' },
  { to: '/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/mood', icon: UserIcon, label: 'Profile' },
] as const;

export function AppShell({
  children,
  requireAuth = true,
  hideSOS = false,
  hideBottomNav = false,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
  hideSOS?: boolean;
  hideBottomNav?: boolean;
}) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const [refInput, setRefInput] = useState('');

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => API.auth.me(),
    enabled: isSignedIn,
  });

  const applyRefMutation = useMutation({
    mutationFn: (data: { referralCode?: string; skip?: boolean }) => API.auth.applyReferral(data),
    onSuccess: (res: any) => {
      if (res.message) toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to process referral code.");
    }
  });

  // Preflight auth gate: check if the account is valid before rendering children
  const [authStatus, setAuthStatus] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (hasChecked.current) return;
    hasChecked.current = true;

    API.auth
      .me()
      .then(() => {
        setAuthStatus('ok');
      })
      .catch((err: any) => {
        const msg = err?.message || '';
        if (
          msg.includes('deleted') ||
          msg.includes('Unauthorized') ||
          msg.includes('No Clerk User')
        ) {
          setAuthStatus('invalid');
          signOut().then(() => {
            navigate({ to: '/account-deleted', replace: true });
          });
        } else {
          // Non-auth error (e.g. network issue) — let the app render anyway
          setAuthStatus('ok');
        }
      });
  }, [isLoaded, isSignedIn, signOut, navigate]);

  // Also listen for 401 events from API calls that happen after the preflight
  useEffect(() => {
    const handleUnauthorized = (e: Event) => {
      const customEvent = e as CustomEvent;
      const msg = customEvent.detail?.message || '';
      if (
        msg.includes('deleted') ||
        msg.includes('Unauthorized') ||
        msg.includes('No Clerk User')
      ) {
        setAuthStatus('invalid');
        signOut().then(() => {
          navigate({ to: '/account-deleted', replace: true });
        });
      }
    };

    window.addEventListener('mymind_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('mymind_unauthorized', handleUnauthorized);
  }, [signOut, navigate]);

  // Still loading Clerk — show minimal spinner
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-canvas-gradient flex items-center justify-center">
        <div className="size-12 rounded-full bg-warm-gradient animate-pulse" />
      </div>
    );
  }

  // Not signed in — redirect to sign-in only if requireAuth is true
  if (requireAuth && !isSignedIn) {
    navigate({ to: '/sign-in', replace: true });
    return null;
  }

  // Auth preflight still checking or account is invalid — show loading spinner if signed in
  if (isSignedIn && authStatus !== 'ok') {
    return (
      <div className="min-h-screen bg-canvas-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 rounded-full bg-warm-gradient animate-pulse" />
          <p className="text-muted-foreground text-xs font-medium animate-pulse">
            Verifying your account…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-canvas-gradient ${hideBottomNav ? '' : 'pb-24'}`}>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logoUrl} alt="mymindtherapyfriend Logo" className="size-8 object-contain" />
            <span className="font-display text-lg font-bold text-primary-deep">mymindtherapyfriend</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/subscription" className="text-xs font-semibold text-primary/80 hover:text-primary transition">
              Upgrade
            </Link>
            {isSignedIn ? (
              <UserProfileDropdown />
            ) : (
              <SignInButton mode="modal">
                <button className="rounded-full bg-primary-deep text-white px-4 py-1.5 text-xs font-bold shadow hover:bg-primary-deep/90 transition cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/50 bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-stretch justify-around">
            {tabs.map((t) => {
              const active = loc.pathname === t.to || loc.pathname.startsWith(t.to + '/');
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition ${
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`size-5 ${active ? 'fill-primary/20' : ''}`} />
                  <span className={active ? 'font-semibold' : ''}>{t.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* One-Time Referral Code Popup Modal for Existing & New Users */}
      <AnimatePresence>
        {isSignedIn && userData && userData.role === 'user' && userData.referralPromptProcessed === false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-5 overflow-hidden"
            >
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => applyRefMutation.mutate({ skip: true })}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary transition cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Gift className="size-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-primary-deep flex items-center gap-1.5">
                    Got a Referral Code? <Sparkles className="size-4 text-amber-500" />
                  </h3>
                  <p className="text-xs text-muted-foreground">Enter a friend's referral code to get 1 Free Counseling Session!</p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                  placeholder="Enter Referral Code (e.g. MMTP-A1B2C3)"
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-mono tracking-wider text-slate-800 uppercase focus:ring-2 focus:ring-primary outline-none transition"
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => applyRefMutation.mutate({ skip: true })}
                    disabled={applyRefMutation.isPending}
                    className="flex-1 py-3 px-4 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary transition cursor-pointer"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={() => {
                      if (!refInput.trim()) {
                        toast.error("Please enter a referral code or click Skip.");
                        return;
                      }
                      applyRefMutation.mutate({ referralCode: refInput.trim() });
                    }}
                    disabled={applyRefMutation.isPending}
                    className="flex-1 py-3 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {applyRefMutation.isPending ? "Claiming..." : "Claim Free Session"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hideSOS && <CrisisButton />}
    </div>
  );
}

