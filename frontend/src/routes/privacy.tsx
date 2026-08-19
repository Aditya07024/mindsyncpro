import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Shield, 
  ArrowLeft, 
  Lock, 
  EyeOff, 
  Server, 
  Cookie, 
  MapPin, 
  UserCheck, 
  Sparkles, 
  Share2, 
  Globe, 
  LogOut, 
  Clock, 
  Baby, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Mail, 
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import dpdpaCertUrl from '@/assets/DPDPA_Certificate.png';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('intro');

  const sections = [
    {
      id: "intro",
      title: "Introduction",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            This privacy policy applies to the <strong>MyMindTherapyFriend</strong> app for mobile devices and web browsers, 
            together with any related services operated by <strong>Atul Kumar</strong> (collectively, the "Application"). 
            Atul Kumar is hereby referred to as the "Service Provider".
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="size-5 text-teal-600 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600">
              The Service Provider is dedicated to protecting your privacy and security. Please read this policy carefully 
              to understand how we handle your personal data.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "info-collection",
      title: "Information Collection and Use",
      icon: EyeOff,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            The Application collects information when you download and use it. This information may include details such as:
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 mt-2">
            {[
              { label: "IP Address", desc: "Your device's Internet Protocol address" },
              { label: "Pages Visited", desc: "The pages of the Application that you visit, the time and date of your visit, and the time spent on those pages" },
              { label: "Usage Time", desc: "The total duration of time spent on the Application" },
              { label: "Operating System", desc: "The specific operating system running on your device" }
            ].map((item, idx) => (
              <li key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1 hover:border-teal-200 transition">
                <span className="font-bold text-sm text-slate-900">{item.label}</span>
                <span className="text-xs text-slate-500">{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    },
    {
      id: "cookies",
      title: "Cookies & Tracking",
      icon: Cookie,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            The Application or its third-party SDKs may use cookies, SDKs, pixels, and similar technologies to support 
            functionality, analytics, or service delivery.
          </p>
          <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl">
            <span className="font-bold text-sm text-teal-900 block mb-1">Your Choice Matters</span>
            <p className="text-sm text-teal-700 leading-relaxed">
              Where required by applicable law, the Service Provider will obtain your explicit consent before using non-essential tracking technologies.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "location",
      title: "Location Information",
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            The Application collects your device's location to provide location-based features, improve the Application, and support related services.
          </p>
          <div className="grid gap-4 mt-2">
            {[
              {
                title: "Geolocation Services",
                desc: "The Service Provider may use location data to provide location-based features or content."
              },
              {
                title: "Analytics and Improvements",
                desc: "Aggregated location data may help the Service Provider understand usage patterns and improve performance."
              },
              {
                title: "Third-Party Services",
                desc: "Location data may be shared with third-party services used to support Application functionality, subject to this privacy policy and applicable law."
              }
            ].map((loc, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-start">
                <div className="size-8 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-teal-600 font-bold shrink-0 text-sm">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">{loc.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{loc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "rights",
      title: "Your Rights & California Rights",
      icon: UserCheck,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-base">Global Rights</h4>
            <p className="leading-relaxed">
              You may request access to, correction of, or deletion of your personal data held by the Service Provider. 
              To exercise these rights, or to withdraw consent where processing is based on consent, contact the Service Provider 
              directly at <a href="mailto:contact@mymindtherapyfriend.com" className="text-teal-600 hover:underline font-semibold">contact@mymindtherapyfriend.com</a>.
            </p>
          </div>
          
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
              California (CCPA/CPRA)
            </div>
            <h4 className="font-bold text-slate-900 text-base">Your California Privacy Rights</h4>
            <p className="leading-relaxed">
              If you are a California resident, you have the right to know what personal information is collected, the right to delete 
              personal information, the right to opt out of the sale or sharing of personal information, and the right to non-discrimination 
              for exercising these rights. To exercise your CCPA/CPRA rights, contact the Service Provider at <a href="mailto:contact@mymindtherapyfriend.com" className="text-teal-600 hover:underline font-semibold">contact@mymindtherapyfriend.com</a>.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "ai",
      title: "Artificial Intelligence",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            The Application uses Artificial Intelligence (AI) technologies to enhance user experience and provide certain features. 
            The AI components may process user data to deliver personalized content, recommendations, or automated functionalities. 
            All AI processing is performed in accordance with this privacy policy and applicable laws. If you have questions about the 
            AI features or data processing, please contact the Service Provider.
          </p>
          <p className="leading-relaxed">
            The Service Provider may use the information you provide to send important information, required notices, and, where permitted by law, 
            marketing communications.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <h5 className="font-bold text-sm text-slate-900 mb-1">Personally Identifiable Information (PII)</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              For a better experience while using the Application, the Service Provider may require you to provide certain personally 
              identifiable information, including but not limited to <span className="font-semibold text-slate-950">contact@mymindtherapyfriend.com</span>. 
              The information the Service Provider requests will be retained and used as described in this privacy policy.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "third-party",
      title: "Third Party Access & Services",
      icon: Share2,
      content: (
        <div className="space-y-6">
          <p className="leading-relaxed">
            Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider in improving the 
            Application and their service. The Service Provider may share your information with third parties in the ways that are described 
            in this privacy statement.
          </p>

          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Third-Party Services Used by the Application:</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "Google Play Services", url: "https://www.google.com/policies/privacy/", desc: "Underlying system functionality and authentication services." },
                { name: "Google Analytics for Firebase", url: "https://firebase.google.com/support/privacy", desc: "Aggregated, anonymous application usage telemetry." },
                { name: "Firebase Crashlytics", url: "https://firebase.google.com/support/privacy/", desc: "Stability diagnostics and crash logs tracking." }
              ].map((tp, idx) => (
                <a 
                  key={idx} 
                  href={tp.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition flex flex-col justify-between group h-full"
                >
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 group-hover:text-teal-600 transition flex items-center gap-1">
                      {tp.name} <ExternalLink className="size-3.5 inline-block opacity-0 group-hover:opacity-100 transition" />
                    </h5>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{tp.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-teal-600 mt-4 inline-flex items-center gap-1">
                    View Policy <ChevronRight className="size-3" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Disclosure of Information</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              The Service Provider may disclose User Provided and Automatically Collected Information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-xs text-slate-500">
              <li>as required by law, such as to comply with a subpoena, or similar legal process;</li>
              <li>when they believe in good faith that disclosure is necessary to protect their rights, protect your safety or the safety of others, investigate fraud, or respond to a government request;</li>
              <li>with their trusted services providers who work on their behalf, do not have an independent use of the information the Service Provider discloses to them, and have agreed to adhere to the rules set forth in this privacy statement.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "transfers",
      title: "International Data Transfers",
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            The Service Provider or its third-party service providers may transfer personal data to countries outside your country of residence, 
            including outside the European Economic Area (EEA). Where applicable law requires safeguards for international transfers, 
            the Service Provider will use appropriate mechanisms:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
            <li>Adequacy decisions or other legally recognized transfer mechanisms</li>
            <li>Your explicit consent, where required and legally permitted</li>
          </ul>
          <p className="text-sm text-slate-500 leading-relaxed">
            Data protection laws in other countries may differ from those in your jurisdiction. Where required by law, the Service Provider will apply 
            appropriate safeguards and obtain any consent required for the transfer.
          </p>
        </div>
      )
    },
    {
      id: "retention-optout",
      title: "Data Retention & Opt-Out Rights",
      icon: Clock,
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-base">Opt-Out Rights</h4>
            <p className="leading-relaxed">
              You can stop all collection of information from your mobile device or computer by uninstalling the Application. 
              Uninstalling stops the Application from collecting further data, but it does not automatically delete information 
              that has already been transmitted to the Service Provider or to third parties.
            </p>
            <p className="text-sm text-slate-500">
              To request deletion of your personal data, to withdraw consent, or to exercise any of your rights, contact the Service Provider 
              at <a href="mailto:contact@mymindtherapyfriend.com" className="text-teal-600 hover:underline">contact@mymindtherapyfriend.com</a>.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-3">
            <h4 className="font-bold text-slate-900 text-base">Data Retention Policy</h4>
            <p className="leading-relaxed">
              The Service Provider retains personal data based on its necessity for the stated purposes:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              {[
                { title: "User Provided Data", duration: "Duration of use + 12 months", desc: "Retained for app functionality, unless a longer retention is required by law." },
                { title: "Automatically Collected Data", duration: "Up to 24 months", desc: "Retained for system health, optimization and analytics compliance." },
                { title: "Aggregated & Anonymized Data", duration: "Retained Indefinitely", desc: "Anonymized logs that no longer identify you personally." },
                { title: "Legal Compliance Data", duration: "As required by law", desc: "Retained in accordance with statutory obligations and laws." }
              ].map((ret, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">{ret.title}</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ret.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md w-max mt-4">
                    {ret.duration}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-4">
              If you want the Service Provider to delete User Provided Data submitted through the Application, please contact them 
              at <a href="mailto:contact@mymindtherapyfriend.com" className="text-teal-600 hover:underline">contact@mymindtherapyfriend.com</a>. Please note 
              that some User Provided Data may be required for the Application to function properly.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "children",
      title: "Children's Privacy",
      icon: Baby,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            The Application is not intended for children under 16 years of age, or such higher age as required by applicable law. 
            The Service Provider does not knowingly solicit data from children or market the Application to them.
          </p>
          <p className="leading-relaxed">
            Where parental or guardian consent is required under applicable law, the Application is not intended for use without that consent. 
            The Service Provider does not knowingly collect personally identifiable information from children under 16 years of age in violation 
            of applicable law.
          </p>
          <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-rose-950">
            <span className="font-bold text-sm text-rose-900 block mb-1">Parental Support & Erasure</span>
            <p className="text-xs text-rose-800 leading-relaxed">
              In the event the Service Provider discovers that a child has provided personal information, the Service Provider will immediately 
              delete this from their servers. If you are a parent or guardian and you are aware that your child has provided the Service Provider 
              with personal information, please contact the Service Provider (<a href="mailto:contact@mymindtherapyfriend.com" className="underline font-bold">contact@mymindtherapyfriend.com</a>) 
              so that they will be able to take the necessary actions.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "security",
      title: "Security & Safeguards",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            The Service Provider is concerned about safeguarding the confidentiality of your information. The Service Provider provides physical, 
            electronic, and procedural safeguards to protect information the Service Provider processes and maintains.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 mt-4">
            <div className="p-4 border border-slate-200 rounded-2xl bg-white text-center">
              <span className="font-bold text-slate-800 text-xs block uppercase tracking-wider mb-2">Physical Security</span>
              <p className="text-xs text-slate-500 leading-relaxed">Secure data centers with monitored, restricted access controls.</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-2xl bg-white text-center">
              <span className="font-bold text-slate-800 text-xs block uppercase tracking-wider mb-2">Digital Security</span>
              <p className="text-xs text-slate-500 leading-relaxed">Encrypted data transmission (TLS/SSL) and secure protocols.</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-2xl bg-white text-center">
              <span className="font-bold text-slate-800 text-xs block uppercase tracking-wider mb-2">Procedural Controls</span>
              <p className="text-xs text-slate-500 leading-relaxed">Regular policy reviews and strict internal access controls.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "breach",
      title: "Data Breach Notification",
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <p className="leading-relaxed">
            If a data breach occurs that affects your personal data, the Service Provider will notify you in accordance with applicable legal 
            requirements, including, where required, providing information about the nature of the breach and the steps being taken to address it.
          </p>
        </div>
      )
    },
    {
      id: "changes-consent",
      title: "Changes & Consent",
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">Policy Changes</h4>
          <p className="leading-relaxed text-sm text-slate-600">
            The Service Provider may update this Privacy Policy from time to time. The Service Provider will notify you of material changes 
            by posting the updated Privacy Policy with an effective date. Where required by law, the Service Provider will seek your consent 
            to material changes before they take effect.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Previous versions of this Privacy Policy will be maintained and made available upon request by contacting the Service Provider 
            at <a href="mailto:contact@mymindtherapyfriend.com" className="text-teal-600 hover:underline">contact@mymindtherapyfriend.com</a>.
          </p>

          <h4 className="font-bold text-slate-900 text-sm border-t border-slate-100 pt-4 mt-4">Your Consent</h4>
          <p className="leading-relaxed text-sm text-slate-600">
            Where processing is based on consent, you provide that consent by affirmatively opting in to the relevant feature or action. 
            You may withdraw consent at any time without affecting processing carried out before withdrawal. Processing based on other 
            lawful bases is carried out as described above.
          </p>
        </div>
      )
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg overflow-hidden flex items-center justify-center">
              <img src={logoUrl} alt="Logo" className="size-8 object-cover" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MyMindTherapyFriend</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-600 transition">
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-teal-500/10 via-cyan-500/5 to-slate-50 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-6">
            Effective Date: June 1, 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 mb-4 flex items-center justify-center gap-3">
            <Lock className="size-8 text-teal-600 md:size-10" /> Privacy Policy
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
            This policy outlines how the MyMindTherapyFriend application handles and protects your data. We believe in complete transparency and putting you in control.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Quick Highlights Dashboard */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-slate-950 mb-6 flex items-center gap-2">
            <Shield className="size-5 text-teal-600" /> Policy Highlights At A Glance
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Data Minimization",
                desc: "We only collect basic device properties and location details necessary to run the application securely."
              },
              {
                icon: Cookie,
                title: "Consent First",
                desc: "Granular control over location tracking, tracking cookies, and AI data parsing with simple opt-in/opt-out options."
              },
              {
                icon: UserCheck,
                title: "Data Control",
                desc: "Fully exercise your rights to access, modify, or completely delete your personal details at any time."
              },
              {
                icon: Lock,
                title: "Advanced Safeguards",
                desc: "Physical, electronic, and strict procedural rules are applied to prevent breaches and keep data secure."
              }
            ].map((card, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="size-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4 border border-teal-100">
                    <card.icon className="size-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* DPDPA 2023 Compliance Certificate Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-16 rounded-[32px] border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-teal-500/5 to-transparent p-8 shadow-md relative overflow-hidden"
        >
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

        {/* Detailed Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
          {/* Navigation Sidebar */}
          <div className="sticky top-24 hidden lg:block bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1 max-h-[75vh] overflow-y-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4 px-2">Table of Contents</span>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  activeSection === sec.id 
                    ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-500 pl-2' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <sec.icon className={`size-4 shrink-0 ${activeSection === sec.id ? 'text-teal-600' : 'text-slate-400'}`} />
                <span className="truncate">{sec.title}</span>
              </button>
            ))}
          </div>

          {/* Privacy Policy Content */}
          <div className="lg:col-span-3 space-y-8">
            {sections.map((section, idx) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm scroll-mt-24"
              >
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                  <div className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-teal-600">
                    <section.icon className="size-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Section {idx + 1}</span>
                    <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
                  </div>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-normal">
                  {section.content}
                </div>
              </motion.section>
            ))}

            {/* Email Contact Box */}
            <section className="bg-teal-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl">
              <div className="space-y-3 max-w-lg">
                <div className="size-12 rounded-2xl bg-teal-800 flex items-center justify-center text-teal-300 border border-teal-700">
                  <Mail className="size-6" />
                </div>
                <h3 className="text-2xl font-bold font-display">Questions about your privacy?</h3>
                <p className="text-teal-100/90 text-sm leading-relaxed">
                  If you have any questions regarding privacy while using the Application, or have questions about the practices, 
                  please contact the Service Provider via email.
                </p>
              </div>
              <a 
                href="mailto:contact@mymindtherapyfriend.com" 
                className="px-6 py-4 bg-white rounded-2xl text-teal-900 font-bold text-sm shadow-lg hover:scale-105 transition hover:bg-teal-50 shrink-0 flex items-center gap-2"
              >
                Email Service Provider <ArrowLeft className="size-4 rotate-180" />
              </a>
            </section>

            {/* Generator Info */}
            <div className="text-center text-xs text-slate-400 pt-6">
              This privacy policy page was generated by <a href="https://app-privacy-policy-generator.nisrulz.com/" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">App Privacy Policy Generator</a>.
            </div>
          </div>
        </div>
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

