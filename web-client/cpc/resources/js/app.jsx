import "../css/app.css";

import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch((error) => {
            console.error("CPC service worker gagal didaftarkan:", error);
        });
    });
}

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

router.on("invalid", (event) => {
    const status = event.detail.response?.status;
    if (status === 401 || status === 419) {
        event.preventDefault();
        window.location.href = "/login";
    }
});

createInertiaApp({
    title: (title) => `SiteFlow`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: "#4B5563",
    },
});
