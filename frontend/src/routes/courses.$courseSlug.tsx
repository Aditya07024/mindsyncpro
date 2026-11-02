import React, { useEffect } from 'react';
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  MessageSquare,
  BookOpen,
  Users,
  Brain,
  HeartHandshake,
  Check,
  Building2,
  FileCheck2,
} from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/courses/$courseSlug')({
  component: CourseDetailPage,
});

interface CourseMeta {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  badge: string;
  icon: any;
  teaches: string;
  educationalCredentialAwarded: string;
  overview: string;
  modules: { title: string; desc: string }[];
  batches: { name: string; dates: string; status: string; isEnrolling?: boolean }[];
  schemaJson: any;
}

const COURSE_CATALOG: Record<string, CourseMeta> = {
  "everyday-mental-health-support": {
    title: "Everyday Mental Health Support & Psychological First Response",
    metaTitle: "Mental Health Support Course India, 52-Day Live | MMTF",
    metaDescription: "Live 52-day online course in everyday mental health support and psychological first response. Non-clinical skills, MMTF certificate. Batch 2 starts 5 Dec.",
    canonicalUrl: "https://mymindtherapyfriend.com/courses/everyday-mental-health-support",
    badge: "52-Day Live Cohort • Psychological First Response",
    icon: HeartHandshake,
    teaches: "Active listening, distress recognition, crisis escalation, referral, boundaries",
    educationalCredentialAwarded: "MMTF Certificate of Completion (not a professional licence; no external accreditation)",
    overview: "Develop vital, non-clinical psychological first response skills to safely recognize emotional distress, listen without judgment, establish healthy boundaries, and guide peers to qualified mental health professionals.",
    modules: [
      { title: "Module 1: Foundations of Emotional Support", desc: "Understanding the continuum of mental wellbeing, emotional literacy, and non-judgmental holding environments." },
      { title: "Module 2: Psychological First Response in Practice", desc: "Active listening techniques, reflective communication, and managing acute interpersonal distress safely." },
      { title: "Module 3: Crisis Awareness & De-escalation", desc: "Recognizing warning signs of severe distress, navigating helpline referral maps (Tele-MANAS 14416 / 112), and escalation protocols." },
      { title: "Module 4: Practitioner Boundaries & Self-Care", desc: "Safeguarding personal emotional capacity, preventing helper burnout, and establishing clear relational boundaries." },
    ],
    batches: [
      { name: "Batch 1", dates: "5 Nov 2026 – 26 Dec 2026", status: "Ongoing / Cohort Full" },
      { name: "Batch 2", dates: "5 Dec 2026 – 25 Jan 2027", status: "Open for Enrollment", isEnrolling: true },
      { name: "Batch 3", dates: "5 Jan 2027 – 25 Feb 2027", status: "Upcoming Cohort" },
    ],
    schemaJson: {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Everyday Mental Health Support & Psychological First Response",
      "description": "52-day live online course in listening, everyday support, crisis awareness and referral. Non-clinical skills.",
      "url": "https://mymindtherapyfriend.com/courses/everyday-mental-health-support",
      "inLanguage": "en-IN",
      "teaches": "Active listening, distress recognition, crisis escalation, referral, boundaries",
      "educationalCredentialAwarded": "MMTF Certificate of Completion (not a professional licence; no external accreditation)",
      "provider": {
        "@type": "Organization",
        "name": "MyMindTherapyFriend",
        "url": "https://mymindtherapyfriend.com"
      },
      "offers": {
        "@type": "Offer",
        "category": "Paid",
        "priceCurrency": "INR",
        "price": "4999",
        "availability": "https://schema.org/InStock",
        "url": "https://mymindtherapyfriend.com/courses/everyday-mental-health-support"
      },
      "hasCourseInstance": [
        {
          "@type": "CourseInstance",
          "name": "Everyday Mental Health Support & Psychological First Response - Batch 1",
          "courseMode": "Online",
          "startDate": "2026-11-05",
          "endDate": "2026-12-26",
          "courseWorkload": "PT58H",
          "location": {
            "@type": "VirtualLocation",
            "url": "https://mymindtherapyfriend.com/courses/everyday-mental-health-support"
          }
        },
        {
          "@type": "CourseInstance",
          "name": "Everyday Mental Health Support & Psychological First Response - Batch 2",
          "courseMode": "Online",
          "startDate": "2026-12-05",
          "endDate": "2027-01-25",
          "courseWorkload": "PT58H",
          "location": {
            "@type": "VirtualLocation",
            "url": "https://mymindtherapyfriend.com/courses/everyday-mental-health-support"
          }
        },
        {
          "@type": "CourseInstance",
          "name": "Everyday Mental Health Support & Psychological First Response - Batch 3",
          "courseMode": "Online",
          "startDate": "2027-01-05",
          "endDate": "2027-02-25",
          "courseWorkload": "PT58H",
          "location": {
            "@type": "VirtualLocation",
            "url": "https://mymindtherapyfriend.com/courses/everyday-mental-health-support"
          }
        }
      ]
    }
  },
  "ai-for-mental-wellness": {
    title: "AI for Mental Wellness: Responsible AI, Digital Support & Prompt Skills",
    metaTitle: "AI for Mental Wellness Course India, 52-Day | MMTF",
    metaDescription: "Live 52-day online course in responsible AI, prompt skills and privacy for wellbeing work. No coding needed. MMTF certificate. Batch 2 starts 5 Dec.",
    canonicalUrl: "https://mymindtherapyfriend.com/courses/ai-for-mental-wellness",
    badge: "52-Day Live Cohort • AI & Digital Wellbeing",
    icon: Brain,
    teaches: "Prompt design, AI output evaluation, privacy, human-in-the-loop workflows",
    educationalCredentialAwarded: "MMTF Certificate of Completion (not a professional licence; no external accreditation)",
    overview: "Master safe, ethical, human-in-the-loop AI methodologies for mental health and wellness workflows. Learn prompt design for emotional support tools, privacy compliance under DPDPA, and how to safeguard against hallucinations.",
    modules: [
      { title: "Module 1: Principles of Responsible AI in Mental Wellness", desc: "Capabilities and limitations of LLMs, empathetic prompting architectures, and high-risk boundaries." },
      { title: "Module 2: Human-in-the-Loop Workflow Design", desc: "Creating verification pipelines where certified counsellors guide, review, and evaluate AI assisted summaries." },
      { title: "Module 3: Privacy, Data Protection & DPDPA Compliance", desc: "Handling sensitive user health data in India, consent architectures, anonymization, and security." },
      { title: "Module 4: Practical Wellness Prompt Engineering", desc: "Hands-on laboratory crafting guided CBT worksheets, emotion check-ins, and automated distress escalation triggers." },
    ],
    batches: [
      { name: "Batch 1", dates: "5 Nov 2026 – 26 Dec 2026", status: "Ongoing / Cohort Full" },
      { name: "Batch 2", dates: "5 Dec 2026 – 25 Jan 2027", status: "Open for Enrollment", isEnrolling: true },
      { name: "Batch 3", dates: "5 Jan 2027 – 25 Feb 2027", status: "Upcoming Cohort" },
    ],
    schemaJson: {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "AI for Mental Wellness: Responsible AI, Digital Support & Prompt Skills",
      "description": "52-day live online course in safe prompt design, privacy, human review and escalation for wellbeing resources.",
      "url": "https://mymindtherapyfriend.com/courses/ai-for-mental-wellness",
      "inLanguage": "en-IN",
      "teaches": "Prompt design, AI output evaluation, privacy, human-in-the-loop workflows",
      "educationalCredentialAwarded": "MMTF Certificate of Completion (not a professional licence; no external accreditation)",
      "provider": {
        "@type": "Organization",
        "name": "MyMindTherapyFriend",
        "url": "https://mymindtherapyfriend.com"
      },
      "offers": {
        "@type": "Offer",
        "category": "Paid",
        "priceCurrency": "INR",
        "price": "4999",
        "availability": "https://schema.org/InStock",
        "url": "https://mymindtherapyfriend.com/courses/ai-for-mental-wellness"
      },
      "hasCourseInstance": [
        {
          "@type": "CourseInstance",
          "name": "AI for Mental Wellness: Responsible AI, Digital Support & Prompt Skills - Batch 1",
          "courseMode": "Online",
          "startDate": "2026-11-05",
          "endDate": "2026-12-26",
          "courseWorkload": "PT58H",
          "location": {
            "@type": "VirtualLocation",
            "url": "https://mymindtherapyfriend.com/courses/ai-for-mental-wellness"
          }
        },
        {
          "@type": "CourseInstance",
          "name": "AI for Mental Wellness: Responsible AI, Digital Support & Prompt Skills - Batch 2",
          "courseMode": "Online",
          "startDate": "2026-12-05",
          "endDate": "2027-01-25",
          "courseWorkload": "PT58H",
          "location": {
            "@type": "VirtualLocation",
            "url": "https://mymindtherapyfriend.com/courses/ai-for-mental-wellness"
          }
        },
        {
          "@type": "CourseInstance",
          "name": "AI for Mental Wellness: Responsible AI, Digital Support & Prompt Skills - Batch 3",
          "courseMode": "Online",
          "startDate": "2027-01-05",
          "endDate": "2027-02-25",
          "courseWorkload": "PT58H",
          "location": {
            "@type": "VirtualLocation",
            "url": "https://mymindtherapyfriend.com/courses/ai-for-mental-wellness"
          }
        }
      ]
    }
  },
  "youth-campus-workplace-wellbeing-facilitator": {
    title: "Youth, Campus & Workplace Wellbeing Facilitator",
    metaTitle: "Wellbeing Facilitator Course: Campus & Workplace | MMTF",
    metaDescription: "Live 52-day online course to design wellbeing activities, run safe groups and build referral maps for campus, NGO or workplace. Batch 2 starts 5 Dec.",
    canonicalUrl: "https://mymindtherapyfriend.com/courses/youth-campus-workplace-wellbeing-facilitator",
    badge: "52-Day Live Cohort • Group Facilitation",
    icon: Users,
    teaches: "Group facilitation, programme design, referral pathways, safeguarding",
    educationalCredentialAwarded: "MMTF Certificate of Completion (not a professional licence; no external accreditation)",
    overview: "Empowering university mentors, workplace HR champions, and community leaders to run psychoeducational workshops, facilitate peer support circles, and establish institution-wide safeguarding referral frameworks.",
    modules: [
      { title: "Module 1: Group Dynamics & Psychological Safety", desc: "Setting circle norms, establishing confidentiality guidelines, and facilitating vulnerability safely." },
      { title: "Module 2: Psychoeducational Workshop Design", desc: "Curating practical modules on exam pressure, work-life boundaries, burnout, and mindfulness exercises." },
      { title: "Module 3: Institutional Referral Networks", desc: "Partnering with licensed clinical psychologists, college welfare cells, and enterprise EAP programs." },
      { title: "Module 4: Community Safeguarding & Incident Handling", desc: "Crisis protocols, legal and ethical duties of care, and post-intervention documentation." },
    ],
    batches: [
      { name: "Batch 1", dates: "5 Nov 2026 – 26 Dec 2026", status: "Ongoing / Cohort Full" },
      { name: "Batch 2", dates: "5 Dec 2026 – 25 Jan 2027", status: "Open for Enrollment", isEnrolling: true },
      { name: "Batch 3", dates: "5 Jan 2027 – 25 Feb 2027", status: "Upcoming Cohort" },
    ],
    schemaJson: {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Youth, Campus & Workplace Wellbeing Facilitator",
      "description": "52-day live online course in designing wellbeing activities, group facilitation, referral maps and campaigns.",
      "url": "https://mymindtherapyfriend.com/courses/youth-campus-workplace-wellbeing-facilitator",
      "inLanguage": "en-IN",
      "teaches": "Group facilitation, programme design, referral pathways, safeguarding",
      "educationalCredentialAwarded": "MMTF Certificate of Completion (not a professional licence; no external accreditation)",
      "provider": {
        "@type": "Organization",
        "name": "MyMindTherapyFriend",
        "url": "https://mymindtherapyfriend.com"
      },
      "offers": {
        "@type": "Offer",
        "category": "Paid",
        "priceCurrency": "INR",
        "price": "4999",
        "availability": "https://schema.org/InStock",
        "url": "https://mymindtherapyfriend.com/courses/youth-campus-workplace-wellbeing-facilitator"
      },
      "hasCourseInstance": [
        {
          "@type": "CourseInstance",
          "name": "Youth, Campus & Workplace Wellbeing Facilitator - Batch 1",
          "courseMode": "Online",
          "startDate": "2026-11-05",
          "endDate": "2026-12-26",
          "courseWorkload": "PT58H",
          "location": {
            "@type": "VirtualLocation",
            "url": "https://mymindtherapyfriend.com/courses/youth-campus-workplace-wellbeing-facilitator"
          }
        },
        {
          "@type": "CourseInstance",
          "name": "Youth, Campus & Workplace Wellbeing Facilitator - Batch 2",
          "courseMode": "Online",
          "startDate": "2026-12-05",
          "endDate": "2027-01-25",
          "courseWorkload": "PT58H",
          "location": {
            "@type": "VirtualLocation",
            "url": "https://mymindtherapyfriend.com/courses/youth-campus-workplace-wellbeing-facilitator"
          }
        },
        {
          "@type": "CourseInstance",
          "name": "Youth, Campus & Workplace Wellbeing Facilitator - Batch 3",
          "courseMode": "Online",
          "startDate": "2027-01-05",
          "endDate": "2027-02-25",
          "courseWorkload": "PT58H",
          "location": {
            "@type": "VirtualLocation",
            "url": "https://mymindtherapyfriend.com/courses/youth-campus-workplace-wellbeing-facilitator"
          }
        }
      ]
    }
  }
};

