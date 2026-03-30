import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4501,
    proxy: {
      "/api": "http://localhost:4500",
      "/visual-baselines": "http://localhost:4500",
      "/visual-results": "http://localhost:4500",
    },
  },
  build: {
    outDir: "dist",
  },
});
