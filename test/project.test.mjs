import test from 'node:test';
import assert from 'node:assert/strict';
import { makeProjectDocument, validateProjectDocument } from '../src/project.js';

const sheet = { w: 1200, h: 2100 };
const png = 'data:image/png;base64,' + Buffer.from('test artwork bytes').toString('base64');
const source = 'data:image/jpeg;base64,' + Buffer.from('original artwork').toString('base64');
const item = () => ({ name: 'one', sw: 100, sh: 200, s: 1.5, rot: 1, x: 20, y: 30,
  sheet: false, png, source: { name: 'one.jpg', data: source } });
const cut = { marginMm: 1.5, knifePressure: 42, cutHoles: false };
const doc = () => makeProjectDocument([item()], { ...cut }, sheet);

test('v2 project retains working pixels reference, original source and placement', () => {
  const saved = JSON.parse(JSON.stringify(doc()));
  assert.equal(saved.version, 2);
  assert.deepEqual(validateProjectDocument(saved, sheet), saved);
  assert.deepEqual(saved.stickers[0].source, item().source);
  assert.equal(saved.stickers[0].rot, 1);
  assert.deepEqual(saved.cut, cut);
});

test('v1 projects remain readable without an original source', () => {
  const old = doc(); old.version = 1; delete old.stickers[0].source;
  assert.equal(validateProjectDocument(old, sheet).version, 1);
});

test('bad input is refused before it reaches image decoding', () => {
  for (const change of [
    d => d.sheet[0] = 1,
    d => d.version = 3,
    d => d.cut.knifePressure = 101,
    d => d.stickers[0].s = Infinity,
    d => d.stickers[0].x = -1,
    d => d.stickers[0].rot = 9,
    d => d.stickers[0].sw = 12_000_001,
    d => d.stickers[0].png = 'data:text/html;base64,AAAA',
    d => d.stickers[0].source.data = 'data:image/svg+xml;base64,AAAA',
    d => d.stickers[0].source.name = 123,
    d => d.stickers[0].x = 1000,
  ]) {
    const bad = doc(); change(bad);
    assert.throws(() => validateProjectDocument(bad, sheet));
  }
});

test('v2 accepts missing originals for imported legacy projects', () => {
  const saved = doc(); saved.stickers[0].source = null;
  assert.equal(validateProjectDocument(saved, sheet).version, 2);
});

test('total decoded artwork budget blocks compressed image bombs', () => {
  const large = { ...item(), sw: 4000, sh: 3000, s: 0.1, rot: 0, x: 0, y: 0 };
  assert.throws(() => makeProjectDocument([large, large, large], { ...cut }, sheet), /memory limit/);
});
