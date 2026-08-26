import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react-router-dom"],
  },
  server: {
    fs: {
      allow: [".."],
    },
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
})
