import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { HelpCircle, ArrowLeft, Mail, MessageSquare, Phone, Search } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/support')({
  component: SupportPage,
});

const CONTACT_EMAIL = import.meta.env.VITE_ENTERPRISE_EMAIL || "support@mymindtherapyfriend.com";

function SupportPage() {
  const faqs = [
    {
      q: "How do I start a conversation with Manas AI?",
      a: "Once you sign in to the User portal, Manas AI will be waiting for you on the main dashboard. Simply click 'Start Chat' to begin."
    },
    {
      q: "Can I book sessions with real therapists?",
      a: "Yes! mymindtherapyfriend allows you to browse and book sessions with verified RCI-registered therapists directly through the platform."
    },
    {
      q: "Is my data anonymous in the Organisation portal?",
      a: "Absolutely. All organisation analytics are aggregated and anonymized. Your employer will never see your individual conversations or identity."
    },
    {
      q: "What payment methods are supported?",
      a: "We currently support all major UPI, Credit/Debit cards, and Net Banking via Razorpay."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-white shadow-lg overflow-hidden">
              <img src={logoUrl} alt="Logo" className="size-full object-cover scale-125" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">mymindtherapyfriend</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-600 transition">
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-display font-bold mb-6">How can we help?</h1>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
            <input 
              type="text" 
              placeholder="Search for articles, guides..."
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 shadow-sm focus:ring-2 focus:ring-teal-500 outline-none transition"
            />
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-20">
          {[
            { icon: Mail, title: "Email Us", contact: CONTACT_EMAIL, desc: "Get a response within 24 hours" },
            { icon: MessageSquare, title: "Live Chat", contact: "Start Chat", desc: "Available 10 AM - 8 PM IST" }
          ].map((item) => (
            <div key={item.title} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
              <div className="size-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-6">
                <item.icon className="size-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-teal-600 font-bold mb-1">{item.contact}</p>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition list-none">
                  <span className="font-bold text-lg">{faq.q}</span>
                  <HelpCircle className="size-5 text-slate-400 group-open:text-teal-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-12 text-center text-sm text-slate-500">
        © 2026 mymindtherapyfriend. All rights reserved.
      </footer>
    </div>
  );
}
