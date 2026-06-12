import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth, UserButton } from '@clerk/clerk-react';
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

  const { data: walletData } = useQuery({
    queryKey: ["walletBalance"],
    queryFn: () => API.payment.getWalletBalance(),
    enabled: !!isLoaded && !!isSignedIn,
  });

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
    // Use replace to avoid back-button loops
    navigate({ to: '/sign-in', replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-canvas-gradient pb-24">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logoUrl} alt="mymindtherapyfriend Logo" className="size-8 object-contain" />
            <span className="font-display text-lg font-bold text-primary-deep">mymindtherapyfriend</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/wallet" className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-primary transition bg-secondary/80 border border-border px-2.5 py-1 rounded-full">
              <Wallet className="size-3.5 text-accent" />
              <span>₹{walletData?.walletBalance !== undefined ? walletData.walletBalance.toFixed(2) : "0.00"}</span>
            </Link>
            <Link to="/subscription" className="text-xs font-semibold text-primary/80 hover:text-primary transition">
              Upgrade
            </Link>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "size-8",
                }
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around">
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
