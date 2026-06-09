import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The application must run exclusively on http://localhost:3000, so the dev
// server port is pinned and strict (it will not fall back to another port).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    // Proxy API calls to the evaluation server so the browser makes a
    // same-origin request and avoids CORS. The proxy forwards server-side.
    proxy: {
      "/evaluation-service": {
        target: "http://4.224.186.213",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
});
