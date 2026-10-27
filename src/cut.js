// Sheet raster -> PLT cut file. Pure (no DOM), so it runs in the browser and under node tests.
import { generateCutPath } from '../vendor/pixcut-trace/generate.ts';
import { SHEET } from './protocol.js';

export const MAX_CUT_CONTOURS = 100;

export const CUT_DEFAULTS = {
  marginMm: 1.5, // white border grown around each sticker's opaque pixels
  // Knife pressure, 1..100. The official app sends 42 for Liene sticker media (per popcornhax);
  // verified on our printer 2026-10-08: KP1 never lowers the blade.
  knifePressure: 42,
  cutHoles: false, // also cut along transparent holes inside a sticker
  alphaThreshold: 128,
};

/**
 * Trace the composited sheet (1200x2100 RGBA, transparent where nothing is placed) into a cut.
 * Returns { plt, contours (sheet-pixel space, after margin), paths, stats }.
 */
export function traceSheet(raster, opts = {}) {
  const o = { ...CUT_DEFAULTS, ...opts };
  if (raster.width !== SHEET.w || raster.height !== SHEET.h) {
    throw new Error(`sheet raster must be ${SHEET.w}x${SHEET.h}, got ${raster.width}x${raster.height}`);
  }
  let any = false, transparent = false;
  for (let i = 3; i < raster.data.length; i += 4) {
    const alpha = raster.data[i];
    if (alpha >= o.alphaThreshold) any = true;
    if (alpha < 255) transparent = true;
    if (any && transparent) break;
  }
  if (!any) return { plt: '', contours: [], paths: [], stats: null };
  if (!transparent) {
    throw new Error('The entire sheet is opaque. Add transparency to define a cutting outline.');
  }

  // The upstream tracer silently returns only its largest 100 regions. Trace one
  // beyond the configured limit so an incomplete sheet is an error, not a print job.
  const maxContours = o.overrides?.maxContours ?? MAX_CUT_CONTOURS;
  if (!Number.isSafeInteger(maxContours) || maxContours < 1 || maxContours > 1000) {
    throw new Error('maxContours must be a whole number from 1 to 1000');
  }
  const { maxContours: _configuredLimit, ...overrides } = o.overrides ?? {};
  const r = generateCutPath(raster, {
    binarize: { mode: 'alpha', alphaThreshold: o.alphaThreshold },
    dilation: Math.max(0, o.marginMm),
    knifePressure: Math.round(o.knifePressure),
    includeHoles: o.cutHoles,
    fillMethod: 'fit', // the raster is exactly the 4x7 cut canvas, so the scale is 1 before overscan
    ...overrides,
    maxContours: maxContours + 1,
  });
  if (r.contours.length > maxContours) {
    throw new Error(`More than ${maxContours} separate cut outlines detected. Split the sheet or reduce the number of stickers; printing an incomplete cut is disabled.`);
  }
  return { plt: r.plt, contours: r.contours, paths: r.document.paths, stats: r.stats };
}

/** A PLT header and parking move alone do not make a printable cut. */
export function hasPrintableCut(cut) {
  return Boolean(cut?.plt && cut?.paths?.length > 0);
}

/** Pad a 1200x2100 RGB(A) sheet to the printer's 1216x2128 raster on white. Returns RGBA bytes. */
export function padToRaster(raster) {
  const { w, h, padX, padY, rasterW, rasterH } = SHEET;
  const out = new Uint8ClampedArray(rasterW * rasterH * 4).fill(255);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4;
      const d = ((y + padY) * rasterW + x + padX) * 4;
      const a = raster.data[s + 3] / 255; // composite onto white paper
      out[d] = 255 + (raster.data[s] - 255) * a;
      out[d + 1] = 255 + (raster.data[s + 1] - 255) * a;
      out[d + 2] = 255 + (raster.data[s + 2] - 255) * a;
    }
  }
  return { width: rasterW, height: rasterH, data: out };
}
