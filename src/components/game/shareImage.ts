/**
 * Turns the live base map into a 1080×1350 image card (Instagram-story
 * friendly) with the base name, level title and a few stats.
 *
 * The map is an SVG styled by page CSS, so before drawing it we copy every
 * `.base-*` rule into the cloned SVG; otherwise tiles and lights lose colour.
 */

export type ShareCardInfo = {
  name: string;
  levelLine: string;
  stats: Array<{ value: string; label: string }>;
  footer: string;
};

function baseCss(): string {
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList;
    try {
      list = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet (e.g. web fonts)
    }
    const walk = (items: CSSRuleList) => {
      for (const rule of Array.from(items)) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes('.base-')) {
          // The map is always a night scene; drop light/dark-mode prefixes.
          rules.push(rule.cssText.replace(/\.dark\s+/g, ''));
        } else if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
          walk((rule as CSSGroupingRule).cssRules);
        }
      }
    };
    walk(list);
  }
  return rules.join('\n');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function svgToImage(svg: SVGSVGElement, size: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(size));
  clone.setAttribute('height', String(size));
  // No selection rings or placement highlights in the picture.
  clone.querySelectorAll('.base-selection, .base-valid-tile').forEach((el) => el.remove());
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = baseCss();
  clone.insertBefore(style, clone.firstChild);
  const markup = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderShareCard(svg: SVGSVGElement, info: ShareCardInfo, rtl = false): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas');
  await document.fonts?.ready;

  // Night-sky background with a soft green glow behind the island.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0b1020');
  sky.addColorStop(1, '#0d1a14');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 700, 80, W / 2, 700, 620);
  glow.addColorStop(0, 'rgba(63,168,98,0.35)');
  glow.addColorStop(1, 'rgba(63,168,98,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 60; i++) {
    const x = (i * 197) % W;
    const y = (i * 83) % 260;
    ctx.fillRect(x, y, i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
  }

  ctx.textAlign = 'center';
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.fillStyle = '#c8f032';
  ctx.font = "800 72px 'Archivo Black', 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText(info.name, W / 2, 130, W - 120);
  ctx.fillStyle = '#9fe6ff';
  ctx.font = "700 38px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText(info.levelLine, W / 2, 190, W - 120);

  const map = await svgToImage(svg, 900);
  ctx.save();
  roundRect(ctx, 90, 240, 900, 900, 36);
  ctx.clip();
  ctx.drawImage(map, 90, 240, 900, 900);
  ctx.restore();
  ctx.strokeStyle = 'rgba(111,211,138,0.45)';
  ctx.lineWidth = 4;
  roundRect(ctx, 90, 240, 900, 900, 36);
  ctx.stroke();

  const colW = (W - 180) / info.stats.length;
  info.stats.forEach((stat, i) => {
    const cx = 90 + colW * i + colW / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = "800 54px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(stat.value, cx, 1222);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = "600 28px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(stat.label, cx, 1262, colW - 20);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = "600 26px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText(info.footer, W / 2, 1320);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No image'))), 'image/png')
  );
}

/** Opens the share sheet where possible (phones), otherwise downloads the image. */
export async function shareOrDownload(blob: Blob, filename: string, title: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
