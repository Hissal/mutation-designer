export const STATES = ['Stable','Unstable','Corrupt'];
export const WORKFLOWS = ['Idea','Developing','Ready','Archived'];
export const ICON_NAMES = {bones:'Bones',heart:'Heart',lungs:'Lungs',eye:'Eye',spine:'Spine',teeth:'Teeth',brain:'Brain',skull:'Skull',hand:'Hand',stomach:'Stomach',muscle:'Muscle',skin:'Skin'};
export const TEXT_FIELDS=['name','body','positiveTitle','positive','negativeTitle','negative','notes'];
export const DEFAULT_PREFERENCES={libraryView:'cards',entrySize:'large',previewLayout:'columns',rollerLayout:'columns'};
export function title(m){return m?.name.trim() || 'Untitled mutation';}
export function createMutation(overrides={}){
  const now=new Date().toISOString();
  return {id:crypto.randomUUID(),name:'',kind:'bones',visual:'icon',workflow:'Idea',tags:[],body:'',positiveTitle:'',positive:'',negativeTitle:'',negative:'',notes:'',image:'',...overrides,createdAt:now,updatedAt:now};
}
export function duplicate(m){return createMutation({...m,id:crypto.randomUUID(),name:`${title(m)} (alternative)`,tags:[...m.tags],workflow:'Idea'});}
export function applicableEffects(m,state){return [state!=='Corrupt'?{polarity:'positive',title:m.positiveTitle,text:m.positive}:null,state!=='Stable'?{polarity:'negative',title:m.negativeTitle,text:m.negative}:null].filter(Boolean);}
export function filterMutations(mutations,{search='',tag='',workflow='active'}={}){
  return mutations.filter(m=>(!search || [m.name,m.body,m.positiveTitle,m.positive,m.negativeTitle,m.negative,m.notes,...m.tags].join(' ').toLowerCase().includes(search.toLowerCase())) && (!tag || m.tags.some(t=>t.toLowerCase().includes(tag.toLowerCase()))) && (workflow==='all' || (workflow==='active'?m.workflow!=='Archived':m.workflow===workflow)));
}
export function validateMutation(value){
  const fail=message=>{throw new Error(`Invalid mutation: ${message}`);};
  if(!value || typeof value!=='object' || Array.isArray(value))fail('expected an object.');
  if(typeof value.id!=='string' || !value.id.trim() || value.id.length>128)fail('missing or invalid ID.');
  for(const field of TEXT_FIELDS)if(typeof value[field]!=='string')fail(`${field} must be text.`);
  if(!WORKFLOWS.includes(value.workflow))fail('unknown workflow.');
  if(!Object.hasOwn(ICON_NAMES,value.kind))fail('unknown body icon.');
  if(!['icon','upload'].includes(value.visual))fail('unknown visual source.');
  if(!Array.isArray(value.tags) || value.tags.some(t=>typeof t!=='string'))fail('tags must be a list of text values.');
  if(typeof value.image!=='string' || (value.image && !/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value.image)))fail('image must be an embedded PNG, JPEG, WebP or GIF.');
  if(value.visual==='upload' && !value.image)fail('uploaded visual has no image.');
  for(const field of ['createdAt','updatedAt'])if(typeof value[field]!=='string' || !Number.isFinite(Date.parse(value[field])))fail(`${field} is not a valid timestamp.`);
  return Object.fromEntries(['id',...TEXT_FIELDS,'kind','visual','workflow','image','createdAt','updatedAt'].map(k=>[k,value[k]]).concat([['tags',[...value.tags]]]));
}
export function validateCollection(values){
  if(!Array.isArray(values))throw new Error('Expected a mutations list.');
  const ids=new Set();return values.map(value=>{const m=validateMutation(value);if(ids.has(m.id))throw new Error(`Duplicate ID in file: ${m.id}`);ids.add(m.id);return m;});
}
export function jsonExport(mutations){return JSON.stringify({format:'mutation-designer',schemaVersion:1,exportedAt:new Date().toISOString(),mutations:validateCollection(mutations)},null,2);}
export function parseImport(text){
  let file;try{file=JSON.parse(text);}catch{throw new Error('This file is not valid JSON.');}
  if(file?.format!=='mutation-designer' || file.schemaVersion!==1)throw new Error('Expected a Mutation Designer JSON file with schema version 1.');
  return validateCollection(file.mutations);
}
export function sameDefinition(a,b){
  return [...TEXT_FIELDS,'kind','visual','workflow','image','tags'].every(key=>JSON.stringify(a[key])===JSON.stringify(b[key]));
}
export function planImport(existing,incoming){
  const byId=new Map(existing.map(m=>[m.id,m]));
  return incoming.map(m=>({incoming:m,local:byId.get(m.id)||null,type:!byId.has(m.id)?'new':sameDefinition(byId.get(m.id),m)?'identical':'conflict'}));
}
export function resolveImport(existing,plan,decisions){
  const result=existing.map(m=>({...m,tags:[...m.tags]}));
  for(const row of plan){
    if(row.type==='identical')continue;
    if(row.type==='new'){result.push({...row.incoming,tags:[...row.incoming.tags]});continue;}
    const decision=decisions[row.incoming.id];
    if(!['keep','replace','copy'].includes(decision))throw new Error('Choose how to handle every conflicting mutation.');
    if(decision==='keep')continue;
    if(decision==='replace'){const index=result.findIndex(m=>m.id===row.incoming.id);result[index]={...row.incoming,tags:[...row.incoming.tags]};}
    if(decision==='copy')result.push(createMutation({...row.incoming,id:crypto.randomUUID(),name:`${title(row.incoming)} (imported copy)`,tags:[...row.incoming.tags]}));
  }
  return validateCollection(result);
}
const md=text=>String(text).replace(/[\\`*_{}\[\]<>#|]/g,'\\$&');
export function markdownExport(mutations,{includeNotes=true}={}){
  const sections=mutations.map(m=>{
    const effect=key=>`${m[key+'Title']?`**${md(m[key+'Title'])}**\n\n`:''}${m[key]?md(m[key]):'_Not written yet._'}`;
    return `## ${md(title(m))}\n\n**Workflow:** ${m.workflow}  \n**Body icon:** ${ICON_NAMES[m.kind]}  \n**Tags:** ${m.tags.length?m.tags.map(md).join(', '):'None'}\n\n### Bodily change\n\n${m.body?md(m.body):'_Not written yet._'}\n\n### Positive effect\n\n${effect('positive')}\n\n### Negative effect\n\n${effect('negative')}${includeNotes?`\n\n### Design notes\n\n${m.notes?md(m.notes):'_None._'}`:''}`;
  });
  return `# Mutation definitions\n\nDesign handoff for review and implementation planning. These are ideas, not runtime-ready game data.\n\n${sections.join('\n\n---\n\n')}\n`;
}
export function rerollSlots(slots,pool,mode,random=Math.random){
  const result=slots.map(s=>({...s})), unlocked=slots.map((s,i)=>i).filter(i=>!slots[i].locked);
  const locked=new Set(slots.filter(s=>s.locked).map(s=>s.id));
  const shuffle=items=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
  const eligible=shuffle(pool.filter(m=>!locked.has(m.id)).map(m=>m.id)),owners=new Map();
  function assign(index,seen){for(const id of eligible){if(id===slots[index].id || seen.has(id))continue;seen.add(id);if(!owners.has(id)||assign(owners.get(id),seen)){owners.set(id,index);return true;}}return false;}
  shuffle(unlocked).forEach(i=>assign(i,new Set()));
  const assignments=new Map([...owners].map(([id,i])=>[i,id])),remaining=eligible.filter(id=>!owners.has(id));
  unlocked.forEach(i=>{result[i].id=assignments.get(i)||remaining.pop()||null;if(mode==='both'&&result[i].id)result[i].state=STATES[Math.floor(random()*STATES.length)];});return result;
}
export function cleanPreferences(value={}){
  const p={...DEFAULT_PREFERENCES};
  for(const [key,allowed] of Object.entries({libraryView:['cards','list'],entrySize:['small','medium','large'],previewLayout:['columns','stacked'],rollerLayout:['columns','stacked']}))if(allowed.includes(value[key]))p[key]=value[key];
  return p;
}
