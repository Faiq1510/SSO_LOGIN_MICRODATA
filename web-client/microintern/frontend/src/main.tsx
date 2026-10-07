import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((error) =>
        console.error("Microintern service worker gagal didaftarkan:", error),
      );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
