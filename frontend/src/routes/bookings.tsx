import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Clock, ChevronRight, Star, AlertCircle, Video, Pill, X } from 'lucide-react';
import API from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Route = createFileRoute('/bookings')({ component: MyBookings });

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-800' },
    pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-800' },
    pending_payment: { label: 'Payment Pending', cls: 'bg-amber-100 text-amber-800' },
    completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-800' },
    cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-muted text-muted-foreground' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

function canJoin(slot: string, status: string) {
  if (status !== 'confirmed') return false;
  const slotTime = new Date(slot).getTime();
  const now = Date.now();
  // Meeting window opens 5 minutes before scheduled slot and stays open for 1 full hour
  const startTime = slotTime - 5 * 60 * 1000;
  const endTime = slotTime + 60 * 60 * 1000;
  return now >= startTime && now <= endTime;
}

function MyBookings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [viewPrescriptionBooking, setViewPrescriptionBooking] = useState<any | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => API.booking.list(),
  });



  const rateMutation = useMutation({
    mutationFn: ({ id, rating, feedback }: { id: string; rating: number; feedback: string }) =>
      API.booking.rate(id, { rating, feedback }),
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      setRatingBookingId(null);
      setRating(0);
      setFeedback('');
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bookings: any[] = data?.bookings ?? [];
  const upcoming = bookings.filter((b) => ['confirmed', 'pending', 'pending_payment'].includes(b.status) && new Date(b.slot) > new Date())
    .sort((a, b) => new Date(a.slot).getTime() - new Date(b.slot).getTime());
  const past = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled' || new Date(b.slot) < new Date())
    .sort((a, b) => new Date(b.slot).getTime() - new Date(a.slot).getTime());

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-primary-deep">My Sessions</h1>

        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4">
            <AlertCircle className="size-5 text-destructive" />
            <p className="text-sm text-destructive">Failed to load bookings. Are you logged in?</p>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h2>
            <div className="space-y-3">
              {upcoming.map((b) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-bold text-primary-deep">{b.therapistName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(b.slot).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(b.slot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {statusBadge(b.status)}
                  </div>
                  <div className="flex gap-2 mt-4">
                    {canJoin(b.slot, b.status) ? (
                      <Button size="sm" className="flex-1 gap-2 rounded-xl"
                        onClick={() => navigate({ to: `/session/${b.id}` })}>
                        <Video className="size-4" /> Join Session
                      </Button>
                    ) : (
                      <div className="flex-1 text-center text-xs text-muted-foreground py-2 bg-muted rounded-xl">
                        {['pending', 'pending_payment'].includes(b.status) ? 'Payment Pending' : 'Available 15 min before'}
                      </div>
                    )}

                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Sessions</h2>
            <div className="space-y-3">
              {past.map((b) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-card border border-border/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-semibold text-primary-deep">{b.therapistName}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {new Date(b.slot).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {statusBadge(b.status)}
                  </div>
                  <div className="flex gap-4 mt-3">
                    {b.status === 'completed' && (
                      <button onClick={() => setRatingBookingId(b.id)}
                        className="flex items-center gap-1 text-xs text-accent font-semibold">
                        <Star className="size-3" /> Rate session
                      </button>
                    )}
                    {b.prescription && b.prescription.medicines?.length > 0 && (
                      <button onClick={() => setViewPrescriptionBooking(b)}
                        className="flex items-center gap-1 text-xs text-teal-600 font-semibold hover:text-teal-700 transition">
                        <Pill className="size-3" /> View Prescription
                      </button>
                    )}
                    <Link to={`/booking/${b.therapistId}`} className="ml-auto text-xs text-primary font-semibold flex items-center gap-1">
                      Book again <ChevronRight className="size-3" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!isLoading && bookings.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <CalendarCheck className="size-12 text-muted-foreground/40 mx-auto" />
            <p className="font-display text-lg font-semibold text-primary-deep">No sessions yet</p>
            <p className="text-sm text-muted-foreground">Book your first therapy session</p>
            <Link to="/therapists">
              <Button className="rounded-xl mt-2">Find a Therapist</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingBookingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl space-y-5">
              <h3 className="font-display text-xl font-bold text-center">Rate your session</h3>
              <div className="flex justify-center gap-3">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="text-4xl transition-transform hover:scale-110">
                    {s <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience (optional)"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" rows={3} />
              <Button onClick={() => rateMutation.mutate({ id: ratingBookingId, rating, feedback })}
                disabled={rating === 0 || rateMutation.isPending} className="w-full rounded-xl">
                {rateMutation.isPending ? 'Submitting…' : 'Submit'}
              </Button>
              <button onClick={() => setRatingBookingId(null)} className="w-full text-sm text-muted-foreground">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* View Prescription Modal */}
      <AnimatePresence>
        {viewPrescriptionBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setViewPrescriptionBooking(null)}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-teal-600">
                  <Pill className="size-5" />
                  <h3 className="font-display text-lg font-bold">Prescription Details</h3>
                </div>
                <button onClick={() => setViewPrescriptionBooking(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Prescribed Medicines</h4>
                  <div className="space-y-2">
                    {viewPrescriptionBooking.prescription?.medicines?.map((med: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5 bg-muted/50 rounded-xl p-3 border border-border/40">
                        <div className="size-2 rounded-full bg-teal-500" />
                        <span className="text-sm font-semibold text-foreground">{med}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {viewPrescriptionBooking.prescription?.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Instructions</h4>
                    <div className="bg-muted/30 rounded-xl p-3 border border-border/40 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {viewPrescriptionBooking.prescription.notes}
                    </div>
                  </div>
                )}
              </div>
              
              <Button onClick={() => setViewPrescriptionBooking(null)} className="w-full rounded-xl">Close</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
