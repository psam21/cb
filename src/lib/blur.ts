// Small transparent or subtle beige blur placeholders as data URLs
// Generated 10x10 PNGs encoded in base64 – keeps bundle size tiny but avoids layout jank

export const BLUR_BEIGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQoU2NkgID/DAwMDAwGJgYGBgYAAK0cBf9Gv3pXAAAAAElFTkSuQmCC';

export const BLUR_GRAY =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAG0lEQVQoU2NkYGBg+M+ABYwMDIxgQDAwMDAwAAB8yATBz0HjKgAAAABJRU5ErkJggg==';

export const DEFAULT_BLUR = BLUR_BEIGE;

// Utility to pick a blur by theme or type
export function blurFor(kind?: 'beige' | 'gray') {
  return kind === 'gray' ? BLUR_GRAY : BLUR_BEIGE;
}
