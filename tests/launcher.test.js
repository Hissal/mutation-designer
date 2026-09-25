import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {APP_URL,appArguments,ensureServer,serverStatus,browserCandidates} from '../launch.mjs';
test('app window uses fixed origin and a dedicated profile passed as a single argument',()=>{
 const args=appArguments('C:\\Path With Spaces\\profile');assert.ok(args.includes(`--app=${APP_URL}`));assert.ok(args.includes('--user-data-dir=C:\\Path With Spaces\\profile'));assert.ok(browserCandidates({LOCALAPPDATA:'C:/User'}).length===2);
});
test('an already running app is reused without another server',async()=>{let starts=0;assert.equal(await ensureServer({status:async()=> 'ready',start:async()=>starts++}),'reused');assert.equal(starts,0);});
test('occupied port is rejected without changing the origin or starting a server',async()=>{let starts=0;await assert.rejects(ensureServer({status:async()=> 'occupied',start:async()=>starts++}),/4174/);assert.equal(starts,0);});
test('startup waits until the server is ready',async()=>{let checks=0,starts=0;assert.equal(await ensureServer({status:async()=>++checks<3?'absent':'ready',start:async()=>starts++,wait:async()=>{}}),'started');assert.equal(starts,1);});
test('failed startup reports a bounded timeout',async()=>{await assert.rejects(ensureServer({status:async()=> 'absent',start:async()=>{},wait:async()=>{},attempts:2}),/did not become ready/);});
test('server detection rejects unrelated content and accepts the app document',async()=>{
 let html='Another app';const server=http.createServer((req,res)=>res.end(html));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const url=`http://127.0.0.1:${server.address().port}/`;assert.equal(await serverStatus(url),'occupied');html='<title>Mutation Designer</title><link href="/app/style.css"><script src="/app/controller.js"></script>';assert.equal(await serverStatus(url),'ready');}finally{await new Promise(resolve=>server.close(resolve));}
});
