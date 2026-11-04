/// <reference types="vite/client" />

// La bascule FEATURE_BACK (vite.config.ts) : substituée au build, comme
// __SITE_URL__ — jamais une valeur lue dans l'environnement du navigateur.
declare const __FEATURE_BACK__: boolean | undefined;
