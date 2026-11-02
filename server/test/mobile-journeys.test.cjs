const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function nativeScreen(file, api, initial = []) {
  const state = [...initial], callbacks = [], navigation = [], alerts = [];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  const source = fs.readFileSync(path.resolve(__dirname, '../../mobile-client/src/features', file), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, Date, setInterval, clearInterval,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react') return {
        useState(initial) { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
        useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
        useCallback(fn) { callbacks.push(fn); return fn; }, useMemo: fn => fn(),
      };
      if (name === 'expo-router') return { useFocusEffect() {}, useLocalSearchParams: () => ({ outletId: 'outlet' }), useRouter: () => ({ push: target => navigation.push(target) }) };
      if (name === 'react-native') return { Text: 'Text', View: 'View', Pressable: 'Pressable', StyleSheet: { create: x => x }, Alert: { alert: (...args) => alerts.push(args) } };
      if (name.endsWith('/api')) return { default: api };
      if (name.endsWith('/AuthProvider')) return { useAuth: () => ({ user: { id: 'user' }, loading: false, identityError: null }) };
      if (name.endsWith('/VerificationQr')) return { VerificationQr: 'VerificationQr' };
      if (name === '../ui') return { Button: 'Button', Card: 'Card', Notice: 'Notice', PageFrame: 'PageFrame', LoadingState: 'LoadingState', colors: {}, errorMessage: e => e.message, pageTitle: () => null };
      throw Error(name);
    },
  });
  const tree = exports.default();
  const buttons = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Button') buttons.push(node.props);
    [node.props?.children].flat(Infinity).forEach(visit);
  }
  visit(tree);
  return { state, callbacks, navigation, alerts, buttons };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const outletState = () => [{ id: 'outlet', isActive: true, name: 'Outlet', merchant: { name: 'Business' }, menuCategories: [] }, [], null, false, false, false];

test('mobile join reconciles a lost response without submitting a second request', async () => {
  let writes = 0;
  const ui = nativeScreen('outlet/OutletScreen.tsx', {
    post: async () => { writes++; throw Error('timeout'); },
    get: async () => ({ data: { data: { id: 'committed-ticket' } } }),
  }, outletState());
  ui.buttons.find(button => button.label === 'Request a spot').onPress();
  await flush();
  assert.equal(writes, 1);
  assert.equal(ui.navigation[0].pathname, '/queue');
  assert.equal(ui.navigation[0].params.entryId, 'committed-ticket');
  assert.equal(ui.alerts.length, 0);
});

test('mobile join stays blocked while the existing ticket is unknown', () => {
  const initial = outletState(); initial[5] = true;
  let writes = 0;
  const ui = nativeScreen('outlet/OutletScreen.tsx', { post: () => { writes++; } }, initial);
  const join = ui.buttons.find(button => button.label === 'Request a spot');
  assert.equal(join.disabled, true);
  join.onPress();
  assert.equal(writes, 0);
});

test('mobile background polling cannot overtake an in-flight ticket read', async () => {
  let reads = 0, finish;
  const ui = nativeScreen('queue/QueueScreen.tsx', { get: () => { reads++; return new Promise(resolve => { finish = resolve; }); } });
  const load = ui.callbacks[0];
  const first = load();
  await load(true);
  assert.equal(reads, 1);
  finish({ data: { data: null } });
  await first;
  const next = load(true);
  assert.equal(reads, 2);
  finish({ data: { data: null } });
  await next;
});
