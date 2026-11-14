export type ConversionMode = 'sketch' | 'photo';

export interface ConversionOptions {
  mode: ConversionMode;
  /** 0..100 sensitivity (higher = captures lighter lines / more edges) */
  sensitivity: number;
  /** Thicken outlines by 1px for easier tap-to-fill */
  boldLines: boolean;
  /** Invert light lines on dark background */
  invert: boolean;
}

const TARGET_SIZE = 1024;
const PAPER_PADDING = 56;

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the selected image file.'));
    };
    img.src = url;
  });
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load template image.'));
    img.src = url;
  });
}

/**
 * Converts an uploaded drawing, logo, or photo into a clean transparent-background
 * dark line-art PNG (1024x1024) ready for kids coloring & tap-to-fill.
 */
export function convertImageToColoringPage(
  img: HTMLImageElement,
  options: ConversionOptions
): string {
  const workCanvas = document.createElement('canvas');
  workCanvas.width = TARGET_SIZE;
  workCanvas.height = TARGET_SIZE;
  const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Fill pure white paper background before drawing source image
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

  const maxDraw = TARGET_SIZE - PAPER_PADDING * 2;
  const scale = Math.min(maxDraw / img.naturalWidth, maxDraw / img.naturalHeight);
  const drawW = Math.round(img.naturalWidth * scale);
  const drawH = Math.round(img.naturalHeight * scale);
  const dx = Math.round((TARGET_SIZE - drawW) / 2);
  const dy = Math.round((TARGET_SIZE - drawH) / 2);

  ctx.drawImage(img, dx, dy, drawW, drawH);

  const src = ctx.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE);
  const data = src.data;
  const total = TARGET_SIZE * TARGET_SIZE;

  // Grayscale buffer
  const gray = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const p = i * 4;
    let lum = Math.round(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]);
    if (options.invert) {
      lum = 255 - lum;
    }
    gray[i] = lum;
  }

  // Binary / alpha outline mask (0..255 alpha)
  const mask = new Uint8Array(total);

  if (options.mode === 'sketch') {
    // Map sensitivity 0..100 -> luminance cutoff 70..235
    const cutoff = Math.round(70 + (options.sensitivity / 100) * 165);
    for (let i = 0; i < total; i++) {
      const lum = gray[i];
      if (lum < cutoff) {
        // Smoothly ramp alpha for crisp edges
        const strength = Math.min(1, (cutoff - lum) / 36);
        mask[i] = Math.round(strength * 255);
      }
    }
  } else {
    // Photo / Colored Design mode: 3x3 box smooth + Sobel edge detection
    const blurred = new Uint8Array(total);
    for (let y = 1; y < TARGET_SIZE - 1; y++) {
      for (let x = 1; x < TARGET_SIZE - 1; x++) {
        const idx = y * TARGET_SIZE + x;
        const sum =
          gray[idx - TARGET_SIZE - 1] +
          gray[idx - TARGET_SIZE] +
          gray[idx - TARGET_SIZE + 1] +
          gray[idx - 1] +
          gray[idx] +
          gray[idx + 1] +
          gray[idx + TARGET_SIZE - 1] +
          gray[idx + TARGET_SIZE] +
          gray[idx + TARGET_SIZE + 1];
        blurred[idx] = Math.round(sum / 9);
      }
    }

    // Sensitivity 0..100 -> edge threshold 145..28
    const edgeThreshold = Math.round(145 - (options.sensitivity / 100) * 117);
    for (let y = 2; y < TARGET_SIZE - 2; y++) {
      for (let x = 2; x < TARGET_SIZE - 2; x++) {
        const idx = y * TARGET_SIZE + x;
        const tl = blurred[idx - TARGET_SIZE - 1];
        const tc = blurred[idx - TARGET_SIZE];
        const tr = blurred[idx - TARGET_SIZE + 1];
        const ml = blurred[idx - 1];
        const mr = blurred[idx + 1];
        const bl = blurred[idx + TARGET_SIZE - 1];
        const bc = blurred[idx + TARGET_SIZE];
        const br = blurred[idx + TARGET_SIZE + 1];

        const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
        const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
        const mag = Math.sqrt(gx * gx + gy * gy);

        if (mag > edgeThreshold) {
          const strength = Math.min(1, (mag - edgeThreshold) / 48);
          mask[idx] = Math.round(strength * 255);
        }
      }
    }
  }

  // Optional 1px bold dilation to make outlines kid-friendly and close tiny gaps
  let finalMask = mask;
  if (options.boldLines) {
    const dilated = new Uint8Array(total);
    for (let y = 1; y < TARGET_SIZE - 1; y++) {
      for (let x = 1; x < TARGET_SIZE - 1; x++) {
        const idx = y * TARGET_SIZE + x;
        const m = Math.max(
          mask[idx],
          mask[idx - 1],
          mask[idx + 1],
          mask[idx - TARGET_SIZE],
          mask[idx + TARGET_SIZE]
        );
        dilated[idx] = m;
      }
    }
    finalMask = dilated;
  }

  // Write crisp #1A1D24 ink onto transparent background
  const out = ctx.createImageData(TARGET_SIZE, TARGET_SIZE);
  const oData = out.data;
  for (let i = 0; i < total; i++) {
    const a = finalMask[i];
    if (a > 0) {
      const p = i * 4;
      oData[p] = 26;
      oData[p + 1] = 29;
      oData[p + 2] = 36;
      oData[p + 3] = a;
    }
  }

  ctx.putImageData(out, 0, 0);
  return workCanvas.toDataURL('image/png');
}
