import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/sign-in/sso-callback")({
  component: SSOCallbackPage,
});

function SSOCallbackPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/sign-in" });
      }
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-canvas-gradient flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="size-12 rounded-full border-4 border-teal-600 border-t-transparent animate-spin mx-auto" />
        <h1 className="font-display text-xl font-semibold text-teal-900">
          Completing authentication...
        </h1>
        <p className="text-sm text-muted-foreground">
          Please wait while we sync your session.
        </p>
      </div>
    </div>
  );
}
