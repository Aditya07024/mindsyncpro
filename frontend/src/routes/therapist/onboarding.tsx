import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, FileText, Video, CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import API from '@/lib/api';

export const Route = createFileRoute('/therapist/onboarding')({
  component: TherapistOnboarding,
});

function TherapistOnboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedOrgs, setVerifiedOrgs] = useState<any[]>([]);

  useEffect(() => {
    API.org.verifiedOrgs().then(res => setVerifiedOrgs(res.organizations)).catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    website: '',
    qualification: '',
    experienceCategory: '',
    specializations: '',
    clinicDetails: '',
    degreeUrl: '',
    licenseUrl: '',
    governmentIdUrl: '',
    introVideoUrl: '',
    orgId: '',
    location: '',
    upiId: '',
    bankDetails: '',
  });

  // Check if they are already verified or pending
  useEffect(() => {
    API.auth.me().then((me: any) => {
      const status = me?.therapistProfile?.verificationStatus;
      if (status === 'verified') {
        nav({ to: '/therapist/dashboard', replace: true });
      } else if (status === 'pending') {
        setStep(5); // Show success/pending screen
      }
    });
  }, [nav]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitOnboarding = async () => {
    setLoading(true);
    setError('');
    try {
      // Convert specializations from comma-separated string to array
      const specArray = formData.specializations.split(',').map((s) => s.trim()).filter(Boolean);
      
      await API.auth.therapistOnboarding({
        ...formData,
        specializations: specArray,
        orgId: formData.orgId === 'independent' ? null : formData.orgId,
      });
      setStep(5);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-gradient pb-20">
      <header className="px-6 py-5">
        <h1 className="font-display text-2xl font-bold text-primary-deep">Therapist Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">Join the mymindtherapyfriend network</p>
      </header>

      <main className="mx-auto max-w-md px-6 mt-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-border -z-10 -translate-y-1/2" />
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {s === 1 && <User className="size-4" />}
              {s === 2 && <CreditCard className="size-4" />}
              {s === 3 && <FileText className="size-4" />}
              {s === 4 && <Video className="size-4" />}
              {s === 5 && <CheckCircle className="size-4" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4 rounded-3xl bg-card p-6 shadow-sm border border-border">
                <h2 className="font-display text-xl font-bold text-primary-deep">Professional Details</h2>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name</label>
                  <input
                    name="fullName" value={formData.fullName} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Dr. Rajesh Kumar"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Qualification</label>
                    <input
                      name="qualification" value={formData.qualification} onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                      placeholder="M.A. Psychology"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Experience</label>
                    <select
                      name="experienceCategory" value={formData.experienceCategory} onChange={handleChange as any}
                      className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>Select Experience</option>
                      <option value="less than 5 yr">&lt; 5 years</option>
                      <option value="5 to 10 yr">5 to 10 years</option>
                      <option value="10 to 15 yr">10 to 15 years</option>
                      <option value="more than 15 yr">&gt; 15 years</option>
                    </select>
                    {formData.experienceCategory && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        Session Fee set to: ₹
                        {formData.experienceCategory === 'less than 5 yr' ? 899 :
                         formData.experienceCategory === '5 to 10 yr' ? 1299 :
                         formData.experienceCategory === '10 to 15 yr' ? 1599 : 2199}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Specializations</label>
                  <input
                    name="specializations" value={formData.specializations} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Anxiety, Depression, Trauma (comma separated)"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Clinic / Organization</label>
                  <select
                    name="orgId" value={formData.orgId} onChange={handleChange as any}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>Select your organization</option>
                    <option value="independent">Independent Practitioner</option>
                    {verifiedOrgs.map(org => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Location / City</label>
                  <input
                    name="location" value={formData.location} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Mumbai, Maharashtra"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Email ID (Optional)</label>
                    <input
                      name="email" value={formData.email} onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                      placeholder="dr.rajesh@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Personal Website (Optional)</label>
                    <input
                      name="website" value={formData.website} onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                      placeholder="https://drrajesh.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Clinic / Practice Details (If independent)</label>
                  <textarea
                    name="clinicDetails" value={formData.clinicDetails} onChange={handleChange} rows={2}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Name and address of your current practice"
                  />
                </div>

                <button
                  disabled={!formData.fullName || !formData.qualification || !formData.experienceCategory || !formData.orgId || !formData.location}
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 mt-6"
                >
                  Next Step <ArrowRight className="inline size-4 ml-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4 rounded-3xl bg-card p-6 shadow-sm border border-border">
                <h2 className="font-display text-xl font-bold text-primary-deep">Payment Details</h2>
                <div className="bg-primary-soft/30 border border-primary/20 p-4 rounded-xl text-sm text-primary-deep leading-relaxed">
                  <strong>Important:</strong> You will get the payment weekly according to your user bookings. 
                  The platform takes a <strong>30% commission</strong> for each booking by a user.
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">UPI ID</label>
                  <input
                    name="upiId" value={formData.upiId} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="example@upi"
                  />
                </div>
                
                <div className="text-center text-xs font-semibold text-muted-foreground uppercase my-2">OR</div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Bank Details</label>
                  <textarea
                    name="bankDetails" value={formData.bankDetails} onChange={handleChange} rows={3}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Account Name, A/C No, IFSC Code"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-input bg-background px-4 py-3 font-semibold transition hover:bg-muted">
                    Back
                  </button>
                  <button
                    disabled={!formData.upiId && !formData.bankDetails}
                    onClick={() => setStep(3)}
                    className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4 rounded-3xl bg-card p-6 shadow-sm border border-border">
                <h2 className="font-display text-xl font-bold text-primary-deep">Document Verification</h2>
                <p className="text-sm text-muted-foreground">Please provide secure links (e.g. Google Drive, Dropbox) to your verification documents. Make sure anyone with the link can view.</p>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Degree Certificate Link</label>
                  <input
                    name="degreeUrl" value={formData.degreeUrl} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">License / Therapist Registration Link</label>
                  <input
                    name="licenseUrl" value={formData.licenseUrl} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Government ID Link</label>
                  <input
                    name="governmentIdUrl" value={formData.governmentIdUrl} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-input bg-background px-4 py-3 font-semibold transition hover:bg-muted">
                    Back
                  </button>
                  <button
                    disabled={!formData.degreeUrl || !formData.licenseUrl || !formData.governmentIdUrl}
                    onClick={() => setStep(4)}
                    className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4 rounded-3xl bg-card p-6 shadow-sm border border-border">
                <h2 className="font-display text-xl font-bold text-primary-deep">Video Introduction</h2>
                <p className="text-sm text-muted-foreground">To build strong trust, please provide a link to a short 1-minute video introducing yourself to potential clients.</p>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Introduction Video Link</label>
                  <input
                    name="introVideoUrl" value={formData.introVideoUrl} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="https://youtube.com/... or Google Drive"
                  />
                </div>

                {error && <div className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg">{error}</div>}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(3)} className="flex-1 rounded-xl border border-input bg-background px-4 py-3 font-semibold transition hover:bg-muted">
                    Back
                  </button>
                  <button
                    disabled={loading || !formData.introVideoUrl}
                    onClick={submitOnboarding}
                    className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Profile'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="flex flex-col items-center justify-center space-y-4 rounded-3xl bg-card p-8 shadow-sm border border-border text-center">
                <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle className="size-8" />
                </div>
                <h2 className="font-display text-2xl font-bold text-primary-deep">Application Under Review</h2>
                <p className="text-muted-foreground">
                  Thank you for submitting your details. The mymindtherapyfriend Super Admin team is carefully reviewing your documents and video.
                </p>
                <div className="bg-primary-soft/50 border border-primary/20 p-4 rounded-xl mt-4">
                  <p className="text-sm text-primary-deep font-medium">You will be notified once your profile is marked as <strong>"Verified"</strong>. Until then, your dashboard access is locked.</p>
                </div>
                <button onClick={() => nav({ to: '/sign-in' })} className="mt-4 text-sm font-semibold text-primary hover:underline">
                  Return to Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
