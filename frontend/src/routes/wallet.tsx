import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Calendar, FileText, Users, ShieldCheck, Loader } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import API from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState<string>("");

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["walletBalance"],
    queryFn: () => API.payment.getWalletBalance(),
  });

  const addFundsMutation = useMutation({
    mutationFn: (amount: number) => API.payment.addWalletFunds(amount),
    onSuccess: (data) => {
      if (data.shortUrl) {
        toast.success("Redirecting to Razorpay payment page...");
        window.location.href = data.shortUrl;
      } else {
        toast.error("Failed to retrieve payment link.");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to initiate payment");
    },
  });

  const handleAddFunds = (amount: number) => {
    if (amount <= 0 || isNaN(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }
    addFundsMutation.mutate(amount);
  };

  const getPurposeLabel = (purpose: string) => {
    switch (purpose) {
      case "add_funds":
        return "Loaded Funds";
      case "unlock_report":
        return "Unlocked Wellness Report";
      case "book_therapist":
        return "Booked Therapist Session";
      default:
        return purpose;
    }
  };

  const getPurposeIcon = (purpose: string) => {
    switch (purpose) {
      case "add_funds":
        return <Plus className="size-4 text-emerald-600" />;
      case "unlock_report":
        return <FileText className="size-4 text-amber-600" />;
      case "book_therapist":
        return <Users className="size-4 text-blue-600" />;
      default:
        return <Wallet className="size-4 text-primary" />;
    }
  };

  const balance = walletData?.walletBalance ?? 0;
  const transactions = walletData?.transactions ?? [];

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-deep flex items-center gap-2">
            <Wallet className="size-8 text-accent" /> My Wallet
          </h1>
          <p className="text-muted-foreground mt-1">
            Add funds to pay for Wellness Reports or Therapist bookings seamlessly.
          </p>
        </div>

        {/* Balance Card & Quick Add */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 p-6 relative overflow-hidden bg-gradient-to-br from-primary-deep to-primary-soft text-white flex flex-col justify-between h-48 border-none shadow-lg">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
              <Wallet className="size-40" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-white/80 font-bold">Total Balance</span>
              {walletLoading ? (
                <div className="h-10 w-24 bg-white/20 animate-pulse rounded mt-2" />
              ) : (
                <h2 className="text-4xl font-extrabold font-display mt-2">₹{balance.toFixed(2)}</h2>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-full self-start">
              <ShieldCheck className="size-3.5" />
              Secure Balance
            </div>
          </Card>

          <Card className="md:col-span-2 p-6 flex flex-col justify-between border border-border shadow-sm bg-card rounded-3xl">
            <div>
              <h3 className="font-display font-bold text-lg text-primary-deep mb-4">Add Funds to Wallet</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    disabled={addFundsMutation.isPending}
                    onClick={() => handleAddFunds(amt)}
                    className="px-4 py-2 border border-border bg-secondary/30 hover:bg-secondary/70 hover:border-accent text-slate-800 text-sm font-semibold rounded-xl transition duration-200"
                  >
                    + ₹{amt}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                <Input
                  placeholder="Enter custom amount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-6 rounded-xl text-slate-800 font-medium"
                  disabled={addFundsMutation.isPending}
                />
              </div>
              <Button
                disabled={addFundsMutation.isPending || !customAmount}
                onClick={() => {
                  handleAddFunds(parseFloat(customAmount));
                  setCustomAmount("");
                }}
                className="rounded-xl px-5 flex items-center gap-1.5"
              >
                {addFundsMutation.isPending ? (
                  <>
                    <Loader className="size-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Add Funds
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Transactions list */}
        <Card className="p-6 border border-border shadow-sm rounded-3xl">
          <h3 className="font-display font-bold text-lg text-primary-deep mb-4 flex items-center gap-2">
            Transaction History
          </h3>

          {walletLoading ? (
            <div className="space-y-3 py-6">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-14 bg-secondary/20 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed border-border">
              <Wallet className="size-8 mx-auto mb-2 text-muted-foreground/60" />
              <p className="text-sm font-medium">No transactions found</p>
              <p className="text-xs">Your wallet history will appear here once you load or spend funds.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const isCredit = tx.type === "credit";
                const isSuccess = tx.status === "success";

                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20 border border-border/50 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center ${
                          isCredit ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="size-5" />
                        ) : (
                          <ArrowUpRight className="size-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          {getPurposeLabel(tx.purpose)}
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isSuccess
                                ? "bg-emerald-100 text-emerald-800"
                                : tx.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </h4>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="size-3" />
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-extrabold font-display ${
                        isCredit ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {isCredit ? "+" : "-"} ₹{tx.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
