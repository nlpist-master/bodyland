// Inline SVG icons (no image files to download).
const svg = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  pause: svg('<path d="M9 5v14M15 5v14"/>'),
  jump: svg('<path d="M12 19V6M6 11l6-6 6 6"/>'),
  run: svg('<path d="M5 6l6 6-6 6M13 6l6 6-6 6"/>'),
  bag: svg('<path d="M6 9h12l-1 11H7L6 9z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>'),
  quests: svg('<path d="M7 4h10v16H7z"/><path d="M10 9h4M10 13h4M10 17h2"/>'),
  map: svg('<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>'),
  act: svg('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.9-2.6L4 15.5a1.6 1.6 0 0 1 2.6-1.8L8 15"/>'),
};
