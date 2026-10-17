import { createElement, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

/**
 * Static batching for the base map. The ground (terrain, grass, flowers,
 * edges, the cut-away sides) never changes while you look at it, but it is
 * ~16,000 SVG elements. We render it once off-screen, rasterise it to a
 * bitmap and show a single <image> instead. It is re-baked only when the
 * ground actually changes (painting, expanding, placing or moving things).
 */

export type BakeRect = { x: number; y: number; w: number; h: number };

/** Render React SVG content to markup without mounting it on the page. */
function toMarkup(node: ReactNode, rect: BakeRect, pxW: number, pxH: number): string {
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => {
    root.render(
      createElement(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: `${rect.x} ${rect.y} ${rect.w} ${rect.h}`,
          width: pxW,
          height: pxH,
          preserveAspectRatio: 'none'
        },
        node
      )
    );
  });
  const markup = host.innerHTML;
  root.unmount();
  return markup;
}

/**
 * Bake `node` (SVG content in map units) covering `rect` into a PNG object URL.
 * `pxW` is the bitmap width; height follows the rect's aspect ratio.
 */
export async function bakeGround(node: ReactNode, rect: BakeRect, pxW: number): Promise<string> {
  const MAX = 4096;
  let w = Math.min(MAX, Math.round(pxW));
  let h = Math.round((w * rect.h) / rect.w);
  if (h > MAX) {
    w = Math.round((w * MAX) / h);
    h = MAX;
  }
  const markup = toMarkup(node, rect, w, h);
  const img = new Image();
  img.decoding = 'async';
  const svgUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    img.src = svgUrl;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('no blob');
    return URL.createObjectURL(blob);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
