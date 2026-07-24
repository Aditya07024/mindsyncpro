import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  MessageSquare,
  Hand,
  Users as UsersIcon,
  Maximize,
  LogOut,
  Clock,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Lock,
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

  // Quick controls state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Fetch join details
  useEffect(() => {
    let mounted = true;
    const guestEmail = localStorage.getItem("guest_conf_email") || undefined;
    async function loadJoinInfo() {
      try {
        setLoading(true);
        const data = await API.conference.getJoinInfo(id, guestEmail);
        if (mounted) {
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
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load conference room details");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadJoinInfo();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Load JaaS (8x8.vc) script and initialize iframe
  useEffect(() => {
    if (!roomData || !jitsiContainerRef.current) return;

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
          // Fallback script URL
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

        // If JWT token is missing from roomData, fetch from /api/video/token endpoint
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
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
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

        apiInstance.addEventListener("audioMuteStatusChanged", (data: { muted: boolean }) => {
          setIsAudioMuted(data.muted);
        });

        apiInstance.addEventListener("videoMuteStatusChanged", (data: { muted: boolean }) => {
          setIsVideoMuted(data.muted);
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
  }, [roomData, id, navigate]);

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

  const toggleMic = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleAudio");
    }
  };

  const toggleCam = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleVideo");
    }
  };

  const toggleScreenShare = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleShareScreen");
    }
  };

  const toggleChat = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleChat");
    }
  };

  const raiseHand = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleRaiseHand");
      toast.success("Hand raised!");
    }
  };

  const toggleFullscreen = () => {
    if (jitsiContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        jitsiContainerRef.current.requestFullscreen().catch(() => {});
      }
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
        <p className="text-slate-400 text-sm mt-2">Setting up encrypted connection powered by Jitsi Meet.</p>
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
            <h2 className="text-sm font-bold text-white line-clamp-1">
              {roomData?.conference?.title || "Live Video Session"}
            </h2>
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Meeting</span>
            </div>
          </div>
        </div>

        {/* Center Meeting Timer */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-teal-500/20 px-3.5 py-1.5 rounded-full text-teal-300 font-mono text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-3">
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
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
