const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
require('reflect-metadata');
const { PrismaService } = require('../dist/infra/prisma/prisma.service');

test('database acquisition is bounded when a server accepts TCP but never responds', { timeout: 8000 }, async t => {
  const sockets = new Set();
  const server = net.createServer(socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `postgresql://test:test@127.0.0.1:${server.address().port}/test`;
  const db = new PrismaService();
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await db.$disconnect();
    await new Promise(resolve => server.close(resolve));
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });
  const started = Date.now();
  await assert.rejects(db.$queryRawUnsafe('SELECT 1'), /timeout|timed out/i);
  assert.ok(Date.now() - started < 7000);
});
