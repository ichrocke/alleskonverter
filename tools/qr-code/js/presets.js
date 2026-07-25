// Design-Vorlagen und eingebaute Logo-Symbole.

export const PRESETS = [
  {
    id: 'classic', label: 'Klassisch',
    design: {
      dotsType: 'square', cornersSquareType: 'square', cornersDotType: 'square',
      dotsColorMode: 'single', dotsColor: '#1a1a2e',
      cornersCustom: false,
      bgMode: 'color', bgColor: '#ffffff',
    },
  },
  {
    id: 'ocean', label: 'Ocean',
    design: {
      dotsType: 'rounded', cornersSquareType: 'extra-rounded', cornersDotType: 'dot',
      dotsColorMode: 'gradient', dotsGradType: 'linear', dotsGradRot: 45,
      dotsGradA: '#0ea5e9', dotsGradB: '#6366f1',
      cornersCustom: false,
      bgMode: 'color', bgColor: '#ffffff',
    },
  },
  {
    id: 'sunset', label: 'Sunset',
    design: {
      dotsType: 'classy-rounded', cornersSquareType: 'extra-rounded', cornersDotType: 'dot',
      dotsColorMode: 'gradient', dotsGradType: 'linear', dotsGradRot: 120,
      dotsGradA: '#f97316', dotsGradB: '#ec4899',
      cornersCustom: false,
      bgMode: 'color', bgColor: '#fffbf5',
    },
  },
  {
    id: 'forest', label: 'Forest',
    design: {
      dotsType: 'classy', cornersSquareType: 'square', cornersDotType: 'square',
      dotsColorMode: 'single', dotsColor: '#14532d',
      cornersCustom: true, cornersSquareColor: '#16a34a', cornersDotColor: '#14532d',
      bgMode: 'color', bgColor: '#f0fdf4',
    },
  },
  {
    id: 'neon', label: 'Neon',
    design: {
      dotsType: 'dots', cornersSquareType: 'extra-rounded', cornersDotType: 'dot',
      dotsColorMode: 'gradient', dotsGradType: 'radial', dotsGradRot: 0,
      dotsGradA: '#22d3ee', dotsGradB: '#a855f7',
      cornersCustom: true, cornersSquareColor: '#22d3ee', cornersDotColor: '#a855f7',
      bgMode: 'color', bgColor: '#0f1117',
    },
  },
  {
    id: 'berry', label: 'Berry',
    design: {
      dotsType: 'rounded', cornersSquareType: 'dot', cornersDotType: 'dot',
      dotsColorMode: 'single', dotsColor: '#9d174d',
      cornersCustom: true, cornersSquareColor: '#be185d', cornersDotColor: '#9d174d',
      bgMode: 'gradient', bgGradA: '#fdf2f8', bgGradB: '#fce7f3',
    },
  },
  {
    id: 'mono', label: 'Mono Soft',
    design: {
      dotsType: 'extra-rounded', cornersSquareType: 'extra-rounded', cornersDotType: 'dot',
      dotsColorMode: 'single', dotsColor: '#27272a',
      cornersCustom: false,
      bgMode: 'color', bgColor: '#fafafa',
    },
  },
  {
    id: 'gold', label: 'Gold',
    design: {
      dotsType: 'classy-rounded', cornersSquareType: 'extra-rounded', cornersDotType: 'square',
      dotsColorMode: 'gradient', dotsGradType: 'linear', dotsGradRot: 60,
      dotsGradA: '#b45309', dotsGradB: '#fbbf24',
      cornersCustom: false,
      bgMode: 'color', bgColor: '#1c1917',
    },
  },
];

// Eingebaute Symbole als Inline-SVG (werden als Data-URL ins Logo-Feld übernommen).
const iconSvg = (inner, color = '#1a1a2e') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="23" fill="white"/><g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;

export const BUILT_IN_ICONS = [
  { id: 'wifi', label: 'WLAN', svg: iconSvg('<path d="M12 24a17 17 0 0 1 24 0M17 29.5a10 10 0 0 1 14 0"/><circle cx="24" cy="35" r="2.5" fill="#1a1a2e" stroke="none"/>') },
  { id: 'link', label: 'Link', svg: iconSvg('<path d="M21 27a6 6 0 0 0 9 .6l4-4a6 6 0 0 0-8.5-8.5l-2 2"/><path d="M27 21a6 6 0 0 0-9-.6l-4 4a6 6 0 0 0 8.5 8.5l2-2"/>') },
  { id: 'mail', label: 'Mail', svg: iconSvg('<rect x="10" y="14" width="28" height="20" rx="3"/><path d="m10 17 14 10 14-10"/>') },
  { id: 'phone', label: 'Telefon', svg: iconSvg('<path d="M36 31v4a3 3 0 0 1-3.3 3 29 29 0 0 1-12.6-4.5 28 28 0 0 1-8.6-8.6A29 29 0 0 1 7 12.3 3 3 0 0 1 10 9h4a3 3 0 0 1 3 2.6c.2 1.4.5 2.8 1 4.1a3 3 0 0 1-.7 3.2L15.6 20a23 23 0 0 0 8.5 8.5l1.1-1.7a3 3 0 0 1 3.2-.7c1.3.5 2.7.8 4.1 1A3 3 0 0 1 36 31Z"/>') },
  { id: 'chat', label: 'Chat', svg: iconSvg('<path d="M38 23a13 13 0 0 1-13 13H10l4-4.4A13 13 0 1 1 38 23Z"/>') },
  { id: 'heart', label: 'Herz', svg: iconSvg('<path d="M24 38S8 29 8 18.5A7.5 7.5 0 0 1 24 14a7.5 7.5 0 0 1 16 4.5C40 29 24 38 24 38Z" fill="#e11d48" stroke="#e11d48"/>') },
  { id: 'pin', label: 'Ort', svg: iconSvg('<path d="M37 20c0 9.5-13 18-13 18S11 29.5 11 20a13 13 0 0 1 26 0Z"/><circle cx="24" cy="20" r="4.5"/>') },
  { id: 'euro', label: 'Euro', svg: iconSvg('<path d="M32 13a12 12 0 1 0 0 22M10 21h15M10 27h15"/>') },
  { id: 'play', label: 'Play', svg: iconSvg('<path d="M18 13l18 11-18 11Z" fill="#1a1a2e"/>') },
  { id: 'cal', label: 'Termin', svg: iconSvg('<rect x="10" y="12" width="28" height="26" rx="3"/><path d="M17 8v7m14-7v7M10 21h28"/>') },
  { id: 'cart', label: 'Shop', svg: iconSvg('<circle cx="19" cy="38" r="2.5" fill="#1a1a2e" stroke="none"/><circle cx="32" cy="38" r="2.5" fill="#1a1a2e" stroke="none"/><path d="M8 10h5l4 20h17l4-14H15"/>') },
  { id: 'star', label: 'Stern', svg: iconSvg('<path d="m24 8 4.9 10 11.1 1.6-8 7.8 1.9 11L24 33.2 14.1 38.4l1.9-11-8-7.8L19.1 18Z" fill="#f59e0b" stroke="#f59e0b"/>') },
];

export const iconToDataUrl = (svg) =>
  'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
