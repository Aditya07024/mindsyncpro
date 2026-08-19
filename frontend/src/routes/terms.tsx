import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Scale, AlertCircle, Info } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
});

function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: Scale,
      content: "By accessing or using MyMindTherapyFriend, you agree to be bound by these Terms & Conditions. If you do not agree to all terms, you may not use our services."
    },
    {
      title: "Not a Medical Emergency Service",
      icon: AlertCircle,
      iconColor: "text-rose-500",
      content: "MyMindTherapyFriend is a wellness platform, not a crisis intervention or medical emergency service. If you are experiencing a life-threatening emergency or thoughts of self-harm, please contact your local emergency services or a crisis hotline immediately."
    },
    {
      title: "User Conduct",
      icon: Info,
      content: "Users must be at least 18 years old or have parental consent. You agree not to use the platform for any illegal activities or to harass, abuse, or harm others."
    },
    {
      title: "Subscription & Payments",
      icon: FileText,
      content: "Subscription fees are non-refundable unless required by law. We reserve the right to change our pricing or subscription models with prior notice."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg overflow-hidden">
              <img src={logoUrl} alt="Logo" className="size-full object-cover" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MyMindTherapyFriend</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-600 transition">
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <h1 className="text-4xl font-display font-bold mb-6">Terms & Conditions</h1>
          <p className="text-slate-600">Last updated: May 14, 2026</p>
        </motion.div>

        <div className="prose prose-slate max-w-none">
          {sections.map((s, i) => (
            <motion.div 
              key={s.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <s.icon className={`size-6 ${s.iconColor || 'text-slate-900'}`} />
                <h2 className="text-2xl font-bold m-0">{s.title}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {s.content}
              </p>
            </motion.div>
          ))}
        </div>

        <section className="mt-20 p-10 bg-slate-50 border border-slate-200 rounded-[2rem]">
          <h3 className="text-xl font-bold mb-4">Legal Notice</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            These terms constitute a legally binding agreement between you and MyMindTherapyFriend Wellness Platforms. 
            We reserve the right to modify these terms at any time. Continued use of the platform after 
            changes implies acceptance of the new terms.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-12 text-center text-sm text-slate-500 space-y-3">
        <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600 font-medium">
          <Link to="/" className="hover:text-teal-600 transition">Home</Link>
          <Link to="/about" className="hover:text-teal-600 transition">About</Link>
          <Link to="/careers" className="text-teal-600 font-bold hover:underline">Careers</Link>
          <Link to="/privacy" className="hover:text-teal-600 transition">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-teal-600 transition">Terms & Conditions</Link>
          <Link to="/support" className="hover:text-teal-600 transition">Support</Link>
        </div>
        <p>© 2026 mymindtherapyfriend™. All rights reserved.</p>
      </footer>
    </div>
  );
}
