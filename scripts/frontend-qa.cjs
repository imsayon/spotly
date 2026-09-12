// Production-route rendering with browser-boundary fixtures. No live auth or writes.
// Start static exports on ports 4100/4102; run with Playwright available on NODE_PATH.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const now = new Date().toISOString();
const user = { id: '00000000-0000-4000-8000-000000000001', email: 'review@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Sam' }, created_at: now };
const outlets = [{ id: 'o1', merchantId: 'm1', name: 'Main outlet', address: '12 Main Street', isActive: true, openTime: '09:00', closeTime: '21:00', timezone: 'Asia/Kolkata', lat: 12.97, lng: 77.59 }, { id: 'o2', merchantId: 'm1', name: 'North outlet', address: '8 North Road', isActive: false, openTime: '10:00', closeTime: '20:00', timezone: 'Asia/Kolkata' }];
const merchant = { id: 'm1', ownerId: user.id, name: 'Corner House', category: 'Coffee', description: 'Your neighborhood coffee shop. Drop in for a good cup and a little time to yourself.', address: '12 Main Street', phone: '+919999999999', lat: 12.97, lng: 77.59, outlets };
const entries = [['e1', 41, 'CALLED'], ['e2', 42, 'WAITING'], ['e3', 43, 'WAITING'], ['e4', 44, 'PENDING_ACCEPTANCE']].map(([id, tokenNumber, status]) => ({ id, tokenNumber, status, outletId: 'o1', userId: user.id, createdAt: now, outlet: outlets[0] }));
const fixtures = {
  '/user/me': { ...user, name: 'Sam', location: 'Bengaluru', phone: '+919999999999', role: 'CONSUMER' },
  '/merchant/me': merchant, '/merchant/m1': merchant,
  '/merchant': [merchant, { ...merchant, id: 'm2', name: 'Northside Studio', category: 'Services', outlets: [] }, { ...merchant, id: 'm3', name: 'Riverside Care', category: 'Health', outlets: [] }],
  '/outlet/merchant/m1': outlets, '/outlet/o1': outlets[0],
  '/queue/active': entries[1], '/queue/entry/e2': entries[1], '/queue/outlet/o1': entries,
  '/queue/outlet/o1/history': entries, '/queue/history': entries, '/queue/outlet/o2': [],
  '/favorite': [{ id: 'f1', outletId: 'o1', outlet: { ...outlets[0], merchant } }],
  '/menu/outlet/o1': [{ id: 'c1', name: 'Coffee', outletId: 'o1', items: [{ id: 'i1', categoryId: 'c1', name: 'Flat white', description: 'Double espresso, silky milk.', price: 180, isAvailable: true }] }],
  '/review/outlet/o1/stats': { avgRating: 4.5, count: 2 },
  '/review/outlet/o1': [5, 4].map((rating, i) => ({ id: `r${i}`, userId: i ? 'other' : user.id, outletId: 'o1', rating, comment: 'A lovely corner of the neighborhood.', createdAt: now, user: { name: i ? 'Alex' : 'Sam' } })),
};
const suites = [
  ['consumer', 4100, ['/home', '/merchant?id=m1&outletId=o1', '/home/queue?entryId=e2', '/home/favorites', '/home/profile']],
  ['merchant', 4102, ['/dashboard', '/dashboard/outlets', '/dashboard/outlets/detail?id=o1', '/dashboard/inventory', '/dashboard/analytics', '/dashboard/settings', '/dashboard/business', '/dashboard/settings/reviews']],
];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  fs.mkdirSync('docs/frontend-design/qa', { recursive: true });
  try {
    for (const [role, port, routes] of suites) {
      const env = fs.readFileSync(`${role}-client/.env.local`, 'utf8');
      const authUrl = env.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)?.[1];
      assert(authUrl, 'Local public Supabase URL is required');
      const storageKey = `sb-${new URL(authUrl).hostname.split('.')[0]}-auth-token`;
      const context = await browser.newContext();
      await context.addInitScript(({ user, storageKey }) => {
        const b64 = value => btoa(JSON.stringify(value)).replace(/=/g, '');
        localStorage.setItem(storageKey, JSON.stringify({ access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`, refresh_token: 'fixture', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user }));
      }, { user, storageKey });
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.hostname === 'localhost' && ['4100', '4102'].includes(url.port)) {
          // Python static server doesn't resolve Next's extensionless exports.
          if (route.request().isNavigationRequest() && url.pathname !== '/' && !url.pathname.includes('.')) {
            const response = await route.fetch({ url: `${url.origin}${url.pathname}.html${url.search}` });
            return route.fulfill({ response });
          }
          return route.continue();
        }
        if (url.pathname.includes('/auth/v1/')) return route.fulfill({ json: { user } });
        const path = url.pathname.split('/api/v1')[1];
        if (route.request().method() === 'GET' && Object.hasOwn(fixtures, path)) return route.fulfill({ json: { data: fixtures[path] } });
        return route.fulfill({ status: 503, json: { message: 'Offline fixture: no external request was made' } });
      });
      const page = await context.newPage();
      let errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const width of [360, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const path of routes) {
          errors = [];
          await page.goto(`http://localhost:${port}${path}`);
          await page.waitForTimeout(500);
          await page.locator('h1').first().waitFor();
          await page.evaluate(() => document.fonts.ready);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
          const headings = await page.locator('h1').allTextContents();
          const result = { role, path, width, overflow, errors: [...errors], headings };
          results.push(result);
          if (overflow) { console.log(await page.evaluate(() => [...document.querySelectorAll("body *")].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right })).slice(-15))); await page.screenshot({path: "docs/frontend-design/qa/overflow.png", fullPage: true}); }
          assert.equal(overflow, false, JSON.stringify(result));
          assert.deepEqual(errors, [], JSON.stringify(result));
          if (width !== 768) await page.screenshot({ path: `docs/frontend-design/qa/final-${role}-${path.replace(/\W+/g, '-')}-${width}.png`, fullPage: true });
          if (role === 'merchant' && width === 360 && path === '/dashboard') {
            await page.getByRole('button', { name: 'Open navigation' }).click();
            assert.equal(await page.getByRole('dialog').isVisible(), true);
            await page.keyboard.press('Escape');
            assert.equal(await page.getByRole('dialog').isVisible(), false);
          }
        }
      }
      await context.close();
    }
  } finally {
    fs.writeFileSync('docs/frontend-design/qa/final-render-results.json', JSON.stringify(results, null, 2));
    await browser.close();
  }
  console.log(`PASS: ${results.length} production-route renders; mobile navigation opens and closes with Escape. Fixtures only.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
