import { PatternId } from '../types/coloring';

export interface PatternOption {
  id: PatternId;
  label: string;
}

export const PATTERN_OPTIONS: PatternOption[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'love', label: 'Love' },
  { id: 'rainbow', label: 'Rainbow' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'stars', label: 'Stars' },
  { id: 'dots', label: 'Dots' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'waves', label: 'Waves' },
];

const TILE_SIZE = 96;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mixWithWhite(hex: string, colorWeight: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mr = Math.round(255 * (1 - colorWeight) + r * colorWeight);
  const mg = Math.round(255 * (1 - colorWeight) + g * colorWeight);
  const mb = Math.round(255 * (1 - colorWeight) + b * colorWeight);
  return `rgb(${mr}, ${mg}, ${mb})`;
}

/** Ensures white swatch still shows visible pattern motifs */
function resolveMotifColor(hex: string): string {
  if (hex.toUpperCase() === '#FFFFFF') {
    return '#94A3B8';
  }
  return hex;
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size * 0.5;
  ctx.moveTo(0, s * 0.85);
  ctx.bezierCurveTo(-s * 1.35, -s * 0.05, -s * 0.95, -s * 1.15, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.95, -s * 1.15, s * 1.35, -s * 0.05, 0, s * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  const innerR = outerR * 0.45;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function createPatternTile(
  patternId: PatternId,
  baseHex: string,
  size = TILE_SIZE
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const motif = resolveMotifColor(baseHex);
  const softBg = mixWithWhite(motif, 0.16);
  const midBg = mixWithWhite(motif, 0.36);

  if (patternId === 'solid') {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);
    return canvas;
  }

  if (patternId === 'love') {
    ctx.fillStyle = softBg;
    ctx.fillRect(0, 0, size, size);
    const positions = [
      [size * 0.25, size * 0.25],
      [size * 0.75, size * 0.75],
    ];
    for (const [px, py] of positions) {
      drawHeart(ctx, px, py, size * 0.34, motif);
    }
    // Small secondary hearts at staggered corners (wrapped for seamless tile)
    const smallPositions = [
      [size * 0.75, size * 0.25],
      [size * 0.25, size * 0.75],
    ];
    for (const [px, py] of smallPositions) {
      drawHeart(ctx, px, py, size * 0.18, midBg);
    }
    return canvas;
  }

  if (patternId === 'rainbow') {
    const bands = ['#FF4D3D', '#FF9626', '#FFD22E', '#26B872', '#38BDF8', '#8B5CF6', '#F45B9A'];
    const bandCount = bands.length;
    const img = ctx.createImageData(size, size);
    const rgbBands = bands.map(hexToRgb);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Seamless diagonal band index across 0..size
        const t = ((x + y) / size) * bandCount;
        const bandIdx = Math.floor(t) % bandCount;
        const [r, g, b] = rgbBands[bandIdx];
        const idx = (y * size + x) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  if (patternId === 'diamond') {
    ctx.fillStyle = softBg;
    ctx.fillRect(0, 0, size, size);
    const half = size / 2;
    const centers = [
      [half / 2, half / 2],
      [(half * 3) / 2, half / 2],
      [half / 2, (half * 3) / 2],
      [(half * 3) / 2, (half * 3) / 2],
    ];
    centers.forEach(([cx, cy], idx) => {
      ctx.fillStyle = idx === 0 || idx === 3 ? motif : midBg;
      ctx.beginPath();
      ctx.moveTo(cx, cy - half * 0.42);
      ctx.lineTo(cx + half * 0.42, cy);
      ctx.lineTo(cx, cy + half * 0.42);
      ctx.lineTo(cx - half * 0.42, cy);
      ctx.closePath();
      ctx.fill();
    });
    return canvas;
  }

  if (patternId === 'stars') {
    ctx.fillStyle = softBg;
    ctx.fillRect(0, 0, size, size);
    drawStar(ctx, size * 0.25, size * 0.25, size * 0.17, motif);
    drawStar(ctx, size * 0.75, size * 0.75, size * 0.17, motif);
    drawStar(ctx, size * 0.75, size * 0.25, size * 0.1, midBg);
    drawStar(ctx, size * 0.25, size * 0.75, size * 0.1, midBg);
    return canvas;
  }

  if (patternId === 'dots') {
    ctx.fillStyle = softBg;
    ctx.fillRect(0, 0, size, size);
    const r = size * 0.15;
    const pts = [
      [size * 0.25, size * 0.25],
      [size * 0.75, size * 0.75],
      [size * 0.75, size * 0.25],
      [size * 0.25, size * 0.75],
    ];
    pts.forEach(([cx, cy], idx) => {
      ctx.fillStyle = idx < 2 ? motif : midBg;
      ctx.beginPath();
      ctx.arc(cx, cy, idx < 2 ? r : r * 0.65, 0, Math.PI * 2);
      ctx.fill();
    });
    return canvas;
  }

  if (patternId === 'stripes') {
    const img = ctx.createImageData(size, size);
    const [mr, mg, mb] = hexToRgb(motif);
    const [sr, sg, sb] = [
      Math.round(255 * 0.84 + mr * 0.16),
      Math.round(255 * 0.84 + mg * 0.16),
      Math.round(255 * 0.84 + mb * 0.16),
    ];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const stripe = Math.floor(((x + y) / size) * 4) % 2 === 0;
        const idx = (y * size + x) * 4;
        img.data[idx] = stripe ? mr : sr;
        img.data[idx + 1] = stripe ? mg : sg;
        img.data[idx + 2] = stripe ? mb : sb;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  // waves
  ctx.fillStyle = softBg;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = motif;
  ctx.lineWidth = size * 0.09;
  ctx.lineCap = 'round';
  const rows = [size * 0.25, size * 0.75];
  for (const ry of rows) {
    ctx.beginPath();
    for (let x = -size; x <= size * 2; x += 2) {
      const y = ry + Math.sin((x / size) * Math.PI * 2) * (size * 0.12);
      if (x === -size) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return canvas;
}

export function getPatternTileImageData(patternId: PatternId, baseHex: string): ImageData {
  const tile = createPatternTile(patternId, baseHex, TILE_SIZE);
  const ctx = tile.getContext('2d');
  if (!ctx) {
    return new ImageData(TILE_SIZE, TILE_SIZE);
  }
  return ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
}

export function getPatternPreviewUrl(patternId: PatternId, baseHex: string): string {
  return createPatternTile(patternId, baseHex, 48).toDataURL('image/png');
}
