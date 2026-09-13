const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('reflect-metadata');
const { QueueService } = require('../dist/modules/queue/queue.service');
const { MenuService } = require('../dist/modules/menu/menu.service');
const { OutletService } = require('../dist/modules/outlet/outlet.service');
const { UserService } = require('../dist/modules/user/user.service');
const { MerchantService } = require('../dist/modules/merchant/merchant.service');
const { ReviewService } = require('../dist/modules/review/review.service');
const { LocationService } = require('../dist/modules/location/location.service');
const { QueueGateway } = require('../dist/modules/queue/queue.gateway');
const { MerchantController } = require('../dist/modules/merchant/merchant.controller');
const { ZodValidationPipe } = require('../dist/shared/pipes/zod-validation.pipe');
const { CreateMerchantDtoSchema, CreateOutletDtoSchema, UpdateUserProfileDtoSchema, UpdateMenuItemDtoSchema, VerificationTokenDtoSchema } = require('@spotly/types');

test('production static clients use the versioned API and bare websocket origins', () => {
  const blueprint = fs.readFileSync(path.resolve(__dirname, '../../render.yaml'), 'utf8');
  const apiValues = [...blueprint.matchAll(/key: NEXT_PUBLIC_API_URL\n\s+value: (.+)/g)].map((match) => match[1].trim());
  const wsValues = [...blueprint.matchAll(/key: NEXT_PUBLIC_WS_URL\n\s+value: (.+)/g)].map((match) => match[1].trim());
  assert.deepEqual(apiValues, ['https://spotly-api-d1dr.onrender.com/api/v1', 'https://spotly-api-d1dr.onrender.com/api/v1']);
  assert.deepEqual(wsValues, ['https://spotly-api-d1dr.onrender.com', 'https://spotly-api-d1dr.onrender.com']);
});

test('request validation removes privilege and ownership injection', () => {
  const pipe = new ZodValidationPipe(CreateMerchantDtoSchema);
  assert.deepEqual(pipe.transform({ name: 'Shop', category: 'Services', ownerId: 'victim', verified: true }, { type: 'body' }), { name: 'Shop', category: 'Services' });
  assert.throws(() => pipe.transform({ name: '', category: 'Services' }, { type: 'body' }));
  assert.equal(UpdateUserProfileDtoSchema.parse({ role: 'ADMIN' }).role, undefined);
  assert.throws(() => UpdateUserProfileDtoSchema.parse({ lat: null, lng: 1 }));
  assert.throws(() => CreateOutletDtoSchema.parse({ merchantId: '00000000-0000-0000-0000-000000000000', name: 'Shop', lat: 1 }));
  assert.throws(() => VerificationTokenDtoSchema.parse({ token: 'short', outletId: '00000000-0000-0000-0000-000000000000' }));
  assert.throws(() => VerificationTokenDtoSchema.parse({ token: 'A'.repeat(43), outletId: 'not-an-id' }));
});

test('registration uses verified identity and does not promote roles', async () => {
  let args;
  const service = new UserService({ user: { upsert: async (value) => { args = value; return value.create; } } });
  await service.register({ id: 'verified', email: 'person@example.test', user_metadata: { role: 'ADMIN', full_name: ' Person ' } });
  assert.equal(args.create.id, 'verified');
  assert.equal(args.create.name, 'Person');
  assert.equal(args.create.role, undefined);
  assert.equal(args.update.role, undefined);
});

test('a different merchant cannot update a business', async () => {
  let writes = 0;
  const service = new MerchantService({ merchant: { findFirst: async () => null, update: async () => writes++ } });
  await assert.rejects(service.update('business', { name: 'Hijacked' }, 'intruder'), /do not own/);
  assert.equal(writes, 0);
});

test('merchant onboarding treats a missing business as a 404', async () => {
  const controller = new MerchantController({ findByOwner: async () => null });
  await assert.rejects(
    controller.getMyMerchant('owner'),
    (error) => error?.status === 404 && error?.message === 'Business not found',
  );
});

test('public merchant results keep outlet location fields for map discovery', async () => {
  let query;
  const service = new MerchantService({ merchant: { findMany: async (args) => { query = args; return []; } } });
  await service.findAll();
  assert.deepEqual(query.select.outlets.select, {
    id: true,
    name: true,
    address: true,
    lat: true,
    lng: true,
    isActive: true,
    openTime: true,
    closeTime: true,
  });
  assert.deepEqual(query.select.outlets.where, { isActive: true });
});

test('reviews require a served visit and public review reads omit account ids', async () => {
  const denied = new ReviewService({ queueEntry: { findFirst: async () => null } });
  await assert.rejects(
    denied.create('consumer', { outletId: 'outlet', rating: 5 }),
    /served visit/,
  );

  let query;
  const allowed = new ReviewService({
    queueEntry: { findFirst: async () => ({ id: 'visit' }) },
    review: {
      upsert: async (args) => args,
      findMany: async (args) => { query = args; return []; },
    },
  });
  await allowed.create('consumer', { outletId: 'outlet', rating: 5 });
  await allowed.getOutletReviews('outlet');
  assert.equal(query.select.userId, undefined);
  assert.equal(query.select.user.select.name, true);
});

