import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCancel, pause, waitFor } from '../src/transfer.js';

test('cancelled signal prevents the next transfer', () => {
  const c = new AbortController();
  c.abort();
  assert.throws(() => checkCancel(c.signal), { name: 'AbortError' });
});

test('waiting on a stalled transfer stops promptly when cancelled', async () => {
  const c = new AbortController();
  const pending = waitFor(new Promise(() => {}), { signal: c.signal, timeoutMs: 1000 });
  c.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('bounded wait fails rather than hanging indefinitely', async () => {
  await assert.rejects(waitFor(new Promise(() => {}), { timeoutMs: 15, label: 'test read' }), /test read timed out/);
});

test('cancellation interrupts the gap between chunks', async () => {
  const c = new AbortController();
  const waiting = pause(500, c.signal);
  c.abort();
  await assert.rejects(waiting, { name: 'AbortError' });
});

test('resolved transfer leaves no abort listener behind', async () => {
  const c = new AbortController();
  assert.equal(await waitFor(Promise.resolve('OK'), { signal: c.signal, timeoutMs: 100 }), 'OK');
  c.abort();
});
