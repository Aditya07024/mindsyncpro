import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Lock, EyeOff, Server } from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import dpdpaCertUrl from '@/assets/DPDPA_Certificate.png';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

function PrivacyPage() {
  const sections = [
    {
      title: "Data We Collect",
      icon: EyeOff,
      content: "We collect minimal information necessary to provide our services, including your basic profile info and encrypted conversation metadata. We do not store raw chat logs in a way that identifies you personally unless explicitly shared for therapy purposes."
    },
    {
      title: "How We Use Data",
      icon: Shield,
      content: "Data is used to personalize Manas AI's responses, track your wellness progress, and facilitate therapist sessions. We never sell your data to third parties for advertising or marketing."
    },
    {
      title: "Security Measures",
      icon: Lock,
      iconColor: "text-blue-500",
      content: "All data is encrypted in transit and at rest. Therapist sessions are conducted over secure, end-to-end encrypted WebRTC channels to ensure total privacy."
    },
    {
      title: "Data Retention",
      icon: Server,
      content: "You have the right to request deletion of your data at any time. We retain data only as long as necessary to fulfill the purposes outlined in this policy."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
          <h1 className="text-4xl font-display font-bold mb-6">Privacy Policy</h1>
          <p className="text-slate-600">Last updated: May 14, 2026</p>
          <div className="h-1 w-20 bg-teal-500 mt-6 rounded-full" />
        </motion.div>

        {/* DPDPA 2023 Compliance Certificate Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-16 rounded-[32px] border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-teal-500/5 to-transparent p-8 shadow-md relative overflow-hidden"
        >
          {/* Subtle gold decorative circle */}
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-900 flex-shrink-0 shadow-lg border border-amber-500/30">
              <Shield className="size-8 text-amber-700" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-500/20 text-amber-800 text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-wider border border-amber-500/30">
                  Certified Compliant
                </span>
                <span className="text-slate-500 text-xs font-semibold">
                  Registry Code: MSP-DPDPA-2023-993
                </span>
              </div>
              <h2 className="font-display text-2xl font-black text-slate-900">
                Digital Personal Data Protection Act (DPDPA) 2023
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                MyMindTherapyFriend is fully certified and compliant with the DPDP Act 2023 of India. We uphold 
                the highest standards of data principal rights, secure consent management, and localize all data residency 
                within India.
              </p>
            </div>
          </div>
          
          {/* Compliance details & Certificate image */}
          <div className="mt-8 flex flex-col md:flex-row gap-8 items-center border-t border-slate-200/50 pt-8">
            <div className="flex-1 space-y-4">
              {[
                { title: "Local Data Residency", desc: "All user databases reside strictly inside secure data centers in India." },
                { title: "Consent Manager", desc: "Users have granular and revocable consent control over their personal records." },
                { title: "Principal Rights", desc: "Full rights of access, correction, update, and complete erasure of personal data." }
              ].map((f, i) => (
                <div key={i} className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-teal-500 flex-shrink-0" />
                    {f.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed pl-3.5">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md hover:border-amber-500/40">
                <a href={dpdpaCertUrl} target="_blank" rel="noreferrer" className="block relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                  <img 
                    src={dpdpaCertUrl} 
                    alt="DPDPA 2023 Certificate of Compliance" 
                    className="size-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="bg-white/90 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow">
                      View Certificate
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-12">
          {sections.map((s, i) => (
            <motion.section 
              key={s.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`size-12 rounded-2xl bg-slate-50 flex items-center justify-center ${s.iconColor || 'text-teal-600'}`}>
                  <s.icon className="size-6" />
                </div>
                <h2 className="text-2xl font-bold">{s.title}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed pl-16">
                {s.content}
              </p>
            </motion.section>
          ))}
        </div>

        <section className="mt-20 p-8 bg-teal-900 rounded-3xl text-white">
          <h3 className="text-xl font-bold mb-4">Questions about your privacy?</h3>
          <p className="text-teal-100 mb-6">Our dedicated privacy team is here to help you understand how we protect your data.</p>
          <a href="mailto:privacy@mymindtherapyfriend.com" className="inline-block font-bold border-b-2 border-teal-400 hover:text-teal-400 transition">
            Contact Privacy Team →
          </a>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-12 text-center text-sm text-slate-500">
        © 2026 MyMindTherapyFriend™. All rights reserved.
      </footer>
    </div>
  );
}
