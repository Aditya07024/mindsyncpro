import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion';
import { Activity, Check, Mail, Smartphone, Globe, Sparkles } from 'lucide-react';
import play from "@/assets/play.webp";
import app from "@/assets/app.png";

const ENTERPRISE_EMAIL ="contact@mymindtherapyfriend.com";

const PRICING_PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "/mo",
    description: "Perfect for starting your mental wellness journey.",
    features: ["300 Daily AI Messages", "Basic Mood Tracking", "Community Access", "Public Counsellor Listing"],
    buttonText: "Get Started",
    portalId: "user",
    color: "bg-white",
  },
  {
    name: "Mann Shanti",
    price: "₹499",
    period: "/mo",
    description: "Deepen your healing with extended AI support.",
    features: ["Unlimited AI Messages", "Advanced Mood Analytics", "Priority Counsellor Booking", "Unlimited Digital Journal"],
    buttonText: "Upgrade Now",
    portalId: "user",
    color: "bg-teal-50 border-teal-200",
    popular: true,
  },
  {
    name: "Counsellor Pro",
    price: "₹999",
    period: "/6 mo",
    description: "Manage your practice with AI-powered insights.",
    features: ["Live Video Sessions", "AI Pre-Session Briefs", "Earnings Dashboard", "Counsellor Verified Badge"],
    buttonText: "Join as Counsellor",
    portalId: "therapist",
    color: "bg-white",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Scale wellness across your entire organisation.",
    features: ["Anonymous Team Analytics", "Custom Seat Management", "Crisis Alert System", "Dedicated Support"],
    buttonText: "Contact Sales",
    portalId: "org_admin",
    color: "bg-slate-900 text-white",
    isEnterprise: true,
  },
];

export const Route = createFileRoute('/pricing')({
  component: RouteComponent,
})

function RouteComponent() {
  const handlePortalClick = (e: React.MouseEvent, portalId: string, redirectTo: string) => {
  e.preventDefault();
  
  // Construct the portal URL
  const url = `https://www.mymindtherapyfriend.com/sign-in`;
  
  // Open in new tab
  window.open(url, '_blank', 'noopener,noreferrer');
};

  return (
    <div className="p-6 md:p-11 max-w-7xl mx-auto space-y-16">
      {/* Pricing Section */}
      <section id="pricing">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm">
            <Activity className="size-4" />
            Simple, Transparent Pricing
          </div>

          <h2 className="mt-6 font-display text-4xl font-bold text-[#012620] sm:text-5xl">
            Free Mental Health Support
            <br />
            & Affordable Plans
          </h2>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-4">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, scale: 1.02 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, scale: { duration: 0.2 }, y: { duration: 0.2 } }}
              className={`relative flex flex-col rounded-[32px] border border-slate-200 p-8 shadow-sm transition-shadow duration-300 hover:shadow-xl ${plan.color}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-1 text-xs font-bold text-white shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-xl font-bold ${plan.isEnterprise ? "text-teal-400" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm font-medium opacity-60">{plan.period}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed opacity-70">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-10 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className={`size-5 shrink-0 ${plan.isEnterprise ? "text-teal-400" : "text-teal-600"}`} />
                    <span className="opacity-80">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.isEnterprise ? (
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-2 text-xs font-medium text-teal-400">
                    <Mail className="size-3" /> {ENTERPRISE_EMAIL}
                  </div>
                  <button
                    onClick={(e) => handlePortalClick(e, plan.portalId, "/sign-in")}
                    className="w-full rounded-2xl bg-teal-500 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-teal-400"
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => handlePortalClick(e, plan.portalId, "/sign-in")}
                  className={`mt-auto w-full rounded-2xl px-6 py-3 text-sm font-bold shadow-lg transition hover:scale-[1.02] ${
                    plan.popular 
                      ? "bg-[#004038] text-white hover:bg-[#00362c]" 
                      : "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {plan.buttonText}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Platform Availability Section (Shifted from landing page) */}
      <section className="relative overflow-hidden rounded-[42px] bg-[#004038] px-8 py-16 text-white shadow-2xl sm:px-12">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-teal-200 backdrop-blur-md mb-4">
              <Sparkles className="size-4" />
              Unified Access Across Platforms
            </div>
            <h3 className="font-display text-3xl font-bold sm:text-4xl text-white">
              Access MyMindTherapyFriend Everywhere
            </h3>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 items-stretch">
            {/* Web App Card */}
            <a
              href="https://www.mymindtherapyfriend.com/sign-in"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-[32px] bg-white p-5 shadow-2xl transition hover:scale-[1.03] flex flex-col justify-between"
            >
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="h-24 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#004038]">mymindtherapyfriend Dashboard</span>
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between rounded-lg bg-white/70 px-2 py-1 text-[9px] text-slate-700">
                        <span>Manas AI</span>
                        <span className="font-semibold text-teal-700">Online</span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-white/70 px-2 py-1 text-[9px] text-slate-700">
                        <span>Mood Score</span>
                        <span className="font-semibold text-emerald-600">92%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-full rounded-full bg-slate-100" />
                    <div className="h-2 w-4/5 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <h3 className="text-xl font-bold text-[#004038] flex items-center justify-center gap-2">
                  <Globe className="size-5 text-teal-600" /> Web App
                </h3>
                <span className="mt-1 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  Available Now
                </span>
              </div>
            </a>

            {/* Google Play */}
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur-xl transition hover:scale-[1.03]">
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl overflow-hidden bg-white/10 p-3">
                <img src={play} alt="Google Play Store" className="h-full w-full object-contain" />
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Smartphone className="size-5 text-cyan-300" /> Google Play
              </h3>
              <p className="mt-2 text-xs font-semibold text-teal-200 bg-teal-900/60 px-3 py-1 rounded-full border border-teal-700">
                Coming Soon
              </p>
            </div>

            {/* App Store */}
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur-xl transition hover:scale-[1.03]">
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl overflow-hidden bg-white/10 p-3">
                <img src={app} alt="App Store" className="h-full w-full object-contain" />
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Smartphone className="size-5 text-teal-300" /> App Store
              </h3>
              <p className="mt-2 text-xs font-semibold text-teal-200 bg-teal-900/60 px-3 py-1 rounded-full border border-teal-700">
                Coming Soon
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
