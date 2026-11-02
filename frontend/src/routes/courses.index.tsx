import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Clock, Award, ShieldCheck, ArrowRight, MessageSquare, BookOpen, Users, Brain, HeartHandshake } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/courses/')({
  component: CoursesDirectoryPage,
  head: () => ({
    meta: [
      { title: "Live 52-Day Mental Health & AI Courses India | MMTF" },
      { name: "description", content: "Explore live 52-day online certificate courses in everyday mental health support, responsible AI for wellness, and youth/workplace facilitation. MMTF Certificate." },
      { property: "og:title", content: "Live 52-Day Mental Health & AI Courses India | MMTF" },
      { property: "og:description", content: "Explore live 52-day online certificate courses in everyday mental health support, responsible AI for wellness, and youth/workplace facilitation. MMTF Certificate." },
    ],
  }),
});

const COURSES = [
  {
    slug: "everyday-mental-health-support",
    title: "Everyday Mental Health Support & Psychological First Response",
    badge: "Community & First Response",
    icon: HeartHandshake,
    description: "52-day live online course in listening, everyday support, crisis awareness, distress recognition, and safe referral pathways.",
    teaches: "Active listening, distress recognition, crisis escalation, referral, boundaries",
    nextBatch: "Batch 2: Starts 5 Dec 2026",
    duration: "52 Days • 58 Hours",
    price: "Cohort Enrollment Open",
  },
  {
    slug: "ai-for-mental-wellness",
    title: "AI for Mental Wellness: Responsible AI, Digital Support & Prompt Skills",
    badge: "AI & Digital Healthcare",
    icon: Brain,
    description: "52-day live online course in safe prompt design, privacy, human-in-the-loop workflows, and ethical escalation for wellness work. No coding needed.",
    teaches: "Prompt design, AI output evaluation, privacy, human-in-the-loop workflows",
    nextBatch: "Batch 2: Starts 5 Dec 2026",
    duration: "52 Days • 58 Hours",
    price: "Cohort Enrollment Open",
  },
  {
    slug: "youth-campus-workplace-wellbeing-facilitator",
    title: "Youth, Campus & Workplace Wellbeing Facilitator",
    badge: "Campus & Corporate Leadership",
    icon: Users,
    description: "52-day live online course to design wellbeing activities, run safe peer support groups, build referral maps, and lead wellness initiatives.",
    teaches: "Group facilitation, programme design, referral pathways, safeguarding",
    nextBatch: "Batch 2: Starts 5 Dec 2026",
    duration: "52 Days • 58 Hours",
    price: "Cohort Enrollment Open",
  },
];

function CoursesDirectoryPage() {
  return (
    <div className="min-h-screen bg-[#fffdfa] text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-white shadow-lg overflow-hidden">
              <img src={logoUrl} alt="MyMindTherapyFriend (MMTF) logo" className="size-full object-cover scale-125" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-[#012620]">MyMindTherapyFriend</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/counseling-training" className="text-sm font-semibold text-teal-800 hover:text-teal-600 transition">
              All Training Programs
            </Link>
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-800 mb-6"
        >
          <Sparkles className="size-4" /> Live Cohort Learning
        </motion.div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-[#012620] tracking-tight mb-6">
          Live 52-Day Mental Health & AI Skills Courses
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Practical, non-clinical skills training for students, educators, professionals, and wellness champions. Live cohorts with interactive case discussions and MMTF Certificate of Completion.
        </p>
      </header>

      {/* Courses List */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid gap-8 md:grid-cols-3">
          {COURSES.map((course) => {
            const Icon = course.icon;
            return (
              <div
                key={course.slug}
                className="flex flex-col justify-between rounded-3xl border border-teal-100 bg-white p-7 shadow-sm transition-all hover:shadow-xl hover:border-teal-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {course.badge}
                    </span>
                    <Icon className="size-6 text-teal-600" />
                  </div>

                  <h2 className="text-xl font-bold font-display text-[#012620] mb-3 leading-snug">
                    {course.title}
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {course.description}
                  </p>

                  <div className="space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-teal-600" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-emerald-800">
                      <Calendar className="size-4 text-emerald-600" />
                      <span>{course.nextBatch}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="size-4 text-teal-600" />
                      <span>MMTF Certificate of Completion</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                  <Link
                    to={`/courses/${course.slug}`}
                    data-track="course_view_click"
                    data-item={course.slug}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#004038] py-3 text-sm font-bold text-white transition hover:bg-[#002f29]"
                  >
                    View Syllabus & Batches <ArrowRight className="size-4" />
                  </Link>

                  <a
                    href="https://wa.me/918700246231"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="whatsapp_click"
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-emerald-700 py-1 transition"
                  >
                    Ask questions on WhatsApp →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Safety Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 px-6 text-center">
        <p className="text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Educational skills programme, not a professional licence or clinical service. No external accreditation is claimed. In an emergency call 112 (India).
        </p>
        <p className="mt-3 text-xs text-slate-400">
          © 2026 MyMindTherapyFriend (MMTF) · contact@mymindtherapyfriend.com
        </p>
      </footer>
    </div>
  );
}
