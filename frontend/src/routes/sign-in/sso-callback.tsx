import { createFileRoute } from "@tanstack/react-router";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

export const Route = createFileRoute("/sign-in/sso-callback")({
  component: SSOCallbackPage,
});

function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-canvas-gradient flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
        <h1 className="font-display text-xl font-semibold text-primary-deep">
          Completing authentication...
        </h1>
        <p className="text-sm text-muted-foreground">
          Please wait while we sync your session.
        </p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
