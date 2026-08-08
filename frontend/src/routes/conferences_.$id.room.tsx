import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  LogOut,
  Clock,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Lock,
  Crown,
  RefreshCw,
  Hourglass,
  Users,
  CheckCircle2,
  XCircle,
  X,
  ShieldCheck,
} from "lucide-react";
import API from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/conferences_/$id/room")({
  component: ConferenceRoomPage,
});

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

function ConferenceRoomPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Password prompt state
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Waiting Room state
  const [waitingForHost, setWaitingForHost] = useState(false);

  // Host / Admin waiting room management state
  const [waitingQueue, setWaitingQueue] = useState<any[]>([]);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [admittingId, setAdmittingId] = useState<string | null>(null);
  const [admittingAll, setAdmittingAll] = useState(false);

  const fetchWaitingQueue = async () => {
    try {
      const res = await API.conference.getWaitingRoom(id);
      setWaitingQueue(res.waiting || []);
    } catch (e) {
      // ignore
    }
  };

  const handleAdmitSingle = async (registrationId: string) => {
    setAdmittingId(registrationId);
    try {
      const res = await API.conference.admitAttendee(id, registrationId);
      toast.success(res.message || "Allowed participant into the room ✓");
      fetchWaitingQueue();
    } catch (err: any) {
      toast.error(err.message || "Failed to allow participant");
    } finally {
      setAdmittingId(null);
    }
  };

  const handleAdmitAll = async () => {
    setAdmittingAll(true);
    try {
      const res = await API.conference.admitAllAttendees(id);
      toast.success(res.message || "Allowed all waiting attendees into the room ✓");
      fetchWaitingQueue();
    } catch (err: any) {
      toast.error(err.message || "Failed to allow all attendees");
    } finally {
      setAdmittingAll(false);
    }
  };

  const handleDenySingle = async (registrationId: string) => {
    setAdmittingId(registrationId);
    try {
      const res = await API.conference.denyAttendee(id, registrationId);
      toast.info(res.message || "Denied participant entry");
      fetchWaitingQueue();
    } catch (err: any) {
      toast.error(err.message || "Failed to deny participant");
    } finally {
      setAdmittingId(null);
    }
  };

  // Auto-cut countdown state (remaining seconds until end time)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Fetch join details with optional passcode
  const fetchJoinInfo = async (passcode?: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setPasswordError(null);
    const guestEmail = localStorage.getItem("guest_conf_email") || undefined;
    try {
      const data = await API.conference.getJoinInfo(id, guestEmail, passcode);

      if (data.requiresPassword) {
        setRequiresPassword(true);
        setWaitingForHost(false);
        if (!isSilent) setLoading(false);
        return;
      }

      if (data.waitingForHost || data.waitingForAdminApproval) {
        setWaitingForHost(true);
        setRequiresPassword(false);
        setRoomData(data);
        if (!isSilent) setLoading(false);
        return;
      }

      setWaitingForHost(false);
      setRequiresPassword(false);
      setRoomData(data);

      // Send initial join attendance tracking
      API.conference
        .trackAttendance(id, {
          event: "join",
          deviceInfo: navigator.userAgent,
          browserInfo: navigator.vendor || "Browser",
          email: guestEmail,
        })
        .catch((e) => console.error("Attendance tracking error:", e));
    } catch (err: any) {
      const errMsg = err.message || "";
      if (errMsg.toLowerCase().includes("password required") || err.requiresPassword) {
        setRequiresPassword(true);
        setWaitingForHost(false);
        if (passcode) {
          setPasswordError("Incorrect meeting password. Please try again.");
        }
      } else {
        if (!isSilent) setError(errMsg || "Failed to load conference room details");
      }
    } finally {
      if (!isSilent) setLoading(false);
      setPasswordSubmitting(false);
    }
  };

  useEffect(() => {
    fetchJoinInfo();
  }, [id]);

  // Auto-check admission status every 3s while waiting in lobby for host approval
  useEffect(() => {
    if (!waitingForHost) return;

    const interval = setInterval(() => {
      fetchJoinInfo(enteredPassword || undefined, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [waitingForHost, id, enteredPassword]);

  // Auto-redirect to Teams if platform is teams (only when user is admitted and waitingForHost is false)
  useEffect(() => {
    if (
      roomData?.conference?.platform === "teams" &&
      roomData?.conference?.meetingLink &&
      !waitingForHost &&
      !requiresPassword
    ) {
      toast.info("You have been admitted! Redirecting to Microsoft Teams...");
      window.location.href = roomData.conference.meetingLink;
    }
  }, [roomData, waitingForHost, requiresPassword]);

  // Session timer (elapsed)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scheduled end time countdown & meeting auto-cut
  useEffect(() => {
    if (!roomData?.conference) return;

    const conf = roomData.conference;
    let targetEndMs: number | null = null;

    if (conf.endDateTime) {
      targetEndMs = new Date(conf.endDateTime).getTime();
    } else if (conf.meetingDate && conf.meetingTime) {
      const dateOnlyStr = String(conf.meetingDate).split("T")[0];
      const timeStr = conf.meetingTime || "00:00";
      const startDateTime = new Date(`${dateOnlyStr}T${timeStr.length === 5 ? timeStr + ":00" : timeStr}`);
      if (!isNaN(startDateTime.getTime())) {
        targetEndMs = startDateTime.getTime() + (conf.duration || 60) * 60 * 1000;
      }
    }

    if (!targetEndMs || isNaN(targetEndMs)) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((targetEndMs! - now) / 1000));
      setRemainingSeconds(diffSecs);

      // Auto-cut when scheduled time is reached
      if (diffSecs <= 0) {
        toast.error("The scheduled meeting time has ended. Closing session...");
        if (jitsiApiRef.current) {
          try {
            jitsiApiRef.current.executeCommand("hangup");
          } catch (e) {
            // ignore
          }
        }
        API.conference.trackAttendance(id, { event: "leave" }).catch(() => {});
        navigate({ to: "/conferences" });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [roomData, id, navigate]);

  // Periodic attendance heartbeat (every 60 seconds)
  useEffect(() => {
    const guestEmail = localStorage.getItem("guest_conf_email") || undefined;
    const interval = setInterval(() => {
      API.conference
        .trackAttendance(id, { event: "heartbeat", email: guestEmail })
        .catch((e) => console.error("Heartbeat error:", e));
    }, 60000);
    return () => clearInterval(interval);
  }, [id]);

  // Poll waiting room queue for host/admin (fetch on load + every 10 seconds)
  useEffect(() => {
    const isHost = roomData?.user?.isHost || roomData?.conference?.isHost;
    if (!roomData || !isHost) return;

    // Initial fetch
    fetchWaitingQueue();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchWaitingQueue();
    }, 10000);
    return () => clearInterval(interval);
  }, [roomData, id]);

  // Load JaaS (8x8.vc) script and initialize iframe
  useEffect(() => {
    if (!roomData || waitingForHost || requiresPassword || !jitsiContainerRef.current || roomData?.conference?.platform === "teams") return;

    let apiInstance: any = null;
    const appId = roomData.jaas?.appId || "vpaas-magic-cookie-b417268e55554d20b3e8c5a64a71f374";

    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = `https://8x8.vc/${appId}/official-external-api.js`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
          const fallbackScript = document.createElement("script");
          fallbackScript.src = "https://8x8.vc/external_api.js";
          fallbackScript.async = true;
          fallbackScript.onload = () => resolve();
          fallbackScript.onerror = () => reject(new Error("Failed to load JaaS 8x8.vc External API"));
          document.body.appendChild(fallbackScript);
        };
        document.body.appendChild(script);
      });
    };

    loadJitsiScript()
      .then(async () => {
        if (!jitsiContainerRef.current) return;

        let jwtToken = roomData.jaas?.token;
        let formattedRoomName = roomData.jaas?.roomName || roomData.conference.roomName;

        if (!jwtToken) {
          try {
            const tokenRes = await API.video.getToken({
              roomName: roomData.conference.rawRoomName || roomData.conference.roomName,
              user: {
                name: roomData.user.fullName || "Participant",
                email: roomData.user.email || "user@mymindtherapyfriend.com",
              },
              moderator: roomData.user?.isHost || roomData.conference?.isHost,
            });
            jwtToken = tokenRes.token;
            formattedRoomName = tokenRes.roomName;
          } catch (tokenErr) {
            console.error("[JaaS] Token fetch error:", tokenErr);
          }
        }

        const domain = roomData.jaas?.domain || "8x8.vc";

        const options = {
          roomName: formattedRoomName,
          jwt: jwtToken,
          width: "100%",
          height: "100%",
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: roomData.user.fullName,
            email: roomData.user.email,
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            lobby: {
              autoKnock: false,
              enableLobby: false,
            },
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "desktop",
              "chat",
              "raisehand",
              "participants-pane",
              "fullscreen",
              "hangup",
              "settings",
              "tileview",
            ],
          },
        };

        apiInstance = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = apiInstance;

        apiInstance.addEventListener("videoConferenceJoined", (participant: any) => {
          console.log("[JaaS SDK Event] Joined Conference:", participant);
        });

        apiInstance.addEventListener("readyToClose", () => {
          toast.info("You left the conference session.");
          API.conference.trackAttendance(id, { event: "leave" }).catch(() => {});
          navigate({ to: "/conferences" });
        });
      })
      .catch((err) => {
        console.error("Jitsi script error:", err);
        setError("Unable to launch video room player. Please refresh.");
      });

    return () => {
      if (apiInstance) {
        try {
          apiInstance.dispose();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [roomData, waitingForHost, requiresPassword, id, navigate]);

  const handleLeave = () => {
    if (confirm("Are you sure you want to leave the conference?")) {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.executeCommand("hangup");
        } catch (e) {
          // ignore
        }
      }
      API.conference.trackAttendance(id, { event: "leave" }).catch(() => {});
      navigate({ to: "/conferences" });
    }
  };

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold">Connecting to Video Room...</h3>
        <p className="text-slate-400 text-sm mt-2">Setting up encrypted connection powered by mymindtherapyfriend.</p>
      </div>
    );
  }

  const isMeetingHost = roomData?.user?.isHost || roomData?.conference?.isHost;

  // WAITING ROOM UI (Must come BEFORE Teams or Jitsi UI so unadmitted participants wait here!)
  if (waitingForHost) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="relative w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-teal-400/40 animate-ping" />
              <Hourglass className="w-9 h-9 text-teal-300" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Waiting for Host / Admin Approval
              </span>
              <h3 className="text-2xl font-bold text-white mt-3">
                {roomData?.conference?.title || "Meeting Waiting Room"}
              </h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                The meeting host or admin has been notified. You will automatically be admitted to the meeting as soon as they allow you in.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Checking admission status (auto every 3s)...</span>
              </div>
              <button
                onClick={() => fetchJoinInfo(enteredPassword || undefined)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-teal-400" /> Refresh Now
              </button>
            </div>

            <div className="pt-2 flex justify-center gap-4">
              <button
                onClick={() => navigate({ to: "/conferences" })}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Leave Waiting Room
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // TEAMS MEETING PORTAL UI (Rendered ONLY when user is admitted or host)
  if (roomData?.conference?.platform === "teams") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
            <Video className="w-9 h-9 text-blue-400" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                🔵 Microsoft Teams Meeting
              </span>
              {isMeetingHost && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> Host
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mt-3">
              {roomData.conference.title}
            </h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              {isMeetingHost
                ? "You are host of this Microsoft Teams session. Click below to launch Teams and use the Lobby button to manage waiting participants."
                : "You have been admitted! Click the button below to join the Microsoft Teams meeting."}
            </p>
          </div>

          {/* Host Lobby Control Bar inside Teams View */}
          {isMeetingHost && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Waiting Room Lobby Queue ({waitingQueue.length})
                </span>
                {waitingQueue.length > 0 && (
                  <button
                    onClick={handleAdmitAll}
                    disabled={admittingAll}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg transition-all text-xs"
                  >
                    Allow All ({waitingQueue.length})
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowWaitingModal(true)}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" /> Open Waiting Room Lobby ({waitingQueue.length} Waiting)
              </button>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300 text-left">
            <div><strong>Date & Time:</strong> {roomData.conference.meetingDate} at {roomData.conference.meetingTime}</div>
            {roomData.conference.endTime && <div><strong>End Time:</strong> {roomData.conference.endTime}</div>}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => navigate({ to: "/conferences" })}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Conferences
            </button>
            <button
              onClick={() => {
                if (roomData.conference.meetingLink) {
                  window.open(roomData.conference.meetingLink, "_blank", "noopener,noreferrer");
                }
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" /> Open Microsoft Teams Meeting
            </button>
          </div>
        </motion.div>

        {/* Host Waiting Room Management Modal */}
        <AnimatePresence>
          {showWaitingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-400" />
                    <h3 className="text-lg font-bold text-white">Teams Waiting Room Lobby</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                      {waitingQueue.length} Waiting
                    </span>
                  </div>
                  <button
                    onClick={() => setShowWaitingModal(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {waitingQueue.length > 0 && (
                  <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl">
                    <div>
                      <p className="text-xs text-emerald-300 font-bold">Admit All Participants</p>
                      <p className="text-[11px] text-slate-400">Allow everyone waiting to redirect to Microsoft Teams.</p>
                    </div>
                    <button
                      onClick={handleAdmitAll}
                      disabled={admittingAll}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Allow All ({waitingQueue.length})
                    </button>
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                  {waitingQueue.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate">{item.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">{item.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAdmitSingle(item.id)}
                          disabled={admittingId === item.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allow
                        </button>
                        <button
                          onClick={() => handleDenySingle(item.id)}
                          disabled={admittingId === item.id}
                          className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold text-xs rounded-xl transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Deny
                        </button>
                      </div>
                    </div>
                  ))}

                  {waitingQueue.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No attendees currently waiting in the lobby.
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowWaitingModal(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Close Lobby
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // PASSWORD PROMPT UI
  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white">Password Protected Meeting</h3>
            <p className="text-slate-400 text-sm mt-1">
              This conference requires a passcode to join. Please enter the password set by the host.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!enteredPassword.trim()) return;
              setPasswordSubmitting(true);
              fetchJoinInfo(enteredPassword.trim());
            }}
            className="space-y-4 text-left"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Meeting Password</label>
              <input
                type="password"
                required
                autoFocus
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                placeholder="Enter secret passcode..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-rose-400 font-semibold bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                {passwordError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/conferences" })}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordSubmitting || !enteredPassword.trim()}
                className="w-2/3 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
              >
                {passwordSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Join Conference
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">Access Restricted</h3>
          <p className="text-slate-400 text-sm">{error}</p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => navigate({ to: "/conferences" })}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Conferences
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-50 overflow-hidden select-none">
      {/* Top Session Bar */}
      <div className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors"
            title="Back to listing"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {roomData?.conference?.title || "Live Video Session"}
              </h2>
              {isMeetingHost && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> Host / Leader
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Meeting</span>
            </div>
          </div>
        </div>

        {/* Center Meeting Countdown / Elapsed Timer */}
        {/* <div className="flex items-center gap-2 bg-slate-950/80 border border-teal-500/20 px-3.5 py-1.5 rounded-full text-teal-300 font-mono text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          {remainingSeconds !== null ? (
            <span className={remainingSeconds < 300 ? "text-amber-400 font-bold" : ""}>
              Time Left: {formatTimer(remainingSeconds)}
            </span>
          ) : (
            <span>{formatTimer(elapsedSeconds)}</span>
          )}
        </div> */}

        {/* Right Info */}
        <div className="flex items-center gap-3">
          {isMeetingHost && (
            <button
              onClick={() => setShowWaitingModal(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                waitingQueue.length > 0
                  ? "bg-amber-400 text-slate-950 hover:bg-amber-300 font-black animate-pulse shadow-lg shadow-amber-400/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Waiting Lobby</span>
              {waitingQueue.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black">
                  {waitingQueue.length}
                </span>
              )}
            </button>
          )}

          <span className="hidden sm:inline-flex px-3 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-full border border-slate-700">
            {roomData?.user?.fullName}
          </span>
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Main Jitsi iFrame Container */}
      <div className="flex-1 relative w-full h-full bg-slate-950">
        {/* Floating Waiting Room Banner for Host */}
        {isMeetingHost && waitingQueue.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/50 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 text-xs backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>{waitingQueue.length} participant(s) waiting in lobby</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdmitAll}
                disabled={admittingAll}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 text-xs"
              >
                <CheckCircle2 className="w-4 h-4" /> Allow All
              </button>
              <button
                onClick={() => setShowWaitingModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 text-xs"
              >
                Manage Lobby
              </button>
            </div>
          </div>
        )}

        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>

      {/* Host Waiting Room Management Modal */}
      <AnimatePresence>
        {showWaitingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg font-bold text-white">Waiting Room Lobby</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    {waitingQueue.length} Waiting
                  </span>
                </div>
                <button
                  onClick={() => setShowWaitingModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {waitingQueue.length > 0 && (
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl">
                  <div>
                    <p className="text-xs text-emerald-300 font-bold">Admit All Participants</p>
                    <p className="text-[11px] text-slate-400">Allow everyone waiting in the queue to enter immediately.</p>
                  </div>
                  <button
                    onClick={handleAdmitAll}
                    disabled={admittingAll}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Allow All ({waitingQueue.length})
                  </button>
                </div>
              )}

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {waitingQueue.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-sm truncate">{item.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{item.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAdmitSingle(item.id)}
                        disabled={admittingId === item.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Allow
                      </button>
                      <button
                        onClick={() => handleDenySingle(item.id)}
                        disabled={admittingId === item.id}
                        className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold text-xs rounded-xl transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Deny
                      </button>
                    </div>
                  </div>
                ))}

                {waitingQueue.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No attendees currently waiting in the lobby.
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowWaitingModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Close Lobby
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
