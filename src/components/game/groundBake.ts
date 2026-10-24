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
 * Bake `node` (SVG content in map units) covering `rect` into a PNG data URL.
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
  // data: URLs (not blob:) so the bake also works on hosts with strict
  // content-security policies, which often allow only data: images.
  const img = new Image();
  img.decoding = 'async';
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.drawImage(img, 0, 0, w, h);
  return toDataUrlAsync(canvas);
}

/**
 * PNG-encode off the main thread (toBlob is asynchronous), then read it back
 * as a data: URL (blob: URLs are blocked by some hosts' content policies).
 */
/**
 * Blob URLs avoid a slow base64 round trip, but some hosts' content policies
 * block them. Probed once: if a blob image can't load, use data: URLs.
 */
let blobUrlsWork: Promise<boolean> | null = null;
function canUseBlobUrls(): Promise<boolean> {
  if (!blobUrlsWork) {
    blobUrlsWork = new Promise((resolve) => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        c.toBlob((blob) => {
          if (!blob) return resolve(false);
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      } catch {
        resolve(false);
      }
    });
  }
  return blobUrlsWork;
}

function toDataUrlAsync(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (blob && (await canUseBlobUrls())) {
        resolve(URL.createObjectURL(blob));
        return;
      }
      if (!blob) {
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    }, 'image/png');
  });
}

/**
 * Patch an existing bake: draw just the given (small) layer, e.g. a few
 * freshly painted tiles, on top of the previous image. Far cheaper than
 * re-rendering all ~400 tiles; a full bake later restores perfect edges.
 */
export async function bakePatch(baseUrl: string, node: ReactNode, rect: BakeRect, w: number, h: number): Promise<string> {
  const base = new Image();
  base.decoding = 'async';
  base.src = baseUrl;
  const markup = toMarkup(node, rect, w, h);
  const layer = new Image();
  layer.decoding = 'async';
  layer.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await Promise.all([base.decode(), layer.decode()]);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.drawImage(base, 0, 0, w, h);
  ctx.drawImage(layer, 0, 0, w, h);
  return toDataUrlAsync(canvas);
}

/** The pixel size a bake of this rect will use (same rules as bakeGround). */
export function bakeSize(rect: BakeRect, pxW: number): { w: number; h: number } {
  const MAX = 4096;
  let w = Math.min(MAX, Math.round(pxW));
  let h = Math.round((w * rect.h) / rect.w);
  if (h > MAX) {
    w = Math.round((w * MAX) / h);
    h = MAX;
  }
  return { w, h };
}
