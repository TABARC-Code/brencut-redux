import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodePng } from '../vendor/pixcut-trace/png.ts';
import { traceSheet, hasPrintableCut, MAX_CUT_CONTOURS } from '../src/cut.js';
import { SHEET } from '../src/protocol.js';

function squares(count, size = 50) {
  const { w, h } = SHEET;
  const data = new Uint8Array(w * h * 4);
  for (let n = 0; n < count; n++) {
    const x0 = 50 + (n % 16) * 65;
    const y0 = 50 + Math.floor(n / 16) * 65;
    for (let y = y0; y < y0 + size; y++) for (let x = x0; x < x0 + size; x++) {
      data[(y * w + x) * 4 + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

test('small regions that create only a PLT header are not printable', () => {
  const result = traceSheet(squares(1, 10), { marginMm: 0 });
  assert.equal(result.paths.length, 0);
  assert.ok(result.plt.startsWith('IN ')); // header-only output is nonempty
  assert.equal(hasPrintableCut(result), false);
});

test('a valid sticker creates a printable PLT', () => {
  const png = decodePng(readFileSync(new URL('./fixtures/square-4x7.png', import.meta.url)));
  assert.equal(hasPrintableCut(traceSheet(png)), true);
});

test('default limit does not silently drop the 101st cut outline', () => {
  assert.equal(MAX_CUT_CONTOURS, 100);
  assert.throws(() => traceSheet(squares(101), { marginMm: 0 }), /More than 100 separate cut outlines/);
});

test('a deliberately raised contour limit preserves all 101 regions', () => {
  const result = traceSheet(squares(101), { marginMm: 0, overrides: { maxContours: 150 } });
  assert.equal(result.paths.length, 101);
  assert.equal(result.contours.length, 101);
});

test('an entirely opaque full sheet fails with an actionable cut-line warning', () => {
  const rgba = new Uint8Array(SHEET.w * SHEET.h * 4).fill(255);
  const full = { width: SHEET.w, height: SHEET.h, data: rgba };
  assert.throws(() => traceSheet(full), /entire sheet is opaque.*transparency/);
});
