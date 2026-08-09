import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { useState } from 'react';
import { Shield, AlertTriangle, ArrowLeft, Lock, Trash2, CheckSquare, Square, X, CheckCircle } from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import API from '@/lib/api';
import { toast } from 'sonner';

export const Route = createFileRoute('/delete-account')({
  component: DeleteAccountPage,
});

function maskEmail(email: string | undefined): string {
  if (!email) return 'User Account';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function DeleteAccountPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  const [isChecked, setIsChecked] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const rawEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
  const maskedEmail = maskEmail(rawEmail);

  const isFormValid = isSignedIn && isChecked && confirmInput.trim().toUpperCase() === 'DELETE';

  const handleLoginRedirect = () => {
    try {
      if (clerk && typeof clerk.openSignIn === 'function') {
        clerk.openSignIn({
          afterSignInUrl: '/delete-account',
          redirectUrl: '/delete-account',
        });
      } else {
        navigate({ to: '/sign-in' });
      }
    } catch (e) {
      navigate({ to: '/sign-in' });
    }
  };

  const handleConfirmDeletion = async () => {
    setIsDeleting(true);
    try {
      // 1. Call backend DELETE /api/account endpoint
      await API.account.delete();

      // 2. Clear local storage application state
      localStorage.clear();
      sessionStorage.clear();

      // 3. Delete / Sign out from Clerk
      try {
        if (user && typeof user.delete === 'function') {
          await user.delete();
        }
      } catch (clerkErr) {
        console.warn('Clerk user.delete fallback:', clerkErr);
      }
      await clerk.signOut();

      // 4. Redirect to /account-deleted
      navigate({ to: '/account-deleted' });
    } catch (err: any) {
      console.error('Account deletion error:', err);
      toast.error(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
      setShowFinalModal(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center">
        <div className="size-10 rounded-full bg-teal-500 animate-pulse" />
      </div>
    );
  }

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
          <Link to="/support" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-600 transition">
            <ArrowLeft className="size-4" /> Back to Support
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-6 py-16 flex-1 w-full flex items-center justify-center">
        {!isSignedIn ? (
          /* Unauthenticated State */
          <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
            <div className="size-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-6">
              <Lock className="size-8" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-3 text-slate-900">
              Account Deletion Request
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-md mx-auto">
              To protect your account, you must log in before requesting account deletion.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-8 text-xs text-slate-500 text-left">
              <p className="font-semibold text-slate-700 mb-1">🔒 Verification Security Notice</p>
              We verify identity directly through your authenticated session. You will never be asked to manually type an arbitrary email address to delete an account.
            </div>
            <button
              onClick={handleLoginRedirect}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-teal-700/20 cursor-pointer"
            >
              Log in to Continue
            </button>
          </div>
        ) : (
          /* Authenticated State */
          <div className="w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-6">
              <div className="size-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">
                  Delete Account Permanently
                </h1>
                <p className="text-xs text-slate-500">
                  Authenticated Identity & Account Purge
                </p>
              </div>
            </div>

            {/* Authenticated Identity Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Authenticated Account:</p>
                  <p className="text-sm font-bold text-slate-900">{maskedEmail}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                <Shield className="size-3" /> Clerk Verified
              </span>
            </div>

            {/* Warning Box */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 text-rose-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium">
                  <strong>Warning:</strong> Deleting your account is permanent. Your account and associated personal data will be permanently deleted and cannot be recovered.
                </p>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-0.5 size-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700 leading-normal">
                I understand that this action is permanent and cannot be undone.
              </span>
            </label>

            {/* Confirmation Input */}
            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                To confirm, please type <span className="text-rose-600 underline">DELETE</span> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-rose-900 outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </div>

            {/* Submit Action */}
            <button
              type="button"
              disabled={!isFormValid || isDeleting}
              onClick={() => setShowFinalModal(true)}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 className="size-4" />
              Delete My Account Permanently
            </button>
          </div>
        )}
      </main>

      {/* Final Confirmation Modal */}
      {showFinalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-150 text-center">
            <div className="size-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="size-7" />
            </div>
            <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              This action will immediately purge all profile data, mood entries, chat history, and bookings for <span className="font-bold text-slate-900">{maskedEmail}</span>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowFinalModal(false)}
                className="flex-1 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeletion}
                className="flex-1 py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © 2026 mymindtherapyfriend™. All rights reserved.
      </footer>
    </div>
  );
}
