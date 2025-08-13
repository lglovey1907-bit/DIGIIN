import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "client", // Set client as the root directory
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"), // Add this line
    },
  },
  build: {
    outDir: "../dist/public", // Relative to root (client)
    emptyOutDir: true,
  },
  publicDir: "../public", // Relative to root (client)
  server: {
    proxy: {
      "/api": "http://localhost:5001",
    },
  },
});
