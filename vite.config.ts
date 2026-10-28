import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le chemin de base dépend de la CIBLE, pas du code.
//   • GitHub Pages sert sous /manahome-app/ → sans base, les bundles 404 et la page est blanche.
//   • Un domaine propre (manahome.org) sert à la RACINE → le base de Pages y 404 de la même façon.
// Les défauts ci-dessous sont ceux de Pages : la CI n'a rien à changer.
// Pour un domaine : BASE_PATH=/ OUT_DIR=dist npm run build
//   (OUT_DIR sort dans dist/, qui est gitignoré, pour ne pas écraser le site/ suivi par git)
const base = process.env.BASE_PATH ?? "/manahome-app/";
const outDir = process.env.OUT_DIR ?? "site";

export default defineConfig({
  plugins: [react()],
  base,
  // Static pre-render: public pages served by Caddy, zero Node runtime in prod.
  build: { outDir },
});
