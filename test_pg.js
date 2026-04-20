const { Client } = require('pg');

const url = 'postgresql://postgres.gfzxlonhtgvxojyosskx:Sptly%40Pg_92%21xZ%237Lm@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require';

const client = new Client({ connectionString: url });

client.connect()
  .then(() => {
    console.log('Connected directly via pooler!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Connection failed', e);
    process.exit(1);
  });
