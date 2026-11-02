const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const QRCode = createRequire(path.resolve(__dirname, '../../mobile-client/package.json'))('qrcode');

// Run the real component's callbacks and state without a native renderer or production writes.
function screen(post) {
  const state = [];
  let cursor = 0, focusCleanup, effect, tick;
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const file = path.resolve(__dirname, '../../mobile-client/src/features/queue/VerificationQr.tsx');
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, {
    exports, AbortController, Date,
    setInterval: callback => { tick = callback; return 1; }, clearInterval() {},
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react') return {
        useState(initial) { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
        useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
        useCallback: fn => fn, useEffect: fn => { effect = fn; },
      };
      if (name === 'expo-router') return { useFocusEffect: fn => { focusCleanup = fn(); } };
      if (name === 'react-native') return { Text: 'Text', View: 'View', StyleSheet: { create: x => x }, useWindowDimensions: () => ({ width: 360 }) };
      if (name === 'qrcode') return { default: QRCode };
      if (name.endsWith('/api')) return { default: { post } };
      if (name === '../ui') return { Button: 'Button', Card: 'Card', Notice: 'Notice', colors: {}, errorMessage: error => error.message };
      throw Error(name);
    },
  });
  const render = () => { cursor = 0; const tree = exports.VerificationQr({ entryId: 'mine' }); effect(); return tree; };
  return { render, blur: () => focusCleanup(), tick: () => tick?.(), state };
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...[tree.props?.children].flat(Infinity).flatMap(child => nodes(child, predicate))];
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const qr = tree => nodes(tree, node => node.props?.accessibilityLabel?.startsWith('One-time verification QR'));
const button = tree => nodes(tree, node => node.type === 'Button')[0];

test('native verification displays only the current, unexpired ticket QR and clears it on blur', async () => {
  const expiry = new Date(Date.now() + 90_000).toISOString();
  const ui = screen(async () => ({ data: { data: { entryId: 'mine', token: 'A'.repeat(43), expiresAt: expiry } } }));
  button(ui.render()).props.onPress();
  await flush();
  assert.equal(qr(ui.render()).length, 1);
  // The displayed code must become unusable on expiry, even before leaving this screen.
  ui.state[0].expiresAt = new Date(Date.now() - 1).toISOString();
  ui.tick();
  assert.equal(qr(ui.render()).length, 0);
  ui.blur();
  assert.equal(ui.state[0], null);
});

test('native verification rejects a different ticket and supports retry after an API failure', async () => {
  let attempt = 0;
  const ui = screen(async () => {
    if (++attempt === 1) throw Error('offline');
    return { data: { data: { entryId: 'someone-else', token: 'A'.repeat(43), expiresAt: new Date(Date.now() + 90_000).toISOString() } } };
  });
  button(ui.render()).props.onPress();
  await flush();
  assert.equal(ui.state[2], 'offline');
  button(ui.render()).props.onPress();
  await flush();
  assert.match(ui.state[2], /ticket changed/);
  assert.equal(qr(ui.render()).length, 0);
});
