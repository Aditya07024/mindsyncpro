import { createFileRoute, useParams, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Calendar, Clock, AlertCircle, Star, Wallet, Plus } from "lucide-react";
import API from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import RazorpayCheckout from "@/components/RazorpayCheckout";

export const Route = createFileRoute("/booking/$therapistId")({
  component: BookingFlow,
});

const formatTime = (time24: string) => {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

function BookingFlow() {
  const { therapistId } = useParams({ from: "/booking/$therapistId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookingStep, setBookingStep] = useState<"select" | "confirm" | "payment" | "success">(
    "select",
  );
  const [bookingId, setBookingId] = useState<string>("");
  const [bookingAmount, setBookingAmount] = useState<number>(0);

  const { data: walletData } = useQuery({
    queryKey: ["walletBalance"],
    queryFn: () => API.payment.getWalletBalance(),
  });
  const walletBalance = walletData?.walletBalance ?? 0;

  const payWithWalletMutation = useMutation({
    mutationFn: (id: string) => API.payment.payBookingWallet(id),
    onSuccess: async () => {
      toast.success("Booking confirmed using wallet!");
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      await queryClient.invalidateQueries({ queryKey: ["userStats"] });
      await queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      setBookingStep("success");
    },
    onError: (err: any) => {
      toast.error(err.message || "Wallet payment failed");
    }
  });

  // Fetch therapist details
  const { data: therapist, isLoading: therapistLoading } = useQuery({
    queryKey: ["therapist", therapistId],
    queryFn: () => API.therapist.get(therapistId),
  });

  // Fetch available slots
  const { data: availability, isLoading: slotsLoading } = useQuery({
    queryKey: ["therapist-availability", therapistId, selectedDate],
    queryFn: () => API.therapist.availability(therapistId, { date: selectedDate }),
    enabled: !!selectedDate,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (slotDateTime: string) =>
      API.booking.create({
        therapistId,
        slot: slotDateTime,
      }),
    onSuccess: (data) => {
      setBookingId(data.booking.id);
      setBookingAmount(data.booking.amount);
      if (data.booking.amount === 0 || data.booking.status === "confirmed") {
        setBookingStep("success");
      } else {
        setBookingStep("confirm");
      }
    },
  });

  // Demo Verify Mutation
  const demoVerifyMutation = useMutation({
    mutationFn: (id: string) => API.payment.demoVerify({ bookingId: id }),
    onSuccess: async () => {
      toast.success("Payment verified! Redirecting to dashboard...");
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      await queryClient.invalidateQueries({ queryKey: ["userStats"] });
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1500);
    },
  });

  // Handle slot selection
  const handleSelectSlot = (slot: string) => {
    if (!selectedDate) return;
    const [hours, minutes] = slot.split(":");
    const dateTime = new Date(selectedDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    setSelectedSlot(slot);
  };

  // Handle booking confirmation
  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedSlot) {
      alert("Please select a date and slot");
      return;
    }
    const [hours, minutes] = selectedSlot.split(":");
    const dateTime = new Date(selectedDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    createBookingMutation.mutate(dateTime.toISOString());
  };

  if (therapistLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin">Loading...</div>
        </div>
      </AppShell>
    );
  }

  if (!therapist) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-600">Therapist not found</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate({ to: "/therapists" })}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Therapists
            </button>

            {/* Therapist Info Card */}
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {(therapist.name || 'T').charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900">{therapist.name || 'Therapist'}</h1>
                  <p className="text-slate-600">{therapist.specializations?.[0]}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-lg font-bold text-slate-900">
                      ₹{therapist.sessionFee}/session
                    </span>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-amber-700 text-sm font-bold">
                      <Star className="size-4 fill-amber-500 text-amber-500" />
                      {therapist.rating?.toFixed(1) || '5.0'}
                    </div>
                    <span className="text-sm text-slate-500">
                      {therapist.sessionCount} sessions
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              {therapist.reviews?.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
                    Recent Reviews
                  </h3>
                  <div className="space-y-4">
                    {therapist.reviews.map((rev: any) => (
                      <div key={rev.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-slate-900">{rev.userName}</span>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`size-3 ${i < rev.rating ? "fill-amber-500 text-amber-500" : "text-slate-300"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed italic">"{rev.review}"</p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {new Date(rev.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {["select", "confirm", "payment", "success"].map((step, idx) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    step === bookingStep
                      ? "bg-blue-600 text-white"
                      : ["select", "confirm", "payment"].includes(step) &&
                          ["select", "confirm", "payment"].indexOf(step) <
                            ["select", "confirm", "payment"].indexOf(bookingStep)
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className={`flex-1 h-1 mx-2 ${idx < 3 ? "bg-slate-200" : ""}`} />
              </div>
            ))}
          </div>

          {/* Content */}
          {bookingStep === "select" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Date & Time
                </h2>

                {/* Date Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Choose a date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot("");
                    }}
                    min={(() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    })()}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Available time slots
                    </label>

                    {slotsLoading ? (
                      <div className="text-slate-500">Loading available slots...</div>
                    ) : (() => {
                      const localToday = (() => {
                        const d = new Date();
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                      })();
                      const filteredSlots = (availability?.openSlots ?? []).filter((slot: string) => {
                        if (selectedDate !== localToday) return true;
                        const [hours, minutes] = slot.split(":");
                        const now = new Date();
                        const slotTime = new Date();
                        slotTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                        return slotTime > now;
                      });

                      return filteredSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {filteredSlots.map((slot: string) => (
                            <button
                              key={slot}
                              onClick={() => handleSelectSlot(slot)}
                              className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                                selectedSlot === slot
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {formatTime(slot)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                          <AlertCircle className="w-5 h-5" />
                          <span>No slots available for this date. Please select another date.</span>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </Card>

              <Button
                onClick={handleConfirmBooking}
                disabled={!selectedDate || !selectedSlot || createBookingMutation.isPending}
                className="w-full h-12 rounded-lg"
              >
                {createBookingMutation.isPending
                  ? "Creating booking..."
                  : "Continue to Confirmation"}
              </Button>
            </motion.div>
          )}

          {bookingStep === "confirm" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6 border-2 border-green-200 bg-green-50">
                <h2 className="text-lg font-bold text-green-900 mb-4">✓ Booking Created</h2>
                <div className="space-y-3 text-slate-700">
                  <p>
                    <strong>Date & Time:</strong> {selectedDate} at {formatTime(selectedSlot)}
                  </p>
                  <p>
                    <strong>Session Fee:</strong> {bookingAmount > 0 ? `₹${bookingAmount}` : "FREE"}
                  </p>
                  <p className="text-sm text-slate-600">
                    Complete payment to confirm your booking. You'll receive confirmation SMS with
                    video room link.
                  </p>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingStep("select");
                    setSelectedDate("");
                    setSelectedSlot("");
                  }}
                  className="flex-1 h-12 rounded-lg"
                >
                  Change Slot
                </Button>
                <Button
                  onClick={() => setBookingStep("payment")}
                  className="flex-1 h-12 rounded-lg"
                >
                  Proceed to Payment
                </Button>
              </div>
            </motion.div>
          )}

          {bookingStep === "payment" && bookingId && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Choose Payment Option</h2>
                <div className="space-y-4">
                  {/* Wallet Option */}
                  <div className="p-4 rounded-xl border border-border bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Wallet className="size-4 text-accent" /> Pay with Wallet
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Current Balance: ₹{walletBalance.toFixed(2)}
                      </p>
                    </div>
                    {walletBalance >= bookingAmount ? (
                      <Button
                        onClick={() => payWithWalletMutation.mutate(bookingId)}
                        disabled={payWithWalletMutation.isPending}
                        className="rounded-xl h-10 px-4 bg-accent hover:bg-accent/90"
                      >
                        {payWithWalletMutation.isPending ? "Paying..." : `Pay ₹${bookingAmount}`}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-600 font-semibold">Insufficient Balance</span>
                        <Link
                          to="/wallet"
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl transition text-center"
                        >
                          Add Funds
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="relative text-center my-4">
                    <span className="bg-white px-3 text-xs text-muted-foreground uppercase font-bold tracking-wider relative z-10">Or Pay Direct</span>
                    <hr className="absolute top-2 w-full border-border/80" />
                  </div>

                  {/* Razorpay Option */}
                  <RazorpayCheckout
                    bookingId={bookingId}
                    amount={bookingAmount}
                    userName={therapist.name}
                    onSuccess={async () => {
                      toast.success("Payment verified! Redirecting to dashboard...");
                      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
                      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
                      await queryClient.invalidateQueries({ queryKey: ["userStats"] });
                      setTimeout(() => {
                        navigate({ to: "/dashboard" });
                      }, 1500);
                    }}
                  />
                </div>
              </Card>

              {/* <div className="pt-4 border-t border-slate-200">
                <Button 
                  onClick={() => demoVerifyMutation.mutate(bookingId)} 
                  disabled={demoVerifyMutation.isPending}
                  variant="outline" 
                  className="w-full text-slate-500 hover:text-slate-900 border-slate-300 border-dashed"
                >
                  {demoVerifyMutation.isPending ? 'Processing...' : 'Demo Mode: Bypass Payment'}
                </Button>
              </div> */}
            </motion.div>
          )}

          {bookingStep === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <Card className="p-8 border-2 border-green-200 bg-green-50">
                <div className="text-5xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  {bookingAmount === 0 ? "Appointment Confirmed!" : "Payment Successful!"}
                </h2>
                <p className="text-slate-600 mb-4">
                  {bookingAmount === 0
                    ? `Your therapy session with ${therapist.name} is confirmed under your organization benefits.`
                    : `Your therapy session with ${therapist.name} is confirmed.`}
                </p>
                <p className="text-sm text-slate-500">
                  Check your notifications for session details and video room link.
                </p>
              </Card>

              <Button
                onClick={() => navigate({ to: "/dashboard" })}
                className="w-full h-12 rounded-lg"
              >
                Go to Dashboard
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
