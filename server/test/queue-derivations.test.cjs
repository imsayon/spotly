const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadStore(file, api) {
  let state;
  const exports = {};
  const init = (factory) => {
    state = factory((patch) => Object.assign(state, patch), () => state);
    return state;
  };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports, console, Date, require(name) {
    if (name === 'zustand') return { create: (factory) => factory ? init(factory) : init };
    if (name.endsWith('/api')) return { default: api };
    return {};
  }});
  return exports;
}

test('production queue position uses outlet and UUID; missing is unknown, never next', () => {
  const { waitingAhead } = loadStore('consumer-client/src/features/queue/queue.store.ts', {});
  const entries = [
    { id: 'north', outletId: 'north', tokenNumber: 45, status: 'WAITING' },
    { id: 'pending', outletId: 'main', tokenNumber: 50, status: 'PENDING_ACCEPTANCE' },
    { id: 'mine', outletId: 'main', tokenNumber: 45, status: 'WAITING' },
    { id: 'called', outletId: 'main', tokenNumber: 41, status: 'CALLED' },
  ];
  assert.equal(waitingAhead(entries, { id: 'mine', outletId: 'main' }), 0);
  assert.equal(waitingAhead(entries, { id: 'missing', outletId: 'main' }), null);
  entries[1].status = 'WAITING';
  assert.equal(waitingAhead(entries, { id: 'mine', outletId: 'main' }), 1);
});

test('merchant store retains snapshot on failure and refuses stale mutations', async () => {
  let writes = 0;
  const { useQueueStore: store } = loadStore('merchant-client/src/features/queue/queue.store.ts', {
    get: async () => { throw new Error('offline'); }, post: async () => { writes++; },
  });
  store.selectedOutletId = 'main';
  store.entries = [{ id: 'mine', status: 'WAITING' }];
  const snapshot = store.entries;
  await store.fetchQueue();
  assert.equal(store.entries, snapshot);
  assert.equal(store.stale, true);
  await store.callNext();
  assert.equal(writes, 0);
});

test('late responses from a previous outlet cannot overwrite the selected queue', async () => {
  let resolve;
  const { useQueueStore: store } = loadStore('merchant-client/src/features/queue/queue.store.ts', { get: () => new Promise((r) => { resolve = r; }) });
  store.selectedOutletId = 'old';
  const read = store.fetchQueue();
  store.selectedOutletId = 'new';
  store.entries = [{ id: 'new-entry' }];
  resolve({ data: { data: [{ id: 'old-entry' }] } });
  await read;
  assert.equal(store.entries[0].id, 'new-entry');
});
