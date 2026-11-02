const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const { createRequire } = require('node:module');
const ts = require('typescript');
const axios = createRequire(path.resolve(__dirname, '../../consumer-client/package.json'))('axios');

function loadClient(client, baseURL) {
  const exports = {};
  const file = path.resolve(__dirname, `../../${client}/src/lib/api.ts`);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, {
    exports, process: { env: { EXPO_PUBLIC_API_URL: baseURL } },
    require(name) {
      if (name === 'axios') return axios;
      if (name === './env') return { env: { NEXT_PUBLIC_API_URL: baseURL } };
      if (name === './supabase') return { supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } };
      throw Error(`Unexpected import: ${name}`);
    },
  });
  return exports.default;
}

for (const client of ['consumer-client', 'merchant-client', 'mobile-client']) {
  test(`${client}: bounded requests, safe errors and no mutation retry`, async () => {
    let writes = 0;
    const server = http.createServer((req, res) => {
      if (req.method === 'POST') { writes++; return; }
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Already active' } }));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const api = loadClient(client, `http://127.0.0.1:${server.address().port}`);
      assert.equal(api.defaults.timeout, 20_000);
      await assert.rejects(api.get('/conflict'), error => error.response.status === 409 && error.message === 'Already active');
      await assert.rejects(api.post('/queue/join', {}, { timeout: 40 }), /Refresh to check the latest status/);
      assert.equal(writes, 1);
      const abort = new AbortController();
      abort.abort();
      await assert.rejects(api.get('/cancelled', { signal: abort.signal }), error => error.code === 'ERR_CANCELED');
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  });
}
