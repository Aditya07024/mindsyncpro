import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  Heart,
  Globe,
  Award,
  ChevronRight,
  Send,
  Linkedin,
  MessageSquare
} from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/careers')({
  component: CareersPage,
});

const ROLE_OPTIONS = [
  "Clinical Psychologist / Licensed Therapist",
  "Counseling Psychologist / Mental Health Associate",
  "Senior Fullstack Engineer (React / TypeScript / Node)",
  "AI & ML Data Engineer (Mental Health Models)",
  "Product Designer / UX Specialist",
  "Community Manager & Mental Health Advocate",
  "Patient Success & Operations Specialist",
  "Psychology / Technology Intern",
  "Other / General Opportunity"
];

const EXPERIENCE_OPTIONS = [
  "Entry Level (0 - 1 years)",
  "Mid Level (1 - 3 years)",
  "Senior (3 - 5 years)",
  "Lead / Expert (5+ years)"
];

function CareersPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: ROLE_OPTIONS[0],
    experience: EXPERIENCE_OPTIONS[1],
    portfolioUrl: '',
    coverLetter: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size exceeds 10MB limit. Please upload a smaller resume.");
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API application submission
    setTimeout(() => {
      const refId = "MMF-APP-" + Math.floor(100000 + Math.random() * 900000);
      setApplicationId(refId);
      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }, 1200);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: ROLE_OPTIONS[0],
      experience: EXPERIENCE_OPTIONS[1],
      portfolioUrl: '',
      coverLetter: '',
    });
    setSelectedFile(null);
    setFileError(null);
    setSubmittedSuccess(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="size-10 rounded-xl bg-white shadow-lg overflow-hidden flex items-center justify-center">
              <img src={logoUrl} alt="mymindtherapyfriend Logo" className="size-full object-cover scale-125" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-teal-400 transition">
              mymindtherapyfriend
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl transition"
          >
            <ArrowLeft className="size-4 text-teal-400" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl mx-auto px-5 py-12 w-full space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="size-3.5 text-teal-400" /> We Are Hiring
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white tracking-tight leading-tight">
            Build the Future of <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Mental Healthcare</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Join our mission to democratize mental health support across India. We are combining empathetic human therapy, cutting-edge AI assistance, and safe community care.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5">
              <Globe className="size-3.5 text-teal-400" /> Remote & Hybrid
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5">
              <Heart className="size-3.5 text-emerald-400" /> Purpose Driven
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5">
              <Award className="size-3.5 text-cyan-400" /> Competitive Pay
            </span>
          </div>
        </section>

        {/* Culture & Benefits Section */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-3 relative overflow-hidden">
            <div className="size-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Heart className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Empathetic Culture</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              We prioritize well-being inside and out. Work with teams that listen, care, and build solutions with deep empathy.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-3 relative overflow-hidden">
            <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Innovation at Scale</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Work on revolutionary AI therapy tools, real-time crisis support platforms, and seamless telehealth experiences.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 space-y-3 relative overflow-hidden">
            <div className="size-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Briefcase className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Growth & Impact</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Touch the lives of thousands daily. We foster rapid personal career progression and continuous learning.
            </p>
          </div>
        </section>

        {/* Career Application Form Section */}
        <section className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/90 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <AnimatePresence mode="wait">
            {!submittedSuccess ? (
              <motion.form
                key="career-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                onSubmit={handleSubmit}
                className="space-y-8 relative z-10"
              >
                <div className="border-b border-slate-800/80 pb-6 space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                    <Briefcase className="size-7 text-teal-400" /> Apply for a Position
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Fill out the form below with your details and resume. Our recruitment team will review your application.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <User className="size-4 text-teal-400" /> Full Name <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:outline-none transition"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Mail className="size-4 text-teal-400" /> Email Address <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ananya@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:outline-none transition"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Phone className="size-4 text-teal-400" /> Phone Number <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:outline-none transition"
                    />
                  </div>

                  {/* Position / Role Dropdown */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Briefcase className="size-4 text-teal-400" /> Type of Role <span className="text-teal-400">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:outline-none transition"
                    >
                      {ROLE_OPTIONS.map((r, idx) => (
                        <option key={idx} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Experience Level Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Experience Level <span className="text-teal-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {EXPERIENCE_OPTIONS.map((exp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, experience: exp })}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-center cursor-pointer ${
                          formData.experience === exp
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LinkedIn / Portfolio URL */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Linkedin className="size-4 text-teal-400" /> LinkedIn Profile / Portfolio URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    placeholder="https://linkedin.in/in/username or portfolio link"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:outline-none transition"
                  />
                </div>

                {/* Resume Upload File Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <FileText className="size-4 text-teal-400" /> Resume / CV Attachment <span className="text-teal-400">*</span>
                  </label>

                  <div className="border-2 border-dashed border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 text-center bg-slate-950/60 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 size-full opacity-0 cursor-pointer z-20"
                    />
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <div className="size-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                        <Upload className="size-6" />
                      </div>
                      {selectedFile ? (
                        <div>
                          <p className="text-sm font-bold text-teal-300">{selectedFile.name}</p>
                          <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            Click or drag resume file here to upload
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">Supported formats: PDF, DOC, DOCX (Max 10MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {fileError && <p className="text-xs text-rose-400 mt-1">{fileError}</p>}
                </div>

                {/* Cover Letter / Additional Details */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <MessageSquare className="size-4 text-teal-400" /> Cover Letter & Additional Details
                  </label>
                  <textarea
                    rows={4}
                    value={formData.coverLetter}
                    onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                    placeholder="Tell us briefly about your background, expertise, and why you are excited to join mymindtherapyfriend..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:border-teal-500 focus:outline-none transition leading-relaxed"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        Submit Application <Send className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              /* Success Response View */
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-6 max-w-xl mx-auto relative z-10"
              >
                <div className="size-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 className="size-10" />
                </div>

                <div className="space-y-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    Application Received
                  </span>
                  <h2 className="text-3xl font-extrabold text-white">Application Submitted!</h2>
                  <p className="text-slate-300 text-base leading-relaxed">
                    Thank you for applying to <strong>mymindtherapyfriend</strong>. Our team will review your details and contact you soon.
                  </p>
                </div>

                {/* Application Confirmation Details Box */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Application Reference ID:</span>
                    <span className="font-mono font-bold text-teal-400">{applicationId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Applicant Name:</span>
                    <span className="font-semibold text-white">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Target Role:</span>
                    <span className="font-semibold text-emerald-400">{formData.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact Email:</span>
                    <span className="font-semibold text-white">{formData.email}</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                  >
                    Submit Another Application
                  </button>
                  <Link
                    to="/"
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20"
                  >
                    Return to Homepage <ChevronRight className="size-4" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Global Careers Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-10 px-6 text-center text-xs text-slate-400 space-y-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-white overflow-hidden flex items-center justify-center">
              <img src={logoUrl} alt="Logo" className="size-full object-cover scale-125" />
            </div>
            <span className="font-bold text-slate-200">mymindtherapyfriend™ Careers</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-xs">
            <Link to="/" className="hover:text-teal-400 transition">Home</Link>
            <Link to="/about" className="hover:text-teal-400 transition">About</Link>
            <Link to="/careers" className="text-teal-400 font-semibold hover:underline">Careers</Link>
            <Link to="/privacy" className="hover:text-teal-400 transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-teal-400 transition">Terms & Conditions</Link>
            <Link to="/support" className="hover:text-teal-400 transition">Support Center</Link>
          </div>

          <p>© 2026 mymindtherapyfriend™. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
