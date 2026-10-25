import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Pages sert sous /manahome-app/ : sans base, les bundles 404 → page blanche
  base: "/manahome-app/",
  // Static pre-render: public pages served by Caddy, zero Node runtime in prod.
  build: { outDir: "site" },
});
