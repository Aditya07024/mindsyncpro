import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { UserProfileDropdown } from './UserProfileDropdown';
import { Home, MessageCircle, Heart, Users, CalendarCheck, Wallet } from 'lucide-react';
import { CrisisButton } from './CrisisButton';
import API from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

import logoUrl from '@/assets/logo.png';

const tabs = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/chat', icon: MessageCircle, label: 'Manas' },
  { to: '/therapists', icon: Users, label: 'Therapists' },
  { to: '/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/mood', icon: Heart, label: 'Mood' },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();

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

  // Not signed in — redirect to sign-in
  if (!isSignedIn) {
    navigate({ to: '/sign-in', replace: true });
    return null;
  }

  // Auth preflight still checking or account is invalid — show loading spinner
  // This prevents child routes from mounting and firing their own 401 queries
  if (authStatus !== 'ok') {
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
    <div className="min-h-screen bg-canvas-gradient pb-24">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logoUrl} alt="mymindtherapyfriend Logo" className="size-8 object-contain" />
            <span className="font-display text-lg font-bold text-primary-deep">mymindtherapyfriend</span>
          </Link>
          <div className="flex items-center gap-4">
            {/* <Link to="/wallet" className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-primary transition bg-secondary/80 border border-border px-2.5 py-1 rounded-full">
              <Wallet className="size-3.5 text-accent" />
              <span>₹{walletData?.walletBalance !== undefined ? walletData.walletBalance.toFixed(2) : "0.00"}</span>
            </Link> */}
            <Link to="/subscription" className="text-xs font-semibold text-primary/80 hover:text-primary transition">
              Upgrade
            </Link>
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

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

      <CrisisButton />
    </div>
  );
}

