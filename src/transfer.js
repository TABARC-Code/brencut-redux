// USB transfers cannot be unwritten. Stop queuing new ones as soon as the job is cancelled.
export function checkCancel(signal) {
  if (!signal?.aborted) return;
  const error = new Error('job cancellation requested');
  error.name = 'AbortError';
  throw error;
}

export function waitFor(promise, { signal, timeoutMs, label = 'USB operation' } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const finish = (value, failed) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancelled);
      if (failed) reject(value);
      else resolve(value);
    };
    const cancelled = () => {
      const error = new Error('job cancellation requested');
      error.name = 'AbortError';
      finish(error, true);
    };
    if (signal?.aborted) { cancelled(); return; }
    signal?.addEventListener('abort', cancelled, { once: true });
    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
      timer = setTimeout(() => finish(new Error(`${label} timed out after ${timeoutMs} ms`), true), timeoutMs);
    }
    Promise.resolve(promise).then((value) => finish(value, false), (error) => finish(error, true));
  });
}

export function pause(ms, signal) {
  checkCancel(signal);
  return waitFor(new Promise((resolve) => setTimeout(resolve, ms)), { signal });
}