function CourseDetailPage() {
  const { courseSlug } = useParams({ from: '/courses/$courseSlug' });
  const course = COURSE_CATALOG[courseSlug] || COURSE_CATALOG["everyday-mental-health-support"];
  const Icon = course.icon;

  // Dynamically update document title and description
  useEffect(() => {
    document.title = course.metaTitle;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", course.metaDescription);
    }
  }, [course]);

  return (
    <div className="min-h-screen bg-[#fffdfa] text-slate-900 font-sans">
      {/* JSON-LD Course Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(course.schemaJson) }}
      />

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
            <Link to="/courses" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition flex items-center gap-1.5">
              <ArrowLeft className="size-4" /> All Courses
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-800 mb-6">
          <Sparkles className="size-4" /> {course.badge}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#012620] tracking-tight mb-6 leading-tight">
          {course.title}
        </h1>

        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mb-8">
          {course.overview}
        </p>

        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-teal-600 mb-1">
              <Clock className="size-4" />
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Workload</span>
            </div>
            <p className="text-base font-bold text-slate-800">52 Days • 58 Hours</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Calendar className="size-4" />
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Next Cohort</span>
            </div>
            <p className="text-base font-bold text-emerald-800">Batch 2: 5 Dec 2026</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-teal-600 mb-1">
              <Award className="size-4" />
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Credential</span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-0.5">MMTF Certificate</p>
          </div>
        </div>
      </header>

      {/* Main Content & Syllabus */}
      <main className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Syllabus & Core Learning */}
          <div className="lg:col-span-2 space-y-8">
            <section className="rounded-3xl border border-teal-100 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold font-display text-[#012620] mb-4">
                What You Will Learn
              </h2>
              <div className="rounded-2xl bg-teal-50/70 border border-teal-200 p-4 mb-6 text-sm text-teal-900 font-medium">
                <strong>Core Skills Taught:</strong> {course.teaches}
              </div>

              <div className="space-y-4">
                {course.modules.map((mod, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <h3 className="text-base font-bold text-[#012620] mb-1.5 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                      {mod.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed pl-6">
                      {mod.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Credential Scope Box */}
            <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 text-xs text-amber-950 leading-relaxed">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-amber-900">
                <ShieldAlert className="size-4 text-amber-700" />
                Certificate & Scope of Practice
              </h3>
              <p>
                {course.educationalCredentialAwarded}. This course provides skills in supportive listening and referral workflows. It does not qualify the participant to diagnose psychiatric conditions, provide medical psychotherapy, or prescribe medication.
              </p>
            </section>
          </div>

          {/* Batches & Enrollment Sidebar */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-teal-200 bg-white p-6 shadow-lg sticky top-24">
              <h3 className="text-lg font-bold text-[#012620] mb-4 flex items-center gap-2">
                <Calendar className="size-5 text-teal-600" /> Upcoming Batches
              </h3>

              <div className="space-y-3 mb-6">
                {course.batches.map((batch, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 border transition ${
                      batch.isEnrolling
                        ? "border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50 opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#012620]">{batch.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        batch.isEnrolling
                          ? "bg-emerald-200 text-emerald-900"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {batch.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{batch.dates}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Link
                  to="/counseling-training"
                  data-track="course_enrol_click"
                  data-item={courseSlug}
                  data-batch="batch2"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#004038] py-3.5 px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#002f29]"
                >
                  Enrol: Batch 2 (Starts 5 Dec) <ArrowRight className="size-4" />
                </Link>

                <a
                  href="https://wa.me/918700246231"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="whatsapp_click"
                  data-item={courseSlug}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 py-3 px-6 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
                >
                  <MessageSquare className="size-4 text-emerald-600" /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
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