test('reverse geocoding rejects coordinates outside the world', async () => {
  const service = new LocationService();
  await assert.rejects(service.reverse(91, 0), /valid map coordinates/);
  await assert.rejects(service.reverse(0, 181), /valid map coordinates/);
});

test('queue websocket rejects clients without a verified access token', async () => {
  let disconnected = false;
  await new QueueGateway({}, undefined).handleConnection({
    id: 'socket',
    handshake: { auth: {}, headers: {} },
    disconnect: () => { disconnected = true; },
  });
  assert.equal(disconnected, true);
});

test('menu item edits are owner checked and limited to editable fields', async () => {
  assert.deepEqual(UpdateMenuItemDtoSchema.parse({ name: '  Espresso  ', description: '', price: 3.5 }), { name: 'Espresso', description: '', price: 3.5 });
  assert.throws(() => UpdateMenuItemDtoSchema.parse({ price: -1 }));
  assert.throws(() => UpdateMenuItemDtoSchema.parse({ categoryId: 'other' }));

  let updated = false;
  const service = new MenuService({
    menuItem: {
      findUnique: async () => ({ id: 'item', category: { outletId: 'outlet' } }),
      update: async ({ data }) => { updated = data; return { id: 'item', ...data }; },
    },
    assertOutletOwner: async (_outlet, user) => { if (user !== 'owner') throw Error('Forbidden'); },
  });
  await assert.rejects(service.updateItem('item', { name: 'Updated' }, 'intruder'), /Forbidden/);
  assert.equal(updated, false);
  assert.deepEqual(await service.updateItem('item', { name: 'Updated' }, 'owner'), { id: 'item', name: 'Updated' });
  assert.deepEqual(updated, { name: 'Updated' });
});

test('outlet deletion requires a paused queue with no active entries', async () => {
  const paused = { id: 'outlet', isActive: false, merchant: { ownerId: 'owner' } };
  const deleted = new OutletService({
    $transaction: async (work, options) => work({
      outlet: { findUnique: async () => paused, delete: async () => ({ id: 'outlet' }) },
      queueEntry: { findFirst: async () => null },
    }, options),
  });
  const result = await deleted.remove('outlet', 'owner');
  assert.deepEqual(result, { id: 'outlet' });

  await assert.rejects(new OutletService({ $transaction: async (work, options) => work({ outlet: { findUnique: async () => ({ ...paused, isActive: true }), delete: async () => ({}) }, queueEntry: { findFirst: async () => null } }, options) }).remove('outlet', 'owner'), /Pause this outlet/);
  await assert.rejects(new OutletService({ $transaction: async (work, options) => work({ outlet: { findUnique: async () => paused, delete: async () => ({}) }, queueEntry: { findFirst: async () => ({ id: 'entry' }) } }, options) }).remove('outlet', 'owner'), /active queue entries/);
});

test('queue actions require owner and a valid previous status', async () => {
  let write;
  const db = {
    assertOutletOwner: async (outlet, user) => { if (user !== 'owner') throw Error('Forbidden'); },
    queueEntry: { findMany: async () => [], updateMany: async (args) => { write = args; return { count: 0 }; } },
  };
  const service = new QueueService(db, { emit() {} });
  await assert.rejects(service.markServed('entry', 'outlet', 'intruder'), /Forbidden/);
  assert.equal(write, undefined);
  await assert.rejects(service.markServed('entry', 'outlet', 'owner'), /no longer available/);
  assert.deepEqual(write.where.status.in, ['CALLED']);
  assert.deepEqual(write.where.verificationUsedAt, { not: null });
});

test('verification tokens are opaque, short lived and stored only as digests', async () => {
  let write;
  const service = new QueueService({
    queueEntry: {
      findFirst: async () => ({ id: 'entry', outletId: 'outlet', tokenNumber: 7 }),
      updateMany: async (args) => { write = args; return { count: 1 }; },
    },
  }, { emit() {} });
  const result = await service.issueVerification('consumer', 'session');
  assert.match(result.token, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(write.data.verificationTokenDigest, result.token);
  assert.equal(write.data.verificationSessionId, 'session');
  assert.ok(write.data.verificationExpiresAt.getTime() > Date.now());

  let redeemQuery;
  const redeeming = new QueueService({
    queueEntry: {
      findFirst: async (args) => { redeemQuery = args; return { id: 'entry', outletId: 'outlet', tokenNumber: 7, outlet: { merchant: { ownerId: 'owner' } } }; },
      updateMany: async () => ({ count: 1 }),
      findMany: async () => [],
    },
  }, { emit() {} });
  await redeeming.redeemVerification(result.token, 'outlet', 'owner');
  assert.equal(redeemQuery.where.outletId, 'outlet');
});

test('calling next refuses to replace an already called customer', async () => {
  const db = { assertOutletOwner: async () => {}, $transaction: async (work, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return work({ queueEntry: { findFirst: async () => ({ id: 'called' }) } });
  } };
  await assert.rejects(new QueueService(db, { emit() {} }).advanceQueue('outlet', 'owner'), /Complete the called/);
});

test('outlet history requires ownership before querying customer activity', async () => {
  let queried = false;
  const service = new QueueService({
    assertOutletOwner: async () => { throw Error('Forbidden'); },
    $queryRaw: async () => { queried = true; },
  }, {});
  await assert.rejects(service.getOutletHistory('outlet', 'intruder'), /Forbidden/);
  assert.equal(queried, false);
});
