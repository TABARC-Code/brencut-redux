import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APPEARANCES, normaliseAppearance, setAppearance, installAppearanceControls } from '../src/appearance.js';

function fakePage() {
  const values = new Map([['appearance', 'kawaii'], ['kp', 42], ['marginMm', 1.5]]);
  const store = { get: (key, fallback) => values.has(key) ? values.get(key) : fallback, set: (key, value) => values.set(key, value) };
  const buttons = APPEARANCES.map((choice) => ({
    dataset: { appearanceChoice: choice }, attrs: {}, handlers: {},
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(name, cb) { this.handlers[name] = cb; },
    click() { this.handlers.click(); },
  }));
  const dialog = { open: false, events: {}, addEventListener(k,fn){this.events[k]=fn;}, showModal() { this.open = true; }, close() { this.open = false; this.events.close?.(); } };
  const control = () => ({ handlers: {}, attrs: {}, setAttribute(k,v) {this.attrs[k]=v;}, addEventListener(name, cb) { this.handlers[name] = cb; }, click() { this.handlers.click(); } });
  const help = control(), close = control();
  const meta = { content: '' };
  const doc = {
    body: { dataset: {} }, documentElement: { style: {} },
    querySelector: (key) => key === 'meta[name="theme-color"]' ? meta : null,
    querySelectorAll: (key) => key === '[data-appearance-choice]' ? buttons : [],
    getElementById: (key) => ({ helpDialog: dialog, helpBtn: help, helpClose: close })[key] ?? null,
  };
  return { doc, store, buttons, dialog, help, close, values, meta };
}

test('theme names validate and invalid stored values fall back to Simple', () => {
  assert.deepEqual(APPEARANCES, ['simple', 'kawaii', 'engineer']);
  assert.equal(normaliseAppearance('engineer'), 'engineer');
  assert.equal(normaliseAppearance('__invalid__'), 'simple');
});

test('controls restore preference and retain unrelated blade and margin settings', () => {
  const f = fakePage();
  let changed = 0;
  assert.equal(installAppearanceControls({ doc: f.doc, store: f.store, onChange: () => changed++ }), 'kawaii');
  assert.equal(f.doc.body.dataset.appearance, 'kawaii');
  assert.equal(f.doc.documentElement.style.colorScheme, 'light');
  assert.equal(f.buttons[1].attrs['aria-pressed'], 'true');
  assert.equal(changed, 0, 'initialisation does not trigger a premature canvas draw');
  f.buttons[2].click();
  assert.equal(f.values.get('appearance'), 'engineer');
  assert.equal(f.meta.content, '#0c1219');
  assert.equal(f.doc.documentElement.style.colorScheme, 'dark');
  assert.equal(f.buttons[2].attrs['aria-pressed'], 'true');
  assert.equal(f.buttons[1].attrs['aria-pressed'], 'false');
  assert.equal(f.values.get('kp'), 42);
  assert.equal(f.values.get('marginMm'), 1.5);
  assert.equal(changed, 1);
});

test('help opens and closes without switching appearance', () => {
  const f = fakePage();
  installAppearanceControls({ doc: f.doc, store: f.store });
  f.help.click(); assert.equal(f.dialog.open, true);
  assert.equal(f.help.attrs['aria-expanded'], 'true');
  f.close.click(); assert.equal(f.dialog.open, false);
  assert.equal(f.help.attrs['aria-expanded'], 'false');
  assert.equal(f.doc.body.dataset.appearance, 'kawaii');
});

test('invalid externally supplied appearance is safe and does not save when told not to', () => {
  const f = fakePage();
  assert.equal(setAppearance('garbage', { doc: f.doc, store: f.store, persist: false }), 'simple');
  assert.equal(f.doc.body.dataset.appearance, 'simple');
  assert.equal(f.values.get('appearance'), 'kawaii');
});
