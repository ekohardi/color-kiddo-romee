import { PatternId } from '../types/coloring';
import { getPatternTileImageData } from './patternFill';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export interface FloodFillOptions {
  patternId?: PatternId;
  /** Optional 1024x1024 region id buffer so patterned regions can be re-filled cleanly */
  regionIds?: Uint16Array;
  nextRegionId?: number;
  tolerance?: number;
}

/**
 * Scanline flood fill on `paintCtx` bounded by both color similarity on `paintCtx`
 * (or matching pattern regionId) and solid outline pixels on `lineCtx`.
 * Supports both Solid colors and seamless tiled Patterns (Love, Rainbow, Diamond, etc.).
 */
export function floodFillCanvas(
  paintCtx: CanvasRenderingContext2D,
  lineCtx: CanvasRenderingContext2D | null,
  startX: number,
  startY: number,
  fillHex: string,
  options: FloodFillOptions = {}
): boolean {
  const {
    patternId = 'solid',
    regionIds,
    nextRegionId = 1,
    tolerance = 42,
  } = options;

  const width = paintCtx.canvas.width;
  const height = paintCtx.canvas.height;
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);

  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return false;

  const paintImg = paintCtx.getImageData(0, 0, width, height);
  const pData = paintImg.data;
  const lineData = lineCtx ? lineCtx.getImageData(0, 0, width, height).data : null;

  const startPos = sy * width + sx;
  const startIdx = startPos * 4;

  // Do not fill if user tapped directly on a solid dark line
  if (lineData && lineData[startIdx + 3] >= 180) {
    return false;
  }

  const startRegionId = regionIds ? regionIds[startPos] : 0;
  const targetR = pData[startIdx];
  const targetG = pData[startIdx + 1];
  const targetB = pData[startIdx + 2];
  const [fillR, fillG, fillB] = hexToRgb(fillHex);

  // Skip no-op only for solid fill on non-patterned uniform area of the exact same color
  if (
    patternId === 'solid' &&
    startRegionId === 0 &&
    Math.abs(targetR - fillR) <= 4 &&
    Math.abs(targetG - fillG) <= 4 &&
    Math.abs(targetB - fillB) <= 4
  ) {
    return false;
  }

  const patternTile =
    patternId !== 'solid' ? getPatternTileImageData(patternId, fillHex) : null;
  const tileW = patternTile ? patternTile.width : 1;
  const tileH = patternTile ? patternTile.height : 1;
  const tileData = patternTile ? patternTile.data : null;

  const visited = new Uint8Array(width * height);
  const filledMask = new Uint8Array(width * height);

  const isBoundary = (pixelPos: number): boolean => {
    const i = pixelPos * 4;
    if (lineData && lineData[i + 3] >= 115) {
      return true;
    }
    if (startRegionId > 0 && regionIds) {
      return regionIds[pixelPos] !== startRegionId;
    }
    const dr = Math.abs(pData[i] - targetR);
    const dg = Math.abs(pData[i + 1] - targetG);
    const db = Math.abs(pData[i + 2] - targetB);
    return dr > tolerance || dg > tolerance || db > tolerance;
  };

  const writePixel = (pixelPos: number, x: number, y: number) => {
    const idx = pixelPos * 4;
    if (tileData) {
      const tx = x % tileW;
      const ty = y % tileH;
      const tIdx = (ty * tileW + tx) * 4;
      pData[idx] = tileData[tIdx];
      pData[idx + 1] = tileData[tIdx + 1];
      pData[idx + 2] = tileData[tIdx + 2];
      pData[idx + 3] = 255;
      if (regionIds) {
        regionIds[pixelPos] = nextRegionId;
      }
    } else {
      pData[idx] = fillR;
      pData[idx + 1] = fillG;
      pData[idx + 2] = fillB;
      pData[idx + 3] = 255;
      if (regionIds) {
        regionIds[pixelPos] = 0;
      }
    }
  };

  // Iterative scanline stack
  const stack = new Int32Array(width * height);
  let stackPtr = 0;
  stack[stackPtr++] = startPos;

  while (stackPtr > 0) {
    const pos = stack[--stackPtr];
    if (visited[pos]) continue;

    const y = Math.floor(pos / width);
    let x = pos - y * width;

    // Move left to edge of span
    while (x > 0 && !visited[y * width + (x - 1)] && !isBoundary(y * width + (x - 1))) {
      x--;
    }

    let spanAbove = false;
    let spanBelow = false;

    while (x < width) {
      const cur = y * width + x;
      if (visited[cur] || isBoundary(cur)) break;

      visited[cur] = 1;
      filledMask[cur] = 1;
      writePixel(cur, x, y);

      if (y > 0) {
        const up = cur - width;
        const upValid = !visited[up] && !isBoundary(up);
        if (!spanAbove && upValid) {
          stack[stackPtr++] = up;
          spanAbove = true;
        } else if (spanAbove && !upValid) {
          spanAbove = false;
        }
      }

      if (y < height - 1) {
        const down = cur + width;
        const downValid = !visited[down] && !isBoundary(down);
        if (!spanBelow && downValid) {
          stack[stackPtr++] = down;
          spanBelow = true;
        } else if (spanBelow && !downValid) {
          spanBelow = false;
        }
      }

      x++;
    }
  }

  // Feather 1px under semi-transparent outline edges to remove white halos
  if (lineData) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const cur = y * width + x;
        if (filledMask[cur]) continue;
        const hasFilledNeighbor =
          filledMask[cur - 1] ||
          filledMask[cur + 1] ||
          filledMask[cur - width] ||
          filledMask[cur + width];
        if (hasFilledNeighbor && lineData[cur * 4 + 3] > 0) {
          writePixel(cur, x, y);
        }
      }
    }
  }

  paintCtx.putImageData(paintImg, 0, 0);
  return true;
}
