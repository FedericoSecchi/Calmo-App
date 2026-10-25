import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Only preload modules the main entry statically imports. Dynamic chunks
    // (supabase, framer-motion, recharts) load on demand without eating the
    // landing page's initial fetch budget.
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_url, deps, { hostType }) => {
        if (hostType !== "html") return deps;
        return deps.filter((d) => /\/(vendor-react|index-)/.test(d));
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
      ],
      manifest: {
        name: "Calmo",
        short_name: "Calmo",
        description: "Healthy habits for computer work, without the pain.",
        theme_color: "#F3EBDD",
        background_color: "#F3EBDD",
        display: "standalone",
        orientation: "portrait-primary",
        // Installed app lands straight into /app. ProtectedRoute still bounces
        // signed-out visitors to /auth, so the UX for first-time launches
        // remains sensible.
        start_url: "/app",
        scope: "/",
        // Reopen an existing window instead of spawning new ones when the OS
        // launches the app from a link (Chromium ≥102).
        launch_handler: { client_mode: "navigate-existing" },
        // Hint to the OS that calmo.fit links should prefer the installed
        // PWA. Chromium 92+ honors this; Safari/iOS and Firefox/Android
        // ignore it today (see docs/PROGRESS.md "Pending" for the matrix).
        handle_links: "preferred",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        categories: ["health", "lifestyle", "productivity"],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "tests/e2e/**"],
  },
});
