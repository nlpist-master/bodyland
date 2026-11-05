// Inline SVG icons (no image files to download).
const svg = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  pause: svg('<path d="M9 5v14M15 5v14"/>'),
  jump: svg('<path d="M12 19V6M6 11l6-6 6 6"/>'),
  run: svg('<path d="M5 6l6 6-6 6M13 6l6 6-6 6"/>'),
  bag: svg('<path d="M6 9h12l-1 11H7L6 9z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>'),
  quests: svg('<path d="M7 4h10v16H7z"/><path d="M10 9h4M10 13h4M10 17h2"/>'),
  map: svg('<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"/><path d="M9 4v14M15 6v14"/>'),
  play: svg('<path d="M7 5l12 7-12 7z"/>'),
  restart: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  medal: svg('<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>'),
  help: svg('<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.2a3 3 0 1 1 4.2 2.7c-.9.5-1.4 1-1.4 2"/><path d="M12 17.2v.01"/>'),
  person: svg('<circle cx="12" cy="8" r="4.5"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  gear: svg('<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>'),
  home: svg('<path d="M3 11l9-8 9 8"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-6h4v6"/>'),
  sound: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>'),
  wheel: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M3.5 10.5l6.5 1M20.5 10.5l-6.5 1M12 14.2V21"/>'),
  picture: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l6-5 3 2.5 3.5-3.5 3.5 3.5"/>'),
  fullscreen: svg('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'),
  pencil: svg('<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M13.5 6.5l4 4"/>'),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>'),
  act: svg('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.9-2.6L4 15.5a1.6 1.6 0 0 1 2.6-1.8L8 15"/>'),
};
