import test from 'node:test';
import assert from 'node:assert/strict';
import {createMutation,duplicate,applicableEffects,jsonExport,parseImport,markdownExport,planImport,resolveImport,rerollSlots,filterMutations} from '../app/model.js';
import {createSaveQueue} from '../app/storage.js';
const image='data:image/png;base64,aGVsbG8=';
const sample=()=>createMutation({name:'Hollow Bones',positiveTitle:'Light',positive:'Move faster.',negativeTitle:'Fragile',negative:'Take more damage.',notes:'Internal question',tags:['bones'],image,visual:'upload'});
test('JSON round trip preserves IDs, images, icon, notes and timestamps',()=>{
 const original=sample();assert.deepEqual(parseImport(jsonExport([original])),[original]);
});
test('malformed and unsupported imports are rejected before mutation',()=>{
 const m=sample();
 for(const file of ['bad','{}',JSON.stringify({format:'mutation-designer',schemaVersion:2,mutations:[m]}),JSON.stringify({format:'mutation-designer',schemaVersion:1,mutations:[m,m]}),JSON.stringify({format:'mutation-designer',schemaVersion:1,mutations:[{...m,image:'https://remote.invalid/image.png'}]})])assert.throws(()=>parseImport(file));
});
test('conflicts require explicit decisions and each resolution preserves intended data',()=>{
 const local=sample(),incoming={...local,positive:'Fly instead.'},other=createMutation({name:'Another'});const plan=planImport([local],[incoming,other]);
 assert.deepEqual(plan.map(p=>p.type),['conflict','new']);assert.throws(()=>resolveImport([local],plan,{}));
 assert.equal(resolveImport([local],plan,{[local.id]:'keep'})[0].positive,local.positive);
 assert.equal(resolveImport([local],plan,{[local.id]:'replace'})[0].positive,incoming.positive);
 const copied=resolveImport([local],plan,{[local.id]:'copy'});assert.equal(copied.length,3);assert.equal(copied[0].positive,local.positive);assert.notEqual(copied[1].id,local.id);assert.equal(copied[1].positive,incoming.positive);assert.equal(local.positive,'Move faster.');
});
test('identical definitions with different edit timestamps do not create a conflict',()=>{const m=sample();assert.equal(planImport([m],[{...m,updatedAt:'2020-01-01T00:00:00Z'}])[0].type,'identical');});
test('Markdown omits notes when requested and never embeds image payloads',()=>{const m=sample(),text=markdownExport([m],{includeNotes:false});assert.ok(!text.includes(m.notes));assert.ok(!text.includes(image));assert.ok(text.includes('### Positive effect'));assert.ok(text.includes('### Negative effect'));assert.ok(!text.includes('### States'));assert.ok(!text.includes('| State |'));assert.ok(markdownExport([m]).includes(m.notes));});
test('states include exactly the applicable effects',()=>{const m=sample();assert.deepEqual(applicableEffects(m,'Stable').map(x=>x.polarity),['positive']);assert.deepEqual(applicableEffects(m,'Unstable').map(x=>x.polarity),['positive','negative']);assert.deepEqual(applicableEffects(m,'Corrupt').map(x=>x.polarity),['negative']);});
test('copies use a new stable identity and independent tags',()=>{const m=sample(),copy=duplicate(m);assert.notEqual(copy.id,m.id);copy.tags.push('new');assert.deepEqual(m.tags,['bones']);assert.equal(copy.workflow,'Idea');});
test('rerolls preserve out-of-filter locks, avoid duplicates and fill small pools honestly',()=>{
 const ms=Array.from({length:6},(_,i)=>createMutation({name:`M${i}`}));let slots=ms.slice(0,3).map((m,i)=>({id:m.id,state:['Stable','Unstable','Corrupt'][i],locked:i===0}));
 for(let i=0;i<30;i++){const next=rerollSlots(slots,ms,'mutations');assert.deepEqual(next[0],slots[0]);assert.equal(new Set(next.map(s=>s.id)).size,3);assert.ok(next[1].id!==slots[1].id&&next[2].id!==slots[2].id);assert.deepEqual(next.map(s=>s.state),slots.map(s=>s.state));slots=next;}
 const small=rerollSlots(slots,[ms[4]],'both');assert.deepEqual(small[0],slots[0]);assert.equal(small.filter(s=>s.id).length,2);
 const empty=rerollSlots(slots,[],'both');assert.deepEqual(empty[0],slots[0]);assert.equal(empty.filter(s=>s.id).length,1);
});
test('archived mutations excluded by default but available in archive and all filters',()=>{const m=createMutation({workflow:'Archived'});assert.equal(filterMutations([m]).length,0);assert.equal(filterMutations([m],{workflow:'all'}).length,1);assert.equal(filterMutations([m],{workflow:'Archived'}).length,1);});
const turn=()=>new Promise(resolve=>setImmediate(resolve));
test('save queue serializes writes and never reports newer changes saved prematurely',async()=>{
 const writes=[],resolvers=[],statuses=[];const queue=createSaveQueue(data=>{writes.push(data);return new Promise(resolve=>resolvers.push(resolve));},s=>statuses.push(s.phase));
 queue.enqueue({value:1});queue.enqueue({value:2});queue.enqueue({value:3});assert.equal(writes.length,1);assert.ok(queue.isDirty());resolvers.shift()();await turn();assert.deepEqual(writes,[{value:1},{value:3}]);assert.ok(queue.isDirty());assert.ok(!statuses.includes('saved'));resolvers.shift()();await turn();assert.ok(!queue.isDirty());assert.equal(statuses.at(-1),'saved');
});
test('failed saves remain dirty and can be retried without losing data',async()=>{
 let fail=true;const writes=[],statuses=[];const queue=createSaveQueue(async data=>{if(fail)throw new Error('Quota exceeded');writes.push(data);},s=>statuses.push(s.phase));queue.enqueue({value:42});await turn();assert.ok(queue.isDirty());assert.equal(statuses.at(-1),'error');fail=false;queue.retry();await turn();assert.ok(!queue.isDirty());assert.deepEqual(writes,[{value:42}]);assert.equal(statuses.at(-1),'saved');
});
