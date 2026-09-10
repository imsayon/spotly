const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { QueueService } = require('../dist/modules/queue/queue.service');
const { UserService } = require('../dist/modules/user/user.service');
const { MerchantService } = require('../dist/modules/merchant/merchant.service');
const { ZodValidationPipe } = require('../dist/shared/pipes/zod-validation.pipe');
const { CreateMerchantDtoSchema, UpdateUserProfileDtoSchema } = require('@spotly/types');

test('request validation removes privilege and ownership injection', () => {
  const pipe = new ZodValidationPipe(CreateMerchantDtoSchema);
  assert.deepEqual(pipe.transform({ name: 'Shop', category: 'Services', ownerId: 'victim', verified: true }, { type: 'body' }), { name: 'Shop', category: 'Services' });
  assert.throws(() => pipe.transform({ name: '', category: 'Services' }, { type: 'body' }));
  assert.equal(UpdateUserProfileDtoSchema.parse({ role: 'ADMIN' }).role, undefined);
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
});

test('calling next refuses to replace an already called customer', async () => {
  const db = { assertOutletOwner: async () => {}, $transaction: async (work, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return work({ queueEntry: { findFirst: async () => ({ id: 'called' }) } });
  } };
  await assert.rejects(new QueueService(db, { emit() {} }).advanceQueue('outlet', 'owner'), /Complete the called/);
});
