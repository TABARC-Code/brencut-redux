import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixCut, CTRL, DATA } from '../src/protocol.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

function printer({ hangAck = false, hangWrite = false } = {}) {
  const methods = [];
  const chunks = [];
  const control = [];
  const io = {
    write(ep, data) {
      if (ep === CTRL.out) {
        const cmd = JSON.parse(dec.decode(data).split('\n').slice(1).join('\n'));
        methods.push(cmd.method);
        let result;
        if (cmd.method === 'get-prop') {
          result = cmd.params.map((name) => ({ [name]: ({ 'printer-state': 20, 'printer-sub-state': 2000, 'printer-state-alerts': '::0' })[name] }));
        } else if (cmd.method === 'combo-job') result = [{ 'job-id': 37 }];
        else if (cmd.method === 'cancel-job') result = { accepted: true };
        else result = {};
        control.push(enc.encode(JSON.stringify({ id: cmd.id, result })));
        return Promise.resolve();
      }
      if (ep === DATA.out) {
        chunks.push(data);
        return hangWrite ? new Promise(() => {}) : Promise.resolve();
      }
      throw new Error(`unexpected endpoint ${ep}`);
    },
    read(ep) {
      if (ep === CTRL.in) return Promise.resolve(control.shift() ?? new Uint8Array());
      if (ep === DATA.in) return hangAck ? new Promise(() => {}) : Promise.resolve(enc.encode('OK'));
      throw new Error(`unexpected endpoint ${ep}`);
    },
  };
  return { io, methods, chunks };
}

test('cancel before declaration sends no job', async () => {
  const p = printer();
  const c = new AbortController();
  c.abort();
  await assert.rejects(new PixCut(p.io).printAndCut(new Uint8Array(10), new Uint8Array(10), { signal: c.signal }), /cancelled before/);
  assert.deepEqual(p.methods, []);
});

test('cancel after first chunk sends no more data and cancels once', async () => {
  const p = printer();
  const c = new AbortController();
  await assert.rejects(new PixCut(p.io).printAndCut(new Uint8Array(100), new Uint8Array(12000), {
    signal: c.signal,
    onStatus: (s) => { if (s.phase === 'upload' && s.progress > 0) c.abort(); },
  }), /cancellation sent/);
  assert.equal(p.chunks.length, 1);
  assert.equal(p.methods.filter((m) => m === 'cancel-job').length, 1);
});

test('cancel interrupts a stalled acknowledgement without another data write', async () => {
  const p = printer({ hangAck: true });
  const c = new AbortController();
  setTimeout(() => c.abort(), 20);
  await assert.rejects(new PixCut(p.io).printAndCut(new Uint8Array(100), new Uint8Array(12000), { signal: c.signal }), /cancellation sent/);
  assert.equal(p.chunks.length, 1);
  assert.equal(p.methods.filter((m) => m === 'cancel-job').length, 1);
});

test('cancel interrupts a stalled write and never starts a second one', async () => {
  const p = printer({ hangWrite: true });
  const c = new AbortController();
  setTimeout(() => c.abort(), 20);
  await assert.rejects(new PixCut(p.io).printAndCut(new Uint8Array(100), new Uint8Array(12000), { signal: c.signal }), /cancellation sent/);
  assert.equal(p.chunks.length, 1);
  assert.equal(p.methods.filter((m) => m === 'cancel-job').length, 1);
});
