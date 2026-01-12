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
                manualChunks: {
                    // Core React
                    "vendor-react": ["react", "react-dom"],
                    // InstantDB (typically large)
                    "vendor-instant": ["@instantdb/react", "@instantdb/core"],
                    // Router
                    "vendor-router": ["@tanstack/react-router"],
                    // UI libraries
                    "vendor-ui": [
                        "@radix-ui/react-avatar",
                        "@radix-ui/react-dialog",
                        "vaul",
                        "class-variance-authority",
                        "clsx",
                        "tailwind-merge",
                    ],
                    // Icons (often large due to tree-shaking limits)
                    "vendor-icons": ["lucide-react"],
                },
            },
        },
    },
});
