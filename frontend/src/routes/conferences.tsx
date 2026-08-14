import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Calendar,
  Clock,
  Users,
  Search,
  Sparkles,
  Play,
  ArrowRight,
  ShieldCheck,
  Filter,
} from "lucide-react";
import API from "@/lib/api";
import { ConferenceRegisterModal } from "@/components/conference/ConferenceRegisterModal";
import logoUrl from "@/assets/logo.png";
import { useUser } from "@clerk/clerk-react";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { formatTime12Hour, formatDateDDMMYYYY, getNormalizedPosterUrl } from "@/lib/utils";

export const Route = createFileRoute("/conferences")({
  component: ConferencesPage,
  head: () => ({
    meta: [
      { title: "Video Conferences & Webinars | MyMindTherapyFriend" },
      {
        name: "description",
        content:
          "Join live, secure video conferences, workshops, and therapy webinars on MyMindTherapyFriend.",
      },
    ],
  }),
});

function CountdownTimer({ targetDateStr }: { targetDateStr: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDateStr).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  if (timeLeft.isOver) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        Starting Now
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs font-mono text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl font-semibold">
      <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0 mr-1" />
      {timeLeft.days > 0 && <span>{timeLeft.days}d </span>}
      <span>{String(timeLeft.hours).padStart(2, "0")}h:</span>
      <span>{String(timeLeft.minutes).padStart(2, "0")}m:</span>
      <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
    </div>
  );
}

function ConferencesPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "future" | "past">("all");
  const [selectedConference, setSelectedConference] = useState<any | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const { data: conferences = [], isLoading } = useQuery({
    queryKey: ["conferences", selectedCategory, search],
    queryFn: () =>
      API.conference.list({
        category: selectedCategory,
        search,
      }),
  });

  const filteredConferences = conferences.filter((c: any) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const confDateStr = c.meetingDate ? String(c.meetingDate).split("T")[0] : "";

    if (timeFilter === "today") {
      return confDateStr === todayStr || c.computedStatus === "live";
    }
    if (timeFilter === "future") {
      return (confDateStr > todayStr || c.computedStatus === "upcoming") && c.computedStatus !== "ended";
    }
    if (timeFilter === "past") {
      return (confDateStr < todayStr && confDateStr !== "") || c.computedStatus === "ended";
    }
    return true;
  });

  const handleJoinClick = (conf: any) => {
    setSelectedConference(conf);
    setIsRegisterOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FBFB] text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-teal-100/80 bg-white/90 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="MyMindTherapyFriend Logo" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-[#012620] tracking-tight">MyMindTherapyFriend</span>
              <span className="block text-xs text-teal-700 font-medium">Video Conferencing</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            {isSignedIn ? (
              <UserProfileDropdown />
            ) : (
              <Link
                to="/sign-in"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#004038] hover:bg-[#00302a] rounded-xl shadow-md transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12 bg-gradient-to-b from-teal-50/70 via-[#F8FBFB] to-[#F8FBFB] border-b border-teal-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-6 shadow-xs"
            >
              <Video className="w-4 h-4 text-teal-600" />
              <span>Powered by mymindtherapyfriend</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#012620] tracking-tight leading-tight"
            >
              Join Secure Online <br />
              <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Video Conferences
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
            >
              Explore live mental health webinars, interactive group therapy sessions, workshops, and exclusive expert panel discussions in HD quality.
            </motion.p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-10 max-w-4xl mx-auto bg-white border border-teal-100 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conferences by title, topic or host..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-teal-600" /> Filter:
              </span>
              {[
                { id: "all", label: "All Meetings" },
                { id: "today", label: "Today's Meetings" },
                { id: "future", label: "Future Meetings" },
                { id: "past", label: "Past Meetings" },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeFilter(tf.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    timeFilter === tf.id
                      ? "bg-[#004038] text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Conference Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-96 rounded-3xl bg-white border border-teal-100 animate-pulse p-6 flex flex-col justify-between shadow-xs"
              >
                <div className="h-40 bg-slate-100 rounded-2xl w-full" />
                <div className="space-y-3 mt-4">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                </div>
                <div className="h-10 bg-slate-200 rounded-xl w-full mt-6" />
              </div>
            ))}
          </div>
        ) : filteredConferences.length === 0 ? (
          <div className="text-center py-20 bg-white border border-teal-100 rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
            <Video className="w-16 h-16 text-teal-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#012620]">No Conferences Found</h3>
            <p className="text-slate-500 text-sm mt-2">
              We couldn't find any video conferences matching your search filters. Try clearing your search query or choosing another status filter.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setTimeFilter("all");
              }}
              className="mt-6 px-5 py-2.5 text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredConferences.map((conf: any) => {
              const dateOnly = conf.meetingDate ? String(conf.meetingDate).split("T")[0] : "";
              const timeStr = conf.meetingTime || "00:00";
              const cleanTime = timeStr.length === 5 ? timeStr + ":00" : timeStr;
              const startDateTimeStr = `${dateOnly}T${cleanTime}`;
              const isLive = conf.computedStatus === "live";
              const isUpcoming = conf.computedStatus === "upcoming";
              const isEnded = conf.computedStatus === "ended";

              const isFree = conf.priceType === "free" || conf.price === 0;

              return (
                <motion.div
                  key={conf._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group relative flex flex-col bg-white border border-teal-100 hover:border-teal-300 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
                >
                  {/* Thumbnail Poster / Banner */}
                  <div className="relative min-h-[14rem] w-full bg-slate-950 flex items-center justify-center p-3 overflow-hidden border-b border-teal-950/20">
                    {getNormalizedPosterUrl(conf.posterUrl || conf.banner) ? (
                      <img
                        src={getNormalizedPosterUrl(conf.posterUrl || conf.banner)}
                        alt={conf.title}
                        className="max-w-full max-h-56 object-contain rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950 flex items-center justify-center p-6 text-center">
                        <Video className="w-12 h-12 text-teal-400/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap z-10">
                      {isLive && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-md animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          LIVE NOW
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-700 text-white shadow-xs backdrop-blur-md">
                          Upcoming
                        </span>
                      )}
                      {isEnded && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700 backdrop-blur-md">
                          Ended
                        </span>
                      )}
                    </div>


                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      {isFree ? (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-md">
                          FREE
                        </span>
                      ) : conf.priceType === "custom" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-md">
                          CUSTOM
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#004038] text-white shadow-md">
                          ₹{conf.price}
                        </span>
                      )}
                    </div>

                    
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#012620] group-hover:text-teal-700 transition-colors">
                        {conf.title}
                      </h3>
                      <p className="text-slate-600 text-sm mt-2 leading-relaxed whitespace-pre-line">
                        {conf.description}
                      </p>
                    </div>

                    {/* Meta info list */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" /> Date & Time
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatDateDDMMYYYY(conf.meetingDate)} at {formatTime12Hour(conf.meetingTime)} {conf.endTime ? `- ${formatTime12Hour(conf.endTime)}` : ""}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> Duration
                        </span>
                        <span className="font-semibold text-slate-700">{conf.duration} mins</span>
                      </div>

                      {/* Countdown Timer for Upcoming */}
                      {isUpcoming && (
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Starts in:</span>
                          <CountdownTimer targetDateStr={startDateTimeStr} />
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="pt-2">
                      {isEnded ? (
                        <button
                          disabled
                          className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-slate-100 text-slate-400 cursor-not-allowed text-center border border-slate-200"
                        >
                          Conference Ended
                        </button>
                      ) : conf.isUserRegistered ? (
                        <button
                          onClick={() => { window.location.href = `/conferences/${conf._id}/room`; }}
                          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                            conf.platform === "teams"
                              ? "bg-blue-600 hover:bg-blue-500 text-white"
                              : conf.platform === "google_meet"
                              ? "bg-rose-600 hover:bg-rose-500 text-white"
                              : "bg-[#004038] hover:bg-[#00302a] text-white"
                          }`}
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>{isLive ? "Join Room Now" : "Enter Room"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinClick(conf)}
                          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            isLive
                              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-md hover:scale-[1.02]"
                              : conf.platform === "teams"
                              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:scale-[1.02]"
                              : conf.platform === "google_meet"
                              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-md hover:scale-[1.02]"
                              : "bg-[#004038] hover:bg-[#00302a] text-white shadow-md hover:scale-[1.02]"
                          }`}
                        >
                          {isLive ? (
                            <>
                              <Play className="w-4 h-4 fill-white" />
                              <span>Join Now</span>
                            </>
                          ) : (
                            <>
                              <span>Register to Attend</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Registration Modal */}
      <ConferenceRegisterModal
        conference={selectedConference}
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}
