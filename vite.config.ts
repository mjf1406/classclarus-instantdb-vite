/** @format */

import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
        }),
        react(),
        VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            workbox: {
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
            },
            manifest: {
                name: "ClassClarus",
                short_name: "ClassClarus",
                description: "Gamify your classroom to motivate your students.",
                start_url: "/",
                scope: "/",
                display: "standalone",
                orientation: "portrait-primary",
                background_color: "#ffffff",
                theme_color: "#000000",
                icons: [
                    {
                        src: "/brand/icon-removebg.webp",
                        sizes: "192x192",
                        type: "image/webp",
                        purpose: "any maskable",
                    },
                    {
                        src: "/brand/icon-removebg.webp",
                        sizes: "512x512",
                        type: "image/webp",
                        purpose: "any maskable",
                    },
                ],
            },
        }),
        tailwindcss(),
        visualizer({
            filename: "./dist/stats.html",
            open: true,
            gzipSize: true,
            brotliSize: true,
        }),
    ],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },

    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (!id.includes("node_modules")) return null;

                    if (id.includes("@fortawesome/free-solid-svg-icons")) {
                        return "fa-icons-solid";
                    }
                    if (id.includes("@fortawesome/free-regular-svg-icons")) {
                        return "fa-icons-regular";
                    }
                    if (
                        id.includes("@fortawesome/react-fontawesome") ||
                        id.includes("@fortawesome/fontawesome-svg-core")
                    ) {
                        return "vendor-fa";
                    }
                    if (
                        id.includes("node_modules/react/") ||
                        id.includes("node_modules/react-dom/")
                    ) {
                        return "vendor-react";
                    }
                    if (
                        id.includes("@instantdb/react") ||
                        id.includes("@instantdb/core")
                    ) {
                        return "vendor-instant";
                    }
                    if (id.includes("@tanstack/react-router")) {
                        return "vendor-router";
                    }
                    if (
                        id.includes("@radix-ui") ||
                        id.includes("node_modules/vaul/") ||
                        id.includes("node_modules/class-variance-authority/") ||
                        id.includes("node_modules/clsx/") ||
                        id.includes("node_modules/tailwind-merge/")
                    ) {
                        return "vendor-ui";
                    }
                    if (id.includes("lucide-react")) {
                        return "vendor-icons";
                    }
                    if (id.includes("@tanstack/react-virtual")) {
                        return "vendor-virtual";
                    }
                    if (id.includes("@react-pdf/")) {
                        return "vendor-react-pdf";
                    }

                    return null;
                },
            },
        },
    },
});