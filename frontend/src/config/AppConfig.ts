/**
 * CONFIGURATION : APP_CONFIG
 * Centralizes application-wide configuration constants, magic numbers, and environment variable fallbacks.
 */
export const APP_CONFIG = {
  // URL du serveur WebSocket pour la collaboration (Hocuspocus)
  WEBSOCKET_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',

  // Délais de debounce (en ms) pour optimiser les performances
  VALIDATION_DEBOUNCE_MS: 500, // Délai avant de valider la syntaxe Mermaid
  RENDER_DEBOUNCE_MS: 150, // Délai avant de re-calculer le rendu SVG
};
