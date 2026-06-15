import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  TrackToggle,
  useTracks,
  useDataChannel,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Clock, MessageCircle, X, Send, LogOut,
  AlertCircle, Brain, Star, FileText, Save, Pill,
} from "lucide-react";


export const Route = createFileRoute("/session/$bookingId")({
  component: VideoSession,
});

/* ─── Chat message type ─── */
interface ChatMsg { from: string; text: string; ts: number }

/* ─── Countdown formatter ─── */
function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ─── Rating stars ─── */
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex justify-center gap-3">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(s)} className="transition-transform hover:scale-110">
          <Star className={`size-8 ${s <= value ? "fill-black text-black" : "text-black"}`} />
        </button>
      ))}
    </div>
  );
}

/* ─── Custom Video Grid Layout ─── */
function CustomVideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <>
      <RoomAudioRenderer />
      <GridLayout tracks={tracks} style={{ height: "100%", width: "100%" }}>
        <ParticipantTile />
      </GridLayout>
    </>
  );
}

/* ─── Inner room UI (needs room context) ─── */
function RoomUI({
  bookingId, booking, userRole, aiBrief, showBrief, setShowBrief,
}: {
  bookingId: string;
  booking: any;
  userRole: string;
  aiBrief: any;
  showBrief: boolean;
  setShowBrief: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => API.subscription.get(),
    enabled: userRole === "user",
    retry: false,
  });
  const currentTier = subscription?.tier ?? "free";

  /* Auto-hide controls */
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHide = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetHide();
    window.addEventListener("mousemove", resetHide);
    window.addEventListener("touchstart", resetHide);
    return () => {
      window.removeEventListener("mousemove", resetHide);
      window.removeEventListener("touchstart", resetHide);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetHide]);

  /* Session countdown */
  const [secsLeft, setSecsLeft] = useState<number | null>(null);
  const fiveMinToasted = useRef(false);

  useEffect(() => {
    if (!booking?.slot) return;
    const end = new Date(booking.slot).getTime() + 60 * 60 * 1000; // 1-hour session
    const tick = () => {
      const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining <= 300 && !fiveMinToasted.current) {
        fiveMinToasted.current = true;
        toast.warning("5 minutes remaining in your session", { duration: 8000 });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking?.slot]);

  /* LiveKit data channel chat */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const { send } = useDataChannel("chat", (msg) => {
    try {
      const decoded = new TextDecoder().decode(msg.payload);
      const parsed = JSON.parse(decoded) as ChatMsg;
      setMessages((prev) => [...prev, parsed]);
    } catch {}
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMsg = { from: "Me", text: chatInput.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, msg]);
    send(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true });
    setChatInput("");
  };

  /* LiveKit data channel for report sharing */
  const [reportPanelOpen, setReportPanelOpen] = useState(false);
  const [sharedReportId, setSharedReportId] = useState<string | null>(null);

  const { send: sendReportShare } = useDataChannel("report-share", (msg) => {
    try {
      const decoded = new TextDecoder().decode(msg.payload);
      const parsed = JSON.parse(decoded);
      if (parsed.type === "REPORT_SHARED" && parsed.sharedReportId) {
        setSharedReportId(parsed.sharedReportId);
        setReportPanelOpen(true);
        setNotesPanelOpen(false); // Close notes to avoid overlap
        toast.success("Client shared a wellness report with you!", { duration: 8000 });
      }
    } catch (e) {
      console.error("Failed to parse report-share message", e);
    }
  });

  /* User report share modal states */
  const [reportShareModalOpen, setReportShareModalOpen] = useState(false);
  const [sharePeriod, setSharePeriod] = useState<"day" | "week" | "fortnight" | "month">("fortnight");
  const [shareNotes, setShareNotes] = useState("");
  const [isSharingReport, setIsSharingReport] = useState(false);

  useEffect(() => {
    if (userRole === "user") {
      setSharePeriod(currentTier === "free" ? "fortnight" : "week");
    }
  }, [currentTier, userRole]);

  /* Query for shared report details */
  const { data: sharedReport, isLoading: loadingReport } = useQuery({
    queryKey: ["meeting-shared-report", sharedReportId],
    queryFn: () => API.therapist.sharedReportDetail(sharedReportId!),
    enabled: !!sharedReportId && userRole === "therapist",
  });

  const [prescriptionPanelOpen, setPrescriptionPanelOpen] = useState(false);

  const togglePrescriptionPanel = () => {
    setPrescriptionPanelOpen((v) => !v);
    setNotesPanelOpen(false);
    setReportPanelOpen(false);
  };

  const toggleNotesPanel = () => {
    setNotesPanelOpen((v) => !v);
    setReportPanelOpen(false);
    setPrescriptionPanelOpen(false);
  };
  
  const toggleReportPanel = () => {
    setReportPanelOpen((v) => !v);
    setNotesPanelOpen(false);
    setPrescriptionPanelOpen(false);
  };

  /* Therapist notes */
  const notesKey = `therapist-notes-${bookingId}`;
  const [notes, setNotes] = useState(() => sessionStorage.getItem(notesKey) ?? "");
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);

  /* Prescription states */
  const [medicines, setMedicines] = useState<string[]>([]);
  const [currentMedName, setCurrentMedName] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");

  // Sync initial prescription if exists
  useEffect(() => {
    if (booking?.prescription) {
      setMedicines(booking.prescription.medicines || []);
      setPrescriptionNotes(booking.prescription.notes || "");
    }
  }, [booking?.prescription]);

  const savePrescriptionMutation = useMutation({
    mutationFn: () => API.booking.savePrescription(bookingId, { medicines, notes: prescriptionNotes }),
    onSuccess: () => toast.success("Prescription saved successfully"),
    onError: (e: Error) => toast.error(e.message || "Failed to save prescription"),
  });

  const saveNotesMutation = useMutation({
    mutationFn: () => API.booking.saveNotes(bookingId, notes),
    onSuccess: () => toast.success("Notes saved"),
    onError: (e: Error) => toast.error(e.message || "Failed to save notes"),
  });

  const autoSaveNotes = useCallback(() => {
    sessionStorage.setItem(notesKey, notes);
  }, [notes, notesKey]);

  useEffect(() => {
    const id = setInterval(autoSaveNotes, 10000);
    return () => clearInterval(id);
  }, [autoSaveNotes]);

  /* Post-session rating */
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const rateMutation = useMutation({
    mutationFn: () => API.booking.rate(bookingId, { rating, feedback }),
    onSuccess: () => {
      toast.success("Thanks for your feedback!");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleLeave = () => {
    if (userRole === "therapist") {
      if (notes.trim()) saveNotesMutation.mutate();
      if (medicines.length > 0 || prescriptionNotes.trim()) {
        savePrescriptionMutation.mutate();
      }
    }
    if (userRole === "user") {
      setShowRating(true);
    } else {
      navigate({ to: "/therapist/dashboard" });
    }
  };

  const isAtLimit = secsLeft === 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      {/* LiveKit video tiles */}
      <CustomVideoGrid />

      {/* Countdown timer — always visible */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-mono font-bold backdrop-blur-md shadow-lg ${
          secsLeft !== null && secsLeft <= 300
            ? "bg-red-900/80 text-red-200"
            : "bg-slate-900/60 text-white"
        }`}>
          <Clock className="size-4" />
          {secsLeft !== null ? fmtTime(secsLeft) : "--:--"}
        </div>
      </div>

      {/* AI Brief button for therapist */}
      {userRole === "therapist" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: controlsVisible ? 1 : 0 }}
          onClick={() => setShowBrief(true)}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-teal-600/80 backdrop-blur-md px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-teal-600 transition"
        >
          <Brain className="size-4" /> AI Brief
        </motion.button>
      )}

      {/* Bottom control bar — auto-hides */}
      <AnimatePresence>
        {controlsVisible && !isAtLimit && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md p-2 rounded-full shadow-2xl border border-white/10"
          >
            <div className="flex items-center gap-2 border-r border-white/10 pr-3">
              <TrackToggle source={Track.Source.Microphone} className="!bg-slate-800 !hover:bg-slate-700 !text-white !rounded-full !size-10 !flex !items-center !justify-center" />
              <TrackToggle source={Track.Source.Camera} className="!bg-slate-800 !hover:bg-slate-700 !text-white !rounded-full !size-10 !flex !items-center !justify-center" />
            </div>

            <button
              onClick={() => setChatOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-slate-800/80 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700/80 transition"
            >
              <MessageCircle className="size-4" />
              Chat
              {messages.length > 0 && (
                <span className="bg-accent rounded-full text-xs px-1.5 py-0.5">{messages.length}</span>
              )}
            </button>

            {userRole === "user" && (
              <button
                onClick={() => setReportShareModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-slate-800/80 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700/80 transition"
              >
                <FileText className="size-4" /> Share Report
              </button>
            )}

            {userRole === "therapist" && (
              <button
                onClick={toggleNotesPanel}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700/80 transition ${
                  notesPanelOpen ? "bg-teal-600/90 text-white" : "bg-slate-800/80 text-white"
                }`}
              >
                <FileText className="size-4" /> Notes
              </button>
            )}

            {userRole === "therapist" && (
              <button
                onClick={togglePrescriptionPanel}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700/80 transition ${
                  prescriptionPanelOpen ? "bg-teal-600/90 text-white" : "bg-slate-800/80 text-white"
                }`}
              >
                <Pill className="size-4" /> Prescription
              </button>
            )}

            {userRole === "user" && booking?.prescription && (
              <button
                onClick={() => setPrescriptionPanelOpen((v) => !v)}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-700/80 ${
                  prescriptionPanelOpen ? "bg-teal-600/90 text-white" : "bg-slate-800/80 text-white"
                }`}
              >
                <Pill className="size-4" /> View Prescription
              </button>
            )}

            {userRole === "therapist" && (
              <button
                disabled={!sharedReportId}
                onClick={toggleReportPanel}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  sharedReportId 
                    ? "bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md cursor-pointer text-white" 
                    : "bg-slate-800/30 text-slate-500 cursor-not-allowed"
                }`}
              >
                <FileText className="size-4" /> Shared Report
              </button>
            )}

            <button
              onClick={handleLeave}
              className="flex items-center gap-2 rounded-full bg-red-600/90 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
            >
              <LogOut className="size-4" /> Leave
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="absolute right-0 top-0 bottom-0 z-30 w-80 flex flex-col bg-slate-900/95 backdrop-blur-md shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="font-semibold text-white text-sm">Chat</span>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-slate-500 text-center mt-8">No messages yet</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "Me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === "Me" ? "bg-teal-600 text-white" : "bg-slate-700 text-slate-100"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <div className="px-3 py-3 border-t border-slate-700 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Type a message…"
                className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button onClick={sendChat} className="p-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-white transition">
                <Send className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Therapist notes panel */}
      <AnimatePresence>
        {notesPanelOpen && userRole === "therapist" && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="absolute left-0 top-0 bottom-0 z-30 w-80 flex flex-col bg-slate-900/95 backdrop-blur-md shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="font-semibold text-white text-sm">Session Notes</span>
              <div className="flex items-center gap-2">
                <button onClick={() => saveNotesMutation.mutate()}
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                  <Save className="size-3" /> Save
                </button>
                <button onClick={() => setNotesPanelOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical notes for this session…&#10;&#10;Auto-saved every 10s and submitted when you leave."
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 p-4 text-sm resize-none focus:outline-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Therapist Prescription panel */}
      <AnimatePresence>
        {prescriptionPanelOpen && userRole === "therapist" && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="absolute left-0 top-0 bottom-0 z-30 w-96 flex flex-col bg-slate-900/95 backdrop-blur-md shadow-2xl border-r border-slate-800"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900">
              <div className="flex items-center gap-2">
                <Pill className="size-4 text-teal-400" />
                <span className="font-semibold text-white text-sm">Write Prescription</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => savePrescriptionMutation.mutate()}
                  disabled={savePrescriptionMutation.isPending}
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 disabled:opacity-50">
                  <Save className="size-3" /> Save
                </button>
                <button onClick={() => setPrescriptionPanelOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medicines</label>
                <div className="flex gap-2">
                  <input
                    value={currentMedName}
                    onChange={(e) => setCurrentMedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (currentMedName.trim()) {
                          setMedicines([...medicines, currentMedName.trim()]);
                          setCurrentMedName("");
                        }
                      }
                    }}
                    placeholder="Type medicine name and press Enter..."
                    className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <Button
                    onClick={() => {
                      if (currentMedName.trim()) {
                        setMedicines([...medicines, currentMedName.trim()]);
                        setCurrentMedName("");
                      }
                    }}
                    size="sm"
                    className="rounded-xl px-3"
                  >
                    Add
                  </Button>
                </div>
                
                {/* Medicines List as Chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {medicines.length === 0 && (
                    <p className="text-xs text-slate-500 italic">No medicines added yet.</p>
                  )}
                  {medicines.map((med, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-full border border-slate-700">
                      <span>{med}</span>
                      <button
                        onClick={() => setMedicines(medicines.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prescription Notes</label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Dosage instructions, duration, or general wellness advice..."
                  className="w-full h-32 bg-slate-800 text-slate-100 placeholder-slate-500 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seeker Prescription View panel */}
      <AnimatePresence>
        {prescriptionPanelOpen && userRole === "user" && booking?.prescription && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="absolute left-0 top-0 bottom-0 z-30 w-96 flex flex-col bg-slate-900/95 backdrop-blur-md shadow-2xl border-r border-slate-800"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-2">
                <Pill className="size-4 text-teal-400" />
                <span className="font-semibold text-white text-sm">Prescription Details</span>
              </div>
              <button onClick={() => setPrescriptionPanelOpen(false)} className="text-slate-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-200">
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medicines</h5>
                {(!booking.prescription.medicines || booking.prescription.medicines.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No medicines prescribed.</p>
                ) : (
                  <div className="space-y-2">
                    {booking.prescription.medicines.map((med: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 bg-slate-850 rounded-xl p-3 border border-slate-800/40">
                        <div className="size-2 rounded-full bg-teal-500" />
                        <span className="text-sm font-semibold text-white">{med}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {booking.prescription.notes && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes & Instructions</h5>
                  <div className="bg-slate-850 rounded-xl p-4 border border-slate-800/40">
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{booking.prescription.notes}</p>
                  </div>
                </div>
              )}

              {booking.prescription.writtenAt && (
                <p className="text-[10px] text-slate-500 text-right">
                  Written on {new Date(booking.prescription.writtenAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Report panel */}
      <AnimatePresence>
        {reportPanelOpen && userRole === "therapist" && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="absolute left-0 top-0 bottom-0 z-30 w-96 flex flex-col bg-slate-900/95 backdrop-blur-md shadow-2xl border-r border-slate-800"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-teal-400" />
                <span className="font-semibold text-white text-sm">Shared Wellness Report</span>
              </div>
              <button onClick={() => setReportPanelOpen(false)} className="text-slate-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-200">
              {loadingReport && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="size-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                  <p className="text-xs text-slate-400">Loading shared wellness report...</p>
                </div>
              )}

              {!loadingReport && !sharedReport && (
                <p className="text-xs text-slate-500 text-center py-10">No report shared or failed to load.</p>
              )}

              {sharedReport && (
                <>
                  {/* Summary Card */}
                  <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-base">{sharedReport.user?.fullName}</h4>
                        <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold mt-0.5">
                          Shared {sharedReport.period}ly report
                        </p>
                      </div>
                      {sharedReport.avgMood !== null && (
                        <div className="text-right">
                          <div className={`inline-flex items-center justify-center size-10 rounded-xl font-bold text-base ${
                            sharedReport.avgMood >= 7 ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : sharedReport.avgMood >= 4 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {sharedReport.avgMood}
                          </div>
                          <p className="text-[9px] text-slate-500 font-semibold mt-1">AVG MOOD</p>
                        </div>
                      )}
                    </div>
                    {sharedReport.notes && (
                      <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60">
                        <p className="text-[10px] font-bold text-teal-400 uppercase mb-1">Seeker Note</p>
                        <p className="text-xs text-slate-350 italic">"{sharedReport.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Mood Logs */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Mood Check-ins</h5>
                    {sharedReport.moods?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No mood check-ins in this period.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {sharedReport.moods?.map((m: any) => (
                          <div key={m.id} className="bg-slate-850 rounded-xl p-3 border border-slate-800/40 flex items-start gap-3">
                            <span className={`inline-grid place-items-center size-6 rounded-lg text-xs font-bold shrink-0 ${
                              m.score >= 7 ? "bg-green-500/10 text-green-400"
                              : m.score >= 4 ? "bg-amber-500/10 text-amber-400"
                              : "bg-red-500/10 text-red-400"
                            }`}>{m.score}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-slate-500 font-medium">
                                {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                              {m.note && <p className="text-xs text-slate-300 mt-1 break-words">"{m.note}"</p>}
                              {m.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {m.tags.map((tag: string) => (
                                    <span key={tag} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CBT Journal Logs */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-455 uppercase tracking-wider">CBT Journal Entries</h5>
                    {sharedReport.journals?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No journal entries in this period.</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {sharedReport.journals?.map((j: any) => (
                          <div key={j.id} className="bg-slate-850 rounded-xl p-3 border border-slate-800/40 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">{j.prompt || "CBT Entry"}</span>
                              <span className="text-[9px] text-slate-500">
                                {new Date(j.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            {j.situation && (
                              <div>
                                <p className="text-[10px] text-slate-450 font-semibold uppercase">Situation</p>
                                <p className="text-xs text-slate-300">{j.situation}</p>
                              </div>
                            )}
                            {j.thought && (
                              <div>
                                <p className="text-[10px] text-slate-455 font-semibold uppercase">Automatic Thought</p>
                                <p className="text-xs text-slate-300">{j.thought}</p>
                              </div>
                            )}
                            {j.feeling && (
                              <div>
                                <p className="text-[10px] text-slate-455 font-semibold uppercase">Feeling</p>
                                <p className="text-xs text-slate-300">{j.feeling}</p>
                              </div>
                            )}
                            {j.reframe && (
                              <div className="bg-teal-950/20 border-l-2 border-teal-500 pl-2 py-1">
                                <p className="text-[10px] text-teal-400 font-bold uppercase">Rational Reframe</p>
                                <p className="text-xs text-slate-200">{j.reframe}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Chat Session Summaries */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">AI Chat Summaries</h5>
                    {sharedReport.chats?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No chat sessions in this period.</p>
                    ) : (
                      <div className="space-y-2">
                        {sharedReport.chats?.map((c: any, index: number) => (
                          <div key={index} className="bg-slate-850 rounded-xl p-3 border border-slate-800/40 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                c.riskLevel === "high" ? "bg-red-500/10 text-red-400"
                                : c.riskLevel === "medium" ? "bg-amber-500/10 text-amber-400"
                                : "bg-green-500/10 text-green-400"
                              }`}>{c.riskLevel || "Low"} Risk</span>
                              <span className="text-[9px] text-slate-500">
                                {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-350 break-words">{c.summary}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Report Modal (User) */}
      <AnimatePresence>
        {reportShareModalOpen && userRole === "user" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setReportShareModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-teal-400" />
                  <span className="font-bold text-white text-sm">Share Wellness Report</span>
                </div>
                <button onClick={() => setReportShareModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose a period to compile your mood history, journal reframes, and AI chat topics.
                  Your therapist will be able to review this report in-session only.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase">Report Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(currentTier === "free" ? (['day', 'fortnight', 'month'] as const) : (['day', 'week', 'month'] as const)).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSharePeriod(p)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase transition border ${
                          sharePeriod === p
                            ? "bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-600/20"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {p === 'fortnight' ? '15 Days' : p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-450 uppercase">Optional Note</label>
                  <textarea
                    value={shareNotes}
                    onChange={(e) => setShareNotes(e.target.value)}
                    placeholder="Mention anything specific you'd like your therapist to look at..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setReportShareModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  disabled={isSharingReport}
                  onClick={async () => {
                    if (!booking?.therapistId) {
                      toast.error("Therapist information not loaded yet.");
                      return;
                    }
                    setIsSharingReport(true);
                    try {
                      const res = await API.user.shareReport({
                        therapistId: booking.therapistId,
                        period: sharePeriod,
                        notes: shareNotes.trim() || undefined
                      });
                      toast.success("Wellness report shared with your therapist!");
                      
                      // Notify via LiveKit data channel
                      const payload = {
                        type: "REPORT_SHARED",
                        sharedReportId: res.sharedReportId
                      };
                      sendReportShare(new TextEncoder().encode(JSON.stringify(payload)), { reliable: true });
                      setReportShareModalOpen(false);
                      setShareNotes('');
                    } catch (e: any) {
                      toast.error(e.message || "Failed to share report.");
                    } finally {
                      setIsSharingReport(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {isSharingReport ? "Sharing..." : "Share Now"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Brief modal (therapist) */}
      <AnimatePresence>
        {showBrief && aiBrief && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowBrief(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="size-4 text-teal-400" />
                  <span className="font-bold text-white text-sm">Pre-Session AI Brief</span>
                </div>
                <button onClick={() => setShowBrief(false)} className="text-slate-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Risk:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                    aiBrief.riskLevel === "high" ? "bg-red-900 text-red-300"
                    : aiBrief.riskLevel === "medium" ? "bg-amber-900 text-amber-300"
                    : "bg-green-900 text-green-300"
                  }`}>{aiBrief.riskLevel}</span>
                  {aiBrief.avgMood && <span className="text-xs text-slate-400">Avg mood: {aiBrief.avgMood}/10</span>}
                </div>
                {aiBrief.groqSummary && (
                  <div className="bg-teal-900/40 border border-teal-700/50 rounded-xl p-4">
                    <p className="text-xs font-bold text-teal-400 mb-2">AI SUMMARY</p>
                    <p className="text-sm text-slate-200 whitespace-pre-line">{aiBrief.groqSummary}</p>
                  </div>
                )}
                {aiBrief.moodChart?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">7-DAY MOOD</p>
                    <div className="flex items-end gap-1 h-12">
                      {aiBrief.moodChart.map((m: any, i: number) => (
                        <div key={i} className="flex-1">
                          <div className="w-full rounded-sm bg-teal-500"
                            style={{ height: `${(m.score / 10) * 44}px`, minHeight: 3 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-session rating */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 mb-4 md:mb-0"
            >
              <h3 className="font-display text-xl font-bold text-center text-slate-900">How was your session?</h3>
              <StarRating value={rating} onChange={setRating} />
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience (optional)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none text-black"
                rows={3}
              />
              <Button
                onClick={() => rateMutation.mutate()}
                disabled={rating === 0 || rateMutation.isPending}
                className="w-full rounded-xl text-black"
              >
                {rateMutation.isPending ? "Submitting…" : "Submit & Leave"}
              </Button>
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="w-full text-sm text-black hover:text-slate-900 font-medium"
              >
                Skip
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session ended overlay */}
      {isAtLimit && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white gap-4">
          <Clock className="size-12 text-slate-400" />
          <p className="font-display text-2xl font-bold">Session time is up</p>
          <Button onClick={handleLeave} className="rounded-xl mt-2">
            Leave & Rate
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Outer component — fetches token then mounts LiveKitRoom ─── */
function VideoSession() {
  const { bookingId } = useParams({ from: "/session/$bookingId" });
  const navigate = useNavigate();

  // Query to resolve the current user's profile and role correctly
  const { data: me } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => API.auth.me(),
  });
  const userRole = me?.role ?? "user";

  const [showBrief, setShowBrief] = useState(false);

  // Explicitly prompt the browser for camera/microphone permissions on mount.
  // This ensures that the therapist is also prompted for permissions by the browser.
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream) => {
          // Immediately stop all tracks to release the device for LiveKit to use
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch((err) => {
          console.warn("Pre-session permission check/request failed:", err);
          toast.error("Please allow microphone and camera access to participate in the meeting.");
        });
    }
  }, []);

  const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => API.booking.get(bookingId),
  });

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["booking", bookingId, "video-token"],
    queryFn: () => API.booking.getVideoToken(bookingId),
    enabled: !!booking,
    retry: 2,
  });

  const { data: aiBrief } = useQuery({
    queryKey: ["ai-brief", bookingId],
    queryFn: () => API.booking.getAiBrief(bookingId),
    enabled: userRole === "therapist" && !!booking,
  });

  const isLoading = bookingLoading || tokenLoading;
  const error = bookingError || tokenError;

  // Optimized LiveKit RoomOptions for high quality and bandwidth management
  const roomOptions = {
    adaptiveStream: true,
    dynacast: true,
    videoPublishDefaults: {
      simulcast: true,
      videoCodec: 'vp8' as const,
      videoEncoding: {
        maxBitrate: 2_500_000, // HD quality up to 2.5 Mbps
        maxFramerate: 30,
      },
    },
    audioPublishDefaults: {
      audioPreset: {
        maxBitrate: 96_000, // High quality audio
      },
    },
    screenSharePublishDefaults: {
      videoCodec: 'vp8' as const,
      videoEncoding: {
        maxBitrate: 3_000_000,
        maxFramerate: 15,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="size-16 rounded-full bg-teal-600/20 animate-pulse mx-auto flex items-center justify-center">
            <Clock className="size-8 text-teal-400" />
          </div>
          <p className="text-white font-display text-lg">Setting up your session…</p>
        </div>
      </div>
    );
  }

  if (error || !tokenData?.token) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="size-12 text-red-400 mx-auto" />
          <p className="text-white font-display text-lg">Cannot join session</p>
          <p className="text-slate-400 text-sm">
            {(error as Error)?.message ?? "Session not available yet — join within 15 minutes of your slot."}
          </p>
          <Button onClick={() => navigate({ to: "/bookings" })} variant="outline" className="rounded-xl text-white border-slate-600">
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={tokenData.token}
      serverUrl={tokenData.url}
      connect={true}
      video={true}
      audio={true}
      options={roomOptions}
      style={{ height: "100vh" }}
      data-lk-theme="default"
    >
      <RoomUI
        bookingId={bookingId}
        booking={booking}
        userRole={userRole}
        aiBrief={aiBrief}
        showBrief={showBrief}
        setShowBrief={setShowBrief}
      />
    </LiveKitRoom>
  );
}
