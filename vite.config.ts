/** @format */

import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Vendor chunks for better caching and parallel loading
                    if (id.includes("node_modules")) {
                        // React and React-DOM
                        if (
                            id.includes("react/") ||
                            id.includes("react-dom/") ||
                            id.includes("scheduler/")
                        ) {
                            return "vendor-react";
                        }

                        // TanStack Router
                        if (id.includes("@tanstack/react-router")) {
                            return "vendor-router";
                        }

                        // InstantDB packages
                        if (id.includes("@instantdb/")) {
                            return "vendor-instantdb";
                        }

                        // Icon libraries
                        if (id.includes("lucide-react")) {
                            return "vendor-icons";
                        }

                        // OAuth packages
                        if (id.includes("@react-oauth/")) {
                            return "vendor-oauth";
                        }

                        // UI component libraries
                        if (
                            id.includes("@radix-ui/") ||
                            id.includes("shadcn/") ||
                            id.includes("class-variance-authority") ||
                            id.includes("tailwind-merge")
                        ) {
                            return "vendor-ui";
                        }

                        // Utility libraries
                        if (
                            id.includes("date-fns") ||
                            id.includes("fuse.js") ||
                            id.includes("jwt-decode") ||
                            id.includes("clsx") ||
                            id.includes("usehooks-ts") ||
                            id.includes("vaul") ||
                            id.includes("input-otp")
                        ) {
                            return "vendor-utils";
                        }

                        // Other node_modules dependencies go into a default vendor chunk
                        // This prevents too many small chunks
                        return "vendor-misc";
                    }

                    // icons-data.ts should be in its own chunk (already dynamically imported)
                    if (id.includes("icons-data")) {
                        return "icons-data";
                    }
                },
            },
        },
    },
});
