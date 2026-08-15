import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, FileText, CheckCircle, ArrowRight, Mail } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import API from "@/lib/api";

export const Route = createFileRoute("/org/onboarding")({
  component: OrgOnboarding,
});

function OrgOnboarding() {
  const nav = useNavigate();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "company",
    officialEmail: user?.emailAddresses[0]?.emailAddress || "",
    contactPerson: "",
    phone: "",
    address: "",
    website: "",
    registrationUrl: "",
    accreditationUrl: "",
    governmentIdUrl: "",
    coverMemberTherapyFees: false,
  });

  useEffect(() => {
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    if (userEmail) {
      setFormData((prev) => ({
        ...prev,
        officialEmail: userEmail,
      }));
    }
  }, [user]);

  const publicEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "live.com",
  ];

  const emailDomain = (formData.officialEmail || "").split("@")[1]?.toLowerCase() || "";

  const isPublicEmail = publicEmailDomains.includes(emailDomain);

  useEffect(() => {
    // If the user already has an org and it's verified or pending, redirect
    API.org
      .me()
      .then((res: any) => {
        const status = res?.organization?.verificationStatus;
        if (status === "verified") {
          nav({ to: "/org/dashboard", replace: true });
        } else if (status === "pending") {
          setStep(3);
        }
      })
      .catch(() => {}); // No org found, stay on onboarding
  }, [nav]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const SUBMIT_GUARD_KEY = "mymindtherapyfriend_org_onboarding_submit_v1";

  const submitOnboarding = async () => {
    // Prevent double-submit on refresh/back-forward while request is in-flight.
    const guard = sessionStorage.getItem(SUBMIT_GUARD_KEY);
    if (guard === "in_progress") return;
    if (guard === "done") {
      // If we already submitted in this tab/session, just continue UI.
      setStep(4);
      return;
    }

    sessionStorage.setItem(SUBMIT_GUARD_KEY, "in_progress");

    setLoading(true);
    setError("");
    try {
      await API.org.onboarding(formData);
      sessionStorage.setItem(SUBMIT_GUARD_KEY, "done");
      setStep(4);
    } catch (err: any) {
      // allow retry if it failed
      sessionStorage.removeItem(SUBMIT_GUARD_KEY);
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="px-6 py-5 bg-white border-b border-slate-200">
        <h1 className="font-display text-2xl font-bold text-slate-900">Organization Onboarding</h1>
        <p className="text-sm text-slate-500 mt-1">Register your organization or college</p>
      </header>

      <main className="mx-auto max-w-lg px-4 mt-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 relative px-2">
          <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-slate-200 -z-10 -translate-y-1/2" />
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`size-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white border-2 border-slate-200 text-slate-400"
              }`}
            >
              {s === 1 && <Building2 className="size-4.5" />}
              {s === 2 && <Mail className="size-4.5" />}
              {s === 3 && <FileText className="size-4.5" />}
              {s === 4 && <CheckCircle className="size-4.5" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Organization Details
                </h2>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Organization / College Name
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="mymindtherapyfriend University"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="company">Company</option>
                      <option value="college">College / University</option>
                      <option value="ngo">NGO / Trust</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Contact Person
                    </label>
                    <input
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Website
                    </label>
                    <input
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="https://xyz.edu"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Address & Location
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Full headquarters or campus address"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-2">
                    Therapy Payment Policy
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Do you want your linked users/students to pay for appointments with organization-linked therapists?
                  </p>

                  <div className="space-y-2">
                    <label
                      onClick={() => setFormData((prev) => ({ ...prev, coverMemberTherapyFees: true }))}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        formData.coverMemberTherapyFees
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="coverMemberTherapyFees"
                        checked={formData.coverMemberTherapyFees === true}
                        onChange={() => setFormData((prev) => ({ ...prev, coverMemberTherapyFees: true }))}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-semibold">No — Cover Member Therapy Fees (Free Appointments)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Organization covers therapy costs. Members won't be charged when booking organization-linked therapists.
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => setFormData((prev) => ({ ...prev, coverMemberTherapyFees: false }))}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        !formData.coverMemberTherapyFees
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="coverMemberTherapyFees"
                        checked={formData.coverMemberTherapyFees === false}
                        onChange={() => setFormData((prev) => ({ ...prev, coverMemberTherapyFees: false }))}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-semibold">Yes — Members Pay Standard Fees</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Members will pay standard appointment fees when booking organization-linked therapists.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  disabled={!formData.name || !formData.contactPerson || !formData.phone}
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 mt-6"
                >
                  Next Step <ArrowRight className="inline size-4 ml-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Official Contact Email
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Provide an official organization email address for verification and communication.
                  Public emails like Gmail are not accepted.
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Official Email Address
                  </label>
                  <input
                    name="officialEmail"
                    value={formData.officialEmail}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="admin@yourdomain.edu"
                  />
                </div>

                {isPublicEmail && formData.officialEmail && (
                  <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                    Please use an official organization or college email address, not a public
                    provider.
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    disabled={!formData.officialEmail || isPublicEmail}
                    onClick={() => {
                      setError("");
                      setStep(3);
                    }}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Document Verification
                </h2>
                <p className="text-sm text-slate-500">
                  Provide secure links (e.g. Google Drive) to your organization's official
                  documents.
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Registration Certificate
                  </label>
                  <input
                    name="registrationUrl"
                    value={formData.registrationUrl}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Trust / Society / Company registration
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Accreditation Proof (If College)
                  </label>
                  <input
                    name="accreditationUrl"
                    value={formData.accreditationUrl}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Official ID of Representative
                  </label>
                  <input
                    name="governmentIdUrl"
                    value={formData.governmentIdUrl}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    disabled={loading || !formData.registrationUrl || !formData.governmentIdUrl}
                    onClick={submitOnboarding}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit Profile"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="s4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <CheckCircle className="size-8" />
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Application Under Review
                </h2>
                <p className="text-slate-500 text-sm">
                  Thank you for submitting your organization details. Our admin team will verify
                  your documents and email domain.
                </p>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-4 text-left w-full">
                  <p className="text-sm text-blue-900 font-medium">
                    You will be notified once your organization is marked as{" "}
                    <strong>"Verified"</strong>. Until then, your dashboard access is locked.
                  </p>
                </div>
                <button
                  onClick={() => nav({ to: "/org/dashboard" })}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
