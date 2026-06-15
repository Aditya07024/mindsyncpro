import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";
import logoUrl from "@/assets/logo.png";
import API from "@/lib/api";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

const PORTAL_NAMES: Record<string, string> = {
  user: "I am a user/patient",
  therapist: "I am a Therapist",
  org_admin: "Organisation Admin",
  super_admin: "Super Admin",
};

function SignInPage() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [portalRole, setPortalRole] = useState<string | null>(null);

  useEffect(() => {
    API.health()
      .then(() => setIsHealthy(true))
      .catch(() => setIsHealthy(false));

    const role = localStorage.getItem("mymindtherapyfriend_intent_role");
    setPortalRole(role);
  }, []);

  if (isHealthy === null) {
    return (
      <div className="min-h-screen bg-canvas-gradient flex items-center justify-center px-4">
        <div className="size-12 rounded-full bg-warm-gradient animate-pulse" />
      </div>
    );
  }

  if (isHealthy === false) {
    return (
      <div className="min-h-screen bg-canvas-gradient flex flex-col items-center justify-center px-4 text-center">
        <img
          src={logoUrl}
          alt="MyMindTherapyFriend Logo"
          className="size-20 mb-6 object-contain opacity-50 grayscale"
        />
        <h1 className="font-display text-3xl font-bold text-primary-deep mb-2">
          Service Unavailable
        </h1>
        <p className="text-muted-foreground max-w-sm">
          MyMindTherapyFriend is currently undergoing maintenance. Please try again in a few minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <img src={logoUrl} alt="MyMindTherapyFriend Logo" className="mx-auto size-16 object-contain" />
          <h1 className="font-display text-3xl font-bold text-primary-deep">MyMindTherapyFriend</h1>
          <p className="text-muted-foreground text-sm">Apna Dil Kholo</p>
        </div>

        {/* Portal Heading */}
        {portalRole && PORTAL_NAMES[portalRole] && (
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-primary-deep">
              {PORTAL_NAMES[portalRole]}
            </h2>
          </div>
        )}

        {/* Clerk SignIn — handles Google, Apple, email */}
        <SignIn
          routing="path"
          path="/sign-in"
          fallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/onboarding"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "rounded-3xl shadow-xl border border-border bg-card w-full",
              headerTitle: "font-display font-bold text-primary-deep",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton:
                "rounded-xl border border-border bg-background hover:bg-muted transition font-medium",
              formButtonPrimary:
                "rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
              footerActionLink: "text-primary font-semibold",
              formFieldInput:
                "rounded-xl border-input bg-background focus:ring-2 focus:ring-primary",
            },
            variables: {
              colorPrimary: "#2C6B6A",
              colorBackground: "#FDFAF7",
              borderRadius: "0.75rem",
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            },
          }}
        />
      </div>
    </div>
  );
}
