import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectSheet } from '../src/preflight.js';

const sheet = { w: 1200, h: 2100 };
const settings = { marginMm: 1.5, knifePressure: 42, cutHoles: false };
const item = (name, x, y) => ({ name, sw: 100, sh: 100, s: 1, rot: 0, x, y });
const cut = () => ({ plt: 'IN;PU;', paths: [{}], contours: [{ outer: [
  { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 }, { x: 100, y: 200 },
] }] });
const check = (items, c = cut(), s = settings) => inspectSheet(items, c, s, sheet);
const codes = result => result.errors.map(e => e.code);

test('ordinary spaced stickers pass preflight', () => {
  assert.equal(check([item('A', 80, 80), item('B', 280, 80)]).ok, true);
});
test('overlap and unsafe border gap are both refused', () => {
  assert.ok(codes(check([item('A', 80, 80), item('B', 120, 80)])).includes('overlap'));
  assert.ok(codes(check([item('A', 80, 80), item('B', 205, 80)])).includes('cut-gap'));
});
test('out of bounds, invalid scale and missing contours are refused', () => {
  assert.ok(codes(check([item('A', -1, 0)])).includes('bounds'));
  assert.ok(codes(check([{ ...item('A', 0, 0), s: Infinity }])).includes('geometry'));
  assert.ok(codes(check([item('A', 80, 80)], { plt: 'IN;', paths: [{}], contours: [] })).includes('no-cut'));
});
test('stale cut and bad cutting settings block the job', () => {
  assert.ok(codes(inspectSheet([item('A', 80, 80)], cut(), settings, sheet, true)).includes('stale'));
  assert.ok(codes(check([item('A', 80, 80)], cut(), { ...settings, knifePressure: 0 })).includes('settings'));
});
test('a cut outside the sheet blocks; near-edge cuts warn', () => {
  const outside = cut(); outside.contours[0].outer[0].x = -2;
  assert.ok(codes(check([item('A', 80, 80)], outside)).includes('cut-bounds'));
  const near = cut(); near.contours[0].outer[0].x = 2;
  const r = check([item('A', 80, 80)], near);
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some(w => w.code === 'edge'));
});
