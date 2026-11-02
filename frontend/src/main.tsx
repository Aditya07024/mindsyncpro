import "./styles.css";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

// Auto-recover from chunk / dynamic import cache mismatches across deployments
function handleChunkLoadError() {
  const key = "mmtf_chunk_reload_ts";
  const now = Date.now();
  const lastReload = parseInt(sessionStorage.getItem(key) || "0", 10);
  // Auto-reload once within 10 seconds to fetch newly deployed assets
  if (now - lastReload > 10000) {
    sessionStorage.setItem(key, String(now));
    window.location.reload();
  }
}

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  handleChunkLoadError();
});

window.addEventListener("error", (event) => {
  const msg = (event?.message || event?.error?.message || "").toLowerCase();
  if (
    msg.includes("importing a module script failed") ||
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("error resolving module specifier")
  ) {
    handleChunkLoadError();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const msg = (event?.reason?.message || String(event?.reason || "")).toLowerCase();
  if (
    msg.includes("importing a module script failed") ||
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("error resolving module specifier")
  ) {
    handleChunkLoadError();
  }
});

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
);

