import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Static pre-render: public pages served by Caddy, zero Node runtime in prod.
  build: { outDir: "site" },
});
