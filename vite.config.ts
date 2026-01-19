/** @format */

import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
        }),
        react(),
        tailwindcss(),
        // Bundle analyzer - only runs when ANALYZE env var is set
        visualizer({
            filename: "./dist/stats.html",
            open: true,
            gzipSize: true,
            brotliSize: true,
        }),
    ],
    // ... existing code ...
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Only process node_modules packages to avoid circular dependencies
                    if (!id.includes("node_modules")) {
                        return null;
                    }
                    
                    // FontAwesome icon packages - separate chunks, loaded on-demand
                    if (id.includes("@fortawesome/free-solid-svg-icons")) {
                        return "fa-icons-solid";
                    }
                    if (id.includes("@fortawesome/free-regular-svg-icons")) {
                        return "fa-icons-regular";
                    }
                    // FontAwesome runtime (small; icon sets are dynamic-imported in fontawesome-icon-catalog)
                    if (
                        id.includes("@fortawesome/react-fontawesome") ||
                        id.includes("@fortawesome/fontawesome-svg-core")
                    ) {
                        return "vendor-fa";
                    }
                    // Core React - be specific to avoid matching other packages
                    if (
                        id.includes("node_modules/react/") ||
                        id.includes("node_modules/react-dom/")
                    ) {
                        return "vendor-react";
                    }
                    // InstantDB (typically large)
                    if (id.includes("@instantdb/react") || id.includes("@instantdb/core")) {
                        return "vendor-instant";
                    }
                    // Router
                    if (id.includes("@tanstack/react-router")) {
                        return "vendor-router";
                    }
                    // UI libraries
                    if (
                        id.includes("@radix-ui") ||
                        id.includes("node_modules/vaul/") ||
                        id.includes("node_modules/class-variance-authority/") ||
                        id.includes("node_modules/clsx/") ||
                        id.includes("node_modules/tailwind-merge/")
                    ) {
                        return "vendor-ui";
                    }
                    // Icons (often large due to tree-shaking limits)
                    if (id.includes("lucide-react")) {
                        return "vendor-icons";
                    }
                    // Virtual list — only used by FontAwesomeIconPicker (lazy-loaded)
                    if (id.includes("@tanstack/react-virtual")) {
                        return "vendor-virtual";
                    }
                    // React-PDF - only used in groups-and-teams route (lazy-loaded)
                    if (id.includes("@react-pdf/")) {
                        return "vendor-react-pdf";
                    }
                    // Default: let Vite handle it
                    return null;
                },
            },
        },
    },
});