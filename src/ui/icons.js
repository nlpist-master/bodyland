// Inline SVG icons (no image files to download).
const svg = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  pause: svg('<path d="M9 5v14M15 5v14"/>'),
  jump: svg('<path d="M12 19V6M6 11l6-6 6 6"/>'),
  run: svg('<path d="M5 6l6 6-6 6M13 6l6 6-6 6"/>'),
  act: svg('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.9-2.6L4 15.5a1.6 1.6 0 0 1 2.6-1.8L8 15"/>'),
};
