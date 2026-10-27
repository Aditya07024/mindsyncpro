import { motion } from "framer-motion";
import {
  Smartphone,
  ShieldCheck,
  Sparkles,
  Video,
  Heart,
  Download,
  Star,
  ArrowUpRight,
} from "lucide-react";
import logoUrl from "@/assets/logo.png";
import playIcon from "@/assets/play.webp";
import appStoreIcon from "@/assets/app.png";

export const PLAY_STORE_APP_URL =
  "https://play.google.com/store/apps/details?id=com.atul.mymindtherapyfriend&pcampaignid=web_share";

const APP_HIGHLIGHTS = [
  {
    icon: Sparkles,
    label: "24/7 Manas AI Chat",
    sub: "Emotion-aware CBT support",
  },
  {
    icon: Heart,
    label: "Daily Mood & Journal",
    sub: "10-point check-ins & insights",
  },
  {
    icon: Video,
    label: "1-Tap Video Sessions",
    sub: "Verified RCI counsellors",
  },
  {
    icon: ShieldCheck,
    label: "100% Private & Safe",
    sub: "DPDPA 2023 compliant",
  },
];

export function MobileAppDownloadSection() {
  return (
    <section
      id="download-app"
      className="relative mt-24 overflow-hidden rounded-[40px] border border-teal-900/20 bg-gradient-to-br from-[#012620] via-[#004038] to-[#065f52] px-6 py-14 text-white shadow-[0_28px_90px_rgba(1,38,32,0.28)] sm:px-10 sm:py-16 lg:px-16 lg:py-20"
    >
      {/* Ambient Decorative Glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left Content Column */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/30 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-200 backdrop-blur-md"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <Smartphone className="size-3.5 text-emerald-300" />
            Official Mobile App • Live Now
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.6 }}
            className="mt-6 font-display text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Carry Your Mental Wellness
            <span className="block bg-gradient-to-r from-[#fde8ce] via-emerald-200 to-teal-200 bg-clip-text text-transparent mt-1">
              Companion Everywhere
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-5 max-w-xl text-sm leading-relaxed text-emerald-50/90 sm:text-base lg:text-lg"
          >
            Experience{" "}
            <span className="font-semibold text-white">mymindtherapyfriend</span>{" "}
            on Android. Chat anytime with Manas AI, log daily mood check-ins,
            practice guided breathing &amp; CBT tools, and attend private video
            sessions with verified counsellors right from your phone.
          </motion.p>

          {/* 4 Feature Pills */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {APP_HIGHLIGHTS.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.18 + idx * 0.06, duration: 0.45 }}
                className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/8 p-3.5 backdrop-blur-md transition hover:border-emerald-300/35 hover:bg-white/12"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-snug">
                    {item.label}
                  </p>
                  <p className="text-xs text-emerald-100/75 mt-0.5">
                    {item.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Store Download Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href={PLAY_STORE_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3.5 rounded-2xl bg-white px-6 py-3.5 text-[#012620] shadow-[0_14px_35px_rgba(0,0,0,0.25)] ring-2 ring-white/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff9e6] hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)] active:scale-[0.98]"
            >
              <img
                src={playIcon}
                alt="Download on Google Play"
                className="size-9 object-contain shrink-0 transition-transform duration-200 group-hover:scale-110"
              />
              <div className="text-left">
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-800">
                  Get it on
                </span>
                <span className="font-display text-lg font-extrabold leading-tight text-[#012620] flex items-center gap-1">
                  Google Play
                  <ArrowUpRight className="size-4 text-teal-700 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </a>

            <div
              className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/8 px-5 py-3.5 text-white/80 backdrop-blur-md select-none"
              title="iOS App Store release coming soon"
            >
              <img
                src={appStoreIcon}
                alt="App Store Coming Soon"
                className="size-8 rounded-lg object-contain opacity-85 shrink-0"
              />
              <div className="text-left">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200/80">
                  Coming Soon
                </span>
                <span className="font-display text-base font-bold leading-tight text-white/90">
                  App Store
                </span>
              </div>
            </div>
          </motion.div>

          {/* Trust Footnote */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-emerald-100/80">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Download className="size-3.5 text-emerald-300" />
              Free to download &amp; start
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Star className="size-3.5 fill-amber-300 text-amber-300" />
              Synced across Web &amp; Android
            </span>
          </div>
        </div>

        {/* Right Interactive Phone Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="relative mx-auto w-full max-w-[320px] sm:max-w-[340px]"
        >
          {/* Floating Glow Ring Behind Phone */}
          <div className="pointer-events-none absolute -inset-4 rounded-[52px] bg-gradient-to-tr from-emerald-400/25 via-teal-200/15 to-[#fde8ce]/25 blur-2xl" />

          {/* Phone Frame */}
          <div className="relative rounded-[42px] border-[6px] border-slate-900/90 bg-[#F9F9F8] p-4 text-slate-900 shadow-2xl">
            {/* Top Speaker Notch */}
            <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-slate-300" />

            {/* App Header */}
            <div className="flex items-center justify-between rounded-2xl bg-white px-3.5 py-2.5 shadow-xs border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-8 overflow-hidden rounded-lg bg-white shadow-xs border border-slate-100">
                  <img
                    src={logoUrl}
                    alt="MyMindTherapyFriend App"
                    className="size-full object-cover scale-125"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-500 leading-none">
                    Welcome back
                  </p>
                  <p className="font-display text-xs font-bold text-[#012620] mt-0.5">
                    MyMindFriend 👋
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-[#004038]">
                Android
              </span>
            </div>

            {/* Mood Check-in Preview Card */}
            <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <p className="font-display text-[11px] font-bold text-[#012620]">
                How are you feeling right now?
              </p>
              <div className="mt-2.5 flex items-center justify-between text-sm">
                {["😞", "😟", "😕", "😐", "🙂", "😊", "😄", "😁", "🤩", "🥰"].map(
                  (emoji, i) => (
                    <span
                      key={i}
                      className={`inline-flex size-5 items-center justify-center rounded-full text-xs ${
                        i === 5
                          ? "scale-125 bg-teal-100 ring-2 ring-[#004038]/30"
                          : "opacity-80"
                      }`}
                    >
                      {emoji}
                    </span>
                  )
                )}
              </div>
              <p className="mt-2 text-center text-[9px] font-medium text-teal-700">
                Logged for today (6/10) ✨
              </p>
            </div>

            {/* Manas AI Preview Card */}
            <div className="mt-3 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/90 to-emerald-50/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#004038]">
                  <Sparkles className="size-3 text-teal-600" />
                  Manas AI Companion
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="mt-2 rounded-xl bg-white/90 p-2.5 text-[11px] leading-relaxed text-slate-700 shadow-2xs">
                &ldquo;You&apos;re doing better than you think. Want to try a
                2-minute 4-7-8 calm breath together?&rdquo;
              </p>
            </div>

            {/* Bottom Install CTA Bar inside Phone */}
            <a
              href={PLAY_STORE_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#004038] py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#012620]"
            >
              <img
                src={playIcon}
                alt=""
                className="size-4 object-contain"
              />
              Install from Google Play
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
