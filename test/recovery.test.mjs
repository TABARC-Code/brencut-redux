import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixCut, CTRL, DATA } from '../src/protocol.js';
import { openPrinter } from '../src/webusb.js';

const enc = new TextEncoder();
const dec = new TextDecoder();
function mock({ failStatusOnce = false, alwaysDisconnect = false, processing = false } = {}) {
  const queue = [], commands = [], data = [];
  let statusCount = 0, disconnected = false;
  const io = {
    async write(ep, bytes) {
      if (ep === DATA.out) { data.push(bytes); return; }
      const cmd = JSON.parse(dec.decode(bytes).split('\n').slice(1).join('\n'));
      commands.push(cmd.method);
      if (disconnected) throw new Error('USB disconnected');
      if (cmd.method === 'get-prop') statusCount++;
      const values = { 'printer-state': 20, 'printer-sub-state': 2000, 'printer-state-alerts': '::0' };
      const result = cmd.method === 'get-prop' ? cmd.params.map(k => ({ [k]: values[k] }))
        : cmd.method === 'combo-job' ? [{ 'job-id': 88 }]
        : cmd.method === 'get-job-info' ? { 'job-state': processing ? 3 : 9, 'job-sub-state': processing ? 3001 : 9000 }
        : {};
      queue.push(enc.encode(JSON.stringify({ id: cmd.id, result })));
      if (alwaysDisconnect && statusCount > 1) disconnected = true;
    },
    async read(ep) {
      if (ep === DATA.in) return enc.encode('OK');
      if (failStatusOnce && statusCount === 2) {
        statusCount++;
        queue.shift();
        throw new Error('temporary status read failure');
      }
      if (disconnected) throw new Error('USB disconnected');
      return queue.shift() ?? new Uint8Array();
    },
  };
  return { io, commands, data };
}

test('a stalled control read is bounded', async () => {
  const px = new PixCut({ write: async () => {}, read: () => new Promise(() => {}) }, () => {}, { requestTimeoutMs: 15 });
  await assert.rejects(px.request('get-prop', []), /timed out/);
});

test('a stalled data acknowledgement never causes a blind resend', async () => {
  const writes = [];
  const px = new PixCut({ write: async (_ep, bytes) => { writes.push(bytes); }, read: () => new Promise(() => {}) });
  await assert.rejects(px.upload(new Uint8Array(9000), 4, () => {}, { chunkTimeoutMs: 15 }), /timed out/);
  assert.equal(writes.length, 1);
});

test('one missed status report recovers without resending data', async () => {
  const p = mock({ failStatusOnce: true });
  const px = new PixCut(p.io);
  const result = await px.printAndCut(new Uint8Array(20), new Uint8Array(20), { pollIntervalMs: 5, runTimeoutMs: 1000 });
  assert.equal(result.jobId, 88);
  assert.equal(p.data.length, 2);
  assert.equal(p.commands.filter(m => m === 'cancel-job').length, 0);
  assert.equal(px.needsReconnect, false);
});

test('an unfinished job times out and requires reconnecting', async () => {
  const p = mock({ processing: true });
  const px = new PixCut(p.io);
  await assert.rejects(px.printAndCut(new Uint8Array(20), new Uint8Array(20), { pollIntervalMs: 5, runTimeoutMs: 35 }), /run timeout/);
  assert.equal(p.commands.filter(m => m === 'cancel-job').length, 1);
  assert.equal(px.needsReconnect, true);
  await assert.rejects(px.printAndCut(new Uint8Array(20), new Uint8Array(20)), /Reconnect the printer/);
});

test('disconnect wakes a blocked WebUSB reader', async () => {
  const dev = {
    configuration: { configurationValue: 1 },
    open: async () => {},
    claimInterface: async () => {},
    transferIn: () => new Promise(() => {}),
    transferOut: async () => ({ status: 'ok' }),
    close: async () => {},
  };
  const { io, close } = await openPrinter(dev);
  const pending = io.read(CTRL.in, 4096, 5000);
  await close();
  await assert.rejects(pending, /USB connection closed/);
});
