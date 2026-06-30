import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const assetsDir = join(root, 'assets');

const squareSvg = readFileSync(join(publicDir, 'icon.svg'), 'utf8');
const logoSvg = readFileSync(join(assetsDir, 'failure-logo.svg'), 'utf8');

function renderPng(svg, width, outPath) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width }
  });
  writeFileSync(outPath, resvg.render().asPng());
  console.log(`Wrote ${outPath} (${width}px)`);
}

// PWA + favicon assets in public/
renderPng(squareSvg, 180, join(publicDir, 'apple-touch-icon.png'));
renderPng(squareSvg, 192, join(publicDir, 'icon-192.png'));
renderPng(squareSvg, 512, join(publicDir, 'icon-512.png'));

// Standalone logo exports in assets/
for (const scale of [1, 4, 8]) {
  const width = 88 * scale * 10;
  renderPng(logoSvg, width, join(assetsDir, `failure-logo${scale === 1 ? '' : `@${scale}x`}.png`));
}
