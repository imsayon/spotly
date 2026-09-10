const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const path = require('node:path');
test('signup distinguishes confirmation from an active session in both clients', async () => {
 for (const file of ['consumer-client/src/features/auth/auth.store.ts', 'merchant-client/src/features/auth/auth.store.ts']) {
  let session = null;
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{exports,console,require(name){
   if(name === 'zustand') return {create:()=>init=>init(()=>{},()=>({}))};
   if(name.endsWith('/supabase')) return {supabase:{auth:{signUp:async()=>({data:{session},error:null})}}};
   return {default:{}};
  }});
  assert.equal(await exports.useAuthStore.signUpWithEmail('a@example.test','password'),false);
  session = {user:{id:'example'}};
  assert.equal(await exports.useAuthStore.signUpWithEmail('a@example.test','password'),true);
 }
});
