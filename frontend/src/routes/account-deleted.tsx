import { createFileRoute, Link } from '@tanstack/react-router';
import { CheckCircle2, ShieldCheck, Home, Info } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/account-deleted')({
  component: AccountDeletedPage,
});

function AccountDeletedPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-900 flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-white shadow-lg overflow-hidden">
              <img src={logoUrl} alt="Logo" className="size-full object-cover scale-125" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">mymindtherapyfriend</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-600 transition">
            <Home className="size-4" /> Home
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-6 py-16 flex-1 w-full flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="size-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="size-9" />
          </div>

          <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">
            Your account has been permanently deleted.
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            Your profile, login credentials, chat history with Manas AI, mood entries, and personal records have been completely purged from our active systems.
          </p>

          {/* Data Retention Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left text-xs text-slate-600 leading-relaxed space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Info className="size-4 text-teal-600 shrink-0" /> Data Erasure & Retention Summary
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><strong>Deleted Data:</strong> Profile details, contact info, chat history, mood logs, journal entries, and authentication tokens.</li>
              <li><strong>Temporary Audit Logs:</strong> Financial transactions or statutory payment records may be retained securely for up to 90 days solely for tax, legal compliance, or fraud prevention compliance as required by applicable law.</li>
            </ul>
          </div>

          {/* Action Button */}
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-teal-700/20"
          >
            <Home className="size-4" /> Return to Home Page
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © 2026 mymindtherapyfriend™. All rights reserved.
      </footer>
    </div>
  );
}
