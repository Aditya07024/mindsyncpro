import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Brain, Heart, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-900 font-sans">
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

      <main className="max-w-4xl mx-auto px-6 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 mb-6">
            <Sparkles className="size-4" />
            Our Mission
          </div>
          <h1 className="text-5xl font-display font-bold text-slate-900 mb-6">
            Healing Through <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">Honest Conversations</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            mymindtherapyfriend was born from a simple idea: everyone deserves a safe space to be heard, 
            without judgment, at any time of the day.
          </p>
        </motion.div>

        <section className="grid gap-12 md:grid-cols-2 mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Who We Are</h2>
            <p className="text-slate-600 leading-relaxed">
              We are a team of technologists, psychologists, and dreamers dedicated to 
              democratizing mental wellness. In a world that's increasingly connected 
              yet emotionally isolated, mymindtherapyfriend acts as a bridge between technology 
              and human empathy.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our AI, Manas, isn't just a chatbot—it's an emotion-aware companion trained 
              to provide calming guidance and help you navigate the complexities of your mind.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Brain className="text-teal-500" /> Our Core Pillars
            </h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="size-10 shrink-0 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold">Privacy First</h4>
                  <p className="text-sm text-slate-500">Your conversations are your own. We use end-to-end encryption for all sessions.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="size-10 shrink-0 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                  <Heart className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold">Empathy Driven</h4>
                  <p className="text-sm text-slate-500">Technology should feel human. Our AI is designed to understand and mirror human emotions.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-slate-900 rounded-[2.5rem] p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Join the Wellness Revolution</h2>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto">
            Whether you're a student looking for support or a therapist wanting to help, 
            mymindtherapyfriend has a place for you.
          </p>
          <Link to="/" className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-xl transition hover:scale-105">
            Get Started with mymindtherapyfriend
          </Link>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-12 text-center text-sm text-slate-500">
        © 2026 mymindtherapyfriend. All rights reserved.
      </footer>
    </div>
  );
}
