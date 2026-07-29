import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion';
import { Activity, Check, Mail, Building2, Shield, MessageCircle, Users, } from 'lucide-react';

const ENTERPRISE_EMAIL ="contact@mymindtherapyfriend.com";

const PRICING_PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "/mo",
    description: "Perfect for starting your mental wellness journey.",
    features: ["300 Daily AI Messages", "Basic Mood Tracking", "Community Access", "Public Therapist Listing"],
    buttonText: "Get Started",
    portalId: "user",
    color: "bg-white",
  },
  {
    name: "Mann Shanti",
    price: "₹499",
    period: "/mo",
    description: "Deepen your healing with extended AI support.",
    features: ["Unlimited AI Messages", "Advanced Mood Analytics", "Priority Therapist Booking", "Unlimited Digital Journal"],
    buttonText: "Upgrade Now",
    portalId: "user",
    color: "bg-teal-50 border-teal-200",
    popular: true,
  },
  {
    name: "Therapist Pro",
    price: "₹999",
    period: "/6 mo",
    description: "Manage your practice with AI-powered insights.",
    features: ["Live Video Sessions", "AI Pre-Session Briefs", "Earnings Dashboard", "Therapist Verified Badge"],
    buttonText: "Join as Therapist",
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

  return <div className='p-11'> {/* Pricing Section */}
        <section id="pricing" >

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
        </section></div>
}
