import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodePng } from '../vendor/pixcut-trace/png.ts';
import { traceSheet, padToRaster } from '../src/cut.js';
import { SHEET } from '../src/protocol.js';
import { makeProjectDocument, validateProjectDocument } from '../src/project.js';

test('PNG project round-trip keeps traced PLT and padded print raster unchanged', () => {
  const original = readFileSync(new URL('./fixtures/square-4x7.png', import.meta.url));
  const before = decodePng(original);
  assert.equal(before.width, SHEET.w);
  assert.equal(before.height, SHEET.h);
  const data = 'data:image/png;base64,' + original.toString('base64');
  const document = makeProjectDocument([{
    name: 'square', sw: before.width, sh: before.height, s: 1, rot: 0, x: 0, y: 0,
    sheet: true, png: data, source: { name: 'square-4x7.png', data },
  }], { marginMm: 1.5, knifePressure: 42, cutHoles: false }, SHEET);
  const reopened = validateProjectDocument(JSON.parse(JSON.stringify(document)), SHEET);
  assert.equal(reopened.stickers[0].source.data, data);
  const pngBytes = Buffer.from(reopened.stickers[0].png.split(',')[1], 'base64');
  const after = decodePng(pngBytes);
  assert.deepEqual(after.data, before.data);
  const firstCut = traceSheet(before);
  const secondCut = traceSheet(after);
  assert.equal(secondCut.plt, firstCut.plt);
  assert.deepEqual(padToRaster(after).data, padToRaster(before).data);
});
