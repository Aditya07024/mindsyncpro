import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from '@tanstack/react-router';
import { User, Settings, LogOut, HelpCircle, Trash2, Shield, X } from 'lucide-react';
import API from '@/lib/api';
import { toast } from 'sonner';

export function UserProfileDropdown({
  align = 'end',
}: {
  align?: 'start' | 'end';
}) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit form states
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [language, setLanguage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch dbUser details on mount
  useEffect(() => {
    if (isLoaded && user) {
      API.auth
        .me()
        .then((me: any) => {
          setDbUser(me);
          setFullName(
            me?.fullName ||
              user.fullName ||
              `${user.firstName || ''} ${user.lastName || ''}`.trim()
          );
          setLocation(me?.location || '');
          setEmergencyContact(me?.emergencyContact || '');
          setLanguage(me?.language || 'English');
        })
        .catch((err: any) => {
          console.error('Failed to load dbUser profile:', err);
          if (
            err.message?.includes('deleted') ||
            err.message?.includes('Unauthorized') ||
            err.message?.includes('No Clerk User')
          ) {
            signOut().then(() => {
              navigate({ to: '/account-deleted', replace: true });
            });
          }
        });
    }
  }, [isLoaded, user, signOut, navigate]);

  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      API.admin.permissions
        .getMyAccess()
        .then((access) => {
          if (
            access &&
            (access.isSuperAdmin ||
              access.canHostMeeting ||
              access.canViewRegistrations ||
              access.canManageUsers ||
              access.canManageTherapists ||
              access.canManageOrganizations ||
              access.canViewAnalytics)
          ) {
            setHasAdminAccess(true);
          }
        })
        .catch(() => {});
    }
  }, [isLoaded, user]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoaded || !user) {
    return <div className="size-8 rounded-full bg-slate-200 animate-pulse" />;
  }

  const userRole = dbUser?.role || 'User';
  const roleDisplay =
    userRole === 'super_admin'
      ? 'Super Admin'
      : userRole === 'org_admin'
      ? 'Org Admin'
      : userRole === 'therapist'
      ? 'Therapist'
      : hasAdminAccess
      ? 'Delegated Admin'
      : 'User';

  const userInitials = (user.fullName || user.firstName || 'U')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => (n && n[0] ? n[0] : ''))
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // 1. Update DB profile
      const updated = await API.auth.updateProfile({
        'Full name': fullName,
        Location: location,
        'Emergency contact': emergencyContact,
        'Preferred language': language,
      });
      setDbUser(updated);

      // 2. Update Clerk user profile name if possible
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      try {
        await user.update({
          firstName: firstName || user.firstName || '',
          lastName: lastName || user.lastName || '',
        });
      } catch (clerkErr) {
        console.warn('Failed to update Clerk name:', clerkErr);
      }

      toast.success('Profile updated successfully!');
      setShowEditModal(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (deleteConfirmText.toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      // 1. Delete profile in backend DB
      await API.auth.deleteProfile();
      toast.success('Account deleted successfully');

      // 2. Delete/Sign out from Clerk
      try {
        if (typeof user.delete === 'function') {
          await user.delete();
        }
      } catch (clerkErr) {
        console.warn('Clerk user delete fallback to signOut:', clerkErr);
      }
      await signOut();
      navigate({ to: '/' });
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate({ to: '/' });
  };

  const handleSupport = () => {
    setIsOpen(false);
    navigate({ to: '/support' });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Custom Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition cursor-pointer"
        aria-label="User menu"
      >
        <div className="size-9 rounded-full ring-2 ring-teal-500/30 group-hover:ring-teal-500 transition overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName || 'User avatar'}
              className="size-full object-cover"
            />
          ) : (
            <span className="font-semibold text-xs text-teal-700">{userInitials}</span>
          )}
        </div>
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'end' ? 'right-0' : 'left-0'
          } mt-2 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 border border-slate-100 z-50 animate-in fade-in-50 zoom-in-95 duration-100`}
        >
          {/* Header Info */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
            <div className="size-11 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="size-full object-cover" />
              ) : (
                <span className="font-bold text-sm text-teal-700">{userInitials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">
                {dbUser?.fullName || user.fullName || 'User Profile'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user.primaryEmailAddress?.emailAddress ||
                  user.emailAddresses?.[0]?.emailAddress ||
                  ''}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                <Shield className="size-2.5" /> {roleDisplay}
              </span>
            </div>
          </div>

          {/* Menu Links / Actions */}
          <div className="py-1">
            {hasAdminAccess && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate({ to: '/admin/dashboard' });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl transition cursor-pointer mb-1 border border-violet-200/60"
              >
                <Shield className="size-4 text-violet-600" />
                Admin Dashboard
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                setShowEditModal(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700 rounded-xl transition cursor-pointer"
            >
              <Settings className="size-4 text-slate-400 group-hover:text-teal-600" />
              Edit Profile
            </button>

            <button
              onClick={handleSupport}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700 rounded-xl transition cursor-pointer"
            >
              <HelpCircle className="size-4 text-slate-400 group-hover:text-teal-600" />
              Support
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition cursor-pointer"
            >
              <LogOut className="size-4 text-slate-400" />
              Sign Out
            </button>
          </div>

          {!hasAdminAccess && userRole !== 'super_admin' && (
            <div className="border-t border-slate-100 pt-1 mt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowDeleteModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="size-4 text-rose-500" />
                Delete Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                    <User className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Edit Profile</h3>
                    <p className="text-xs text-slate-500">Update your account information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="size-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Hinglish">Hinglish</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Gujarati">Gujarati</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Profile Modal */}
      {showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 animate-in fade-in-50 zoom-in-95 my-auto">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <div className="size-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Delete Profile</h3>
                  <p className="text-xs text-rose-600 font-medium">Permanent Account Deletion</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                This action cannot be undone. All your profile information, chat history, and personal data will be permanently archived or removed.
              </p>

              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4">
                <p className="text-[11px] font-medium text-rose-800 mb-2">
                  To confirm, please type <span className="font-bold underline">DELETE</span> below:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-900 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProfile}
                  disabled={isDeleting || deleteConfirmText.toUpperCase() !== 'DELETE'}
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
