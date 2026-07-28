import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { ShieldCheck, Video, Users, Heart, Play, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/meeting_workspace')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='p-11'> 
    {/* Video Conference Feature Highlight Section */}
        <section id="video-conferences" className="relative overflow-hidden rounded-[40px] border border-teal-500/20 bg-gradient-to-br from-slate-900 via-[#002822] to-slate-950 p-8 sm:p-14 shadow-2xl text-white">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300 backdrop-blur-md">
                <Video className="size-4 text-teal-400" />
                <span>Powered by MyMindtherapyFriend</span>
              </div>

              <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl text-white leading-tight">
                Join a Video <br />
                <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-200 bg-clip-text text-transparent">
                  Conference
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Experience high-definition, end-to-end encrypted live online conferences, group therapy sessions, wellness workshops, and interactive expert webinars right in your browser.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-teal-400 shrink-0" />
                  <span>end to end Encryption rooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-teal-400 shrink-0" />
                  <span>Interactive Chat & Polls</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="size-4 text-teal-400 shrink-0" />
                  <span>No App Install Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="size-4 text-teal-400 shrink-0" />
                  <span>Verified Host Therapists</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/conferences"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-8 py-4 text-base font-bold text-slate-950 shadow-xl shadow-teal-500/20 transition-all hover:scale-[1.03] hover:from-teal-400 hover:to-emerald-400 active:scale-95"
                >
                  <span>Browse Conferences</span>
                  <ArrowRight className="size-5" />
                </Link>
              </div>
            </div>

            {/* Glassmorphic Mockup Preview Card */}
            <div className="relative rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Video Session</span>
                </div>
                <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-500/30">
                  HD Quality
                </span>
              </div>

              <div className="relative h-56 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-950/60 via-slate-950 to-emerald-950/60 opacity-80" />
                <div className="relative z-10 text-center space-y-3 p-4">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 shadow-inner">
                    <Video className="size-7" />
                  </div>
                  <h4 className="font-bold text-white text-base">Mindfulness & Stress Relief Masterclass</h4>
                  <p className="text-xs text-slate-400">Hosted by mymindtherapyfriend</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                <span>🔒 Secure Room</span>
                <span className="text-teal-400 font-semibold">Join your Workshops</span>
              </div>
            </div>
          </div>
        </section></div>
}
