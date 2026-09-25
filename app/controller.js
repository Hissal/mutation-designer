import {createView,esc} from './view.js';
import {STATES,DEFAULT_PREFERENCES,TEXT_FIELDS,createMutation,duplicate,title,filterMutations,jsonExport,markdownExport,parseImport,planImport,resolveImport,rerollSlots} from './model.js';
import {openStorage,readSnapshot,saveSnapshot,createSaveQueue,acquireEditingLock} from './storage.js';
import {examples} from './examples.js';

const state={mutations:[],preferences:{...DEFAULT_PREFERENCES},selected:null,view:'workspace',filters:{search:'',tag:'',workflow:'active'},bulk:new Set(),slots:STATES.map(state=>({id:null,state,locked:false})),rollMode:'mutations',rolls:0};
const app=document.querySelector('#app'), dialog=document.querySelector('#dialog');
let db,queue,editable=false,storageMessage='',saveStatus={phase:'loading'},observer,toastTimer;
let importPlan=null,importDecisions={};
const current=()=>state.mutations.find(m=>m.id===state.selected);
const pool=()=>filterMutations(state.mutations,state.filters);
function announce(message){
  document.querySelector('#announcer').textContent=message;
  document.querySelector('.toast')?.remove();
  const toast=document.createElement('div');toast.className='toast';toast.textContent=message;document.body.append(toast);
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.remove(),4500);
}
function updateStatus(){
  const status=document.querySelector('#save-status'),alert=document.querySelector('#storage-alert');
  if(!status)return;
  status.className=`save-state ${saveStatus.phase}`;
  status.textContent=!editable?'Read-only':saveStatus.phase==='saved'?'● Saved locally':saveStatus.phase==='saving'?'◌ Saving…':saveStatus.phase==='error'?'! Not saved':'Opening…';
  alert.innerHTML=storageMessage?`<div class="storage-warning">${esc(storageMessage)} <button class="small" data-action="reload">Reload</button></div>`:saveStatus.phase==='error'?`<div class="storage-warning">Your latest changes are not saved: ${esc(saveStatus.message)} <button class="small" data-action="retry-save">Retry save</button><button class="small" data-action="export">Export a backup</button></div>`:'';
}
function persist(){
  if(!editable||!queue)return;
  queue.enqueue({mutations:state.mutations,preferences:state.preferences});
}
function changed(m=current()){
  if(m)m.updatedAt=new Date().toISOString();
  persist();
}
function render(preserveEditorScroll=false){
  const scroll=preserveEditorScroll?document.querySelector('.adjustable-editor .panel-body')?.scrollTop||0:0;
  observer?.disconnect();app.innerHTML=createView(state).render();
  if(!editable)app.querySelectorAll('[data-field],[data-icon],[data-visual],#image-upload,[data-action="new"],[data-action="duplicate"],[data-action="archive"],[data-action="delete"],[data-action="examples"],[data-action="remove-image"],[data-action="import"]').forEach(el=>el.disabled=true);
  const editor=document.querySelector('.adjustable-editor .panel-body');if(editor)editor.scrollTop=scroll;
  updateStatus();sizeEditor();
  const library=document.querySelector('.library-section');if(library){observer=new ResizeObserver(sizeEditor);observer.observe(library);}
}
function refreshDerived(){
  const view=createView(state);
  document.querySelectorAll('[data-previews]').forEach(el=>el.innerHTML=view.previews());
  document.querySelectorAll('[data-library]').forEach(el=>el.innerHTML=view.library(el.dataset.library));
  document.querySelectorAll('[data-pool-count]').forEach(el=>el.textContent=`${pool().length} in pool`);
  document.querySelectorAll('[data-current-name]').forEach(el=>el.textContent=title(current()));
  const slotHost=document.querySelector('[data-slots]');if(slotHost)slotHost.innerHTML=view.comparisonSlots();
  sizeEditor();
}
function sizeEditor(){
  const panel=document.querySelector('.adjustable-editor'),library=document.querySelector('.library-section');if(!panel||!library)return;
  if(innerWidth<=800){panel.style.height='';return;}
  const baseHeight=Math.max(760,library.offsetHeight,innerHeight-180);panel.style.height=`${baseHeight}px`;
  {const preview=panel.querySelector('.preview-region');const required=panel.querySelector('.panel-head').getBoundingClientRect().height+preview.scrollHeight+220+2;panel.style.height=`${Math.max(baseHeight,Math.ceil(required))}px`;}
}
function selectMutation(id){state.selected=id;state.view='workspace';render();}
function cleanSelection(){
  const ids=new Set(state.mutations.map(m=>m.id));if(!ids.has(state.selected))state.selected=state.mutations.find(m=>m.workflow!=='Archived')?.id||state.mutations[0]?.id||null;
  state.bulk=new Set([...state.bulk].filter(id=>ids.has(id)));
  state.slots.forEach(slot=>{if(!ids.has(slot.id)){slot.id=null;slot.locked=false;}});
}
function beginIdea(m){state.mutations.unshift(m);state.selected=m.id;state.view='workspace';state.filters={search:'',tag:'',workflow:'active'};changed(m);render();document.querySelector('[data-field="name"]')?.focus();}
function showDialog(html){dialog.innerHTML=html;if(!dialog.open)dialog.showModal();}
function closeDialog(){dialog.close();importPlan=null;importDecisions={};}
function download(text,filename,type){
  const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function exportDialog(scope='all'){
  showDialog(`<div class="dialog-heading"><h2>Export definitions</h2><button class="quiet" data-dialog="close" aria-label="Close export">✕</button></div><p class="muted">Markdown for human-readable definitions. JSON for importing, including images and all design notes.</p><div class="stack dialog-fields"><label>Which definitions?<select id="export-scope"><option value="current" ${scope==='current'?'selected':''} ${current()?'':'disabled'}>Current mutation</option><option value="selected" ${scope==='selected'?'selected':''} ${state.bulk.size?'':'disabled'}>Selected mutations (${state.bulk.size})</option><option value="all" ${scope==='all'?'selected':''}>Full library (${state.mutations.length}, including archived)</option></select></label><label>Format<select id="export-format"><option value="json">JSON · complete, importable backup</option><option value="markdown">Markdown · human-readable format</option></select></label><label class="check-line" id="notes-choice" hidden><input type="checkbox" id="export-notes" checked> Include design notes in Markdown</label><p class="muted" id="export-note">JSON always includes complete definitions and embedded reference images.</p></div><div class="dialog-actions"><button data-dialog="close">Cancel</button><button class="primary" data-dialog="download">Download file</button></div>`);
}
function doExport(){
  const scope=document.querySelector('#export-scope').value,format=document.querySelector('#export-format').value;
  const records=scope==='all'?state.mutations:scope==='current'?[current()].filter(Boolean):state.mutations.filter(m=>state.bulk.has(m.id));
  if(scope!=='all'&&!records.length)throw new Error('No mutations selected.');
  const text=format==='json'?jsonExport(records):markdownExport(records,{includeNotes:document.querySelector('#export-notes').checked});
  const slug=records.length===1?title(records[0]).normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'mutation':'mutation-library';
  download(text,`${slug}-${new Date().toISOString().slice(0,10)}.${format==='json'?'json':'md'}`,format==='json'?'application/json':'text/markdown');
  closeDialog();announce(`Exported ${records.length} definition${records.length===1?'':'s'}.`);
}
function definitionReview(m){
  return `<h3>${esc(title(m))}</h3><p class="muted">${esc(m.workflow)} · ${esc(m.kind)} · ${esc(m.tags.join(', ')||'No tags')}</p>${['body','positiveTitle','positive','negativeTitle','negative','notes'].map(key=>`<dl><dt>${{body:'Bodily change',positiveTitle:'Positive title',positive:'Positive effect',negativeTitle:'Negative title',negative:'Negative effect',notes:'Design notes'}[key]}</dt><dd>${esc(m[key]||'Not provided')}</dd></dl>`).join('')}<p class="muted">Visual: ${esc(m.visual)} · Icon: ${esc(m.kind)}</p>${m.image?`<img class="conflict-image" src="${esc(m.image)}" alt="Attached reference">`:'<p class="muted">No uploaded image</p>'}`;
}
function importDialog(){
  const conflicts=importPlan.filter(row=>row.type==='conflict'),newCount=importPlan.filter(row=>row.type==='new').length,identical=importPlan.filter(row=>row.type==='identical').length;
  showDialog(`<div class="dialog-heading"><h2>Review import</h2><button class="quiet" data-dialog="close" aria-label="Cancel import">✕</button></div><p>${newCount} new · ${identical} unchanged · ${conflicts.length} conflicting</p><p class="muted">Nothing changes until you apply the import. Resolve every conflict below.</p><div class="import-review">${conflicts.map(row=>`<section class="conflict"><h3>${esc(title(row.incoming))}</h3><div class="conflict-columns"><article><div class="eyebrow">Your definition</div>${definitionReview(row.local)}</article><article><div class="eyebrow">Imported definition</div>${definitionReview(row.incoming)}</article></div><label>How should this conflict be handled?<select data-import-id="${esc(row.incoming.id)}"><option value="">Choose an action…</option><option value="keep">Keep yours</option><option value="replace">Replace yours with imported definition</option><option value="copy">Import as a separate copy</option></select></label></section>`).join('')}${newCount?`<details><summary>New definitions (${newCount})</summary><ul>${importPlan.filter(row=>row.type==='new').map(row=>`<li>${esc(title(row.incoming))}</li>`).join('')}</ul></details>`:''}${!conflicts.length&&!newCount?'<p>All definitions already match your library.</p>':''}</div><div class="dialog-actions"><span id="import-progress" class="muted">${conflicts.length?'Resolve each conflict to continue.':'Ready to import.'}</span><button data-dialog="close">Cancel</button><button class="primary" data-dialog="apply-import" ${conflicts.length?'disabled':''}>Apply import</button></div>`);
}
async function readImport(file){
  if(!editable)return;
  const incoming=parseImport(await file.text());importPlan=planImport(state.mutations,incoming);importDecisions={};importDialog();
}
function deleteDialog(){const m=current();if(!m)return;showDialog(`<div class="dialog-heading"><h2>Delete this mutation?</h2></div><p><strong>${esc(title(m))}</strong> will be permanently removed from this browser's library and its comparison slots. This cannot be undone.</p><p class="muted">Export a JSON backup first if you may want to restore it.</p><div class="dialog-actions"><button data-dialog="close" autofocus>Keep mutation</button><button class="danger" data-dialog="confirm-delete" data-id="${esc(m.id)}">Permanently delete</button></div>`);}
function addComparison(){
  if(state.slots.some(s=>s.id===state.selected)){state.view='compare';render();return;}
  let index=state.slots.findIndex(s=>!s.locked&&!s.id);if(index<0)index=state.slots.findIndex(s=>!s.locked);
  if(index<0){announce('All slots are locked. Unlock one to add a mutation.');return;}
  state.slots[index].id=state.selected;state.view='compare';render();
}
async function action(button){
  if(button.dataset.view){state.view=button.dataset.view;render();return;}
  if(button.dataset.select){selectMutation(button.dataset.select);return;}
  if(button.dataset.edit){selectMutation(button.dataset.edit);return;}
  if(button.dataset.libraryView){state.preferences.libraryView=button.dataset.libraryView;persist();render(true);return;}
  if(button.dataset.layoutTarget){state.preferences[button.dataset.layoutTarget==='preview'?'previewLayout':'rollerLayout']=button.dataset.layout;persist();render(true);return;}
  if(button.dataset.lock!==undefined){const s=state.slots[Number(button.dataset.lock)];s.locked=!s.locked;render();return;}
  if(button.dataset.icon||button.dataset.visual){if(!editable)return;const m=current();if(button.dataset.icon){m.kind=button.dataset.icon;m.visual='icon';}else m.visual=button.dataset.visual;changed();render(true);return;}
  const key=button.dataset.action;
  if(['new','duplicate','archive','delete','examples','remove-image','import'].includes(key)&&!editable)return;
  switch(key){
    case 'new':beginIdea(createMutation());break;
    case 'duplicate':beginIdea(duplicate(current()));break;
    case 'archive':current().workflow=current().workflow==='Archived'?'Idea':'Archived';changed();render(true);announce(current().workflow==='Archived'?'Mutation archived. Use the workflow filter to find it later.':'Mutation restored as an idea.');break;
    case 'delete':deleteDialog();break;
    case 'remove-image':current().image='';current().visual='icon';changed();render(true);break;
    case 'clear-filters':state.filters={search:'',tag:'',workflow:'active'};render(true);break;
    case 'select-visible':pool().forEach(m=>state.bulk.add(m.id));render(true);break;
    case 'clear-selection':state.bulk.clear();render(true);break;
    case 'export-current':exportDialog('current');break;
    case 'export-selected':exportDialog('selected');break;
    case 'export':exportDialog();break;
    case 'import':document.querySelector('#import-file').click();break;
    case 'retry-save':queue.retry();break;
    case 'reload':location.reload();break;
    case 'examples':
      if(state.mutations.length)break;
      state.mutations=examples.map(({id,...m})=>createMutation({...m,notes:`Illustrative sample idea.\n\n${m.notes}`}));state.selected=state.mutations[0].id;state.slots.forEach((s,i)=>s.id=state.mutations[i]?.id||null);persist();render();announce('Sample ideas added to your local library.');break;
    case 'add-compare':addComparison();break;
    case 'reroll':state.slots=rerollSlots(state.slots,pool(),state.rollMode);state.rolls++;render();announce(`Roll ${state.rolls}: ${state.slots.filter(s=>s.id).length} offers, ${state.slots.filter(s=>s.locked).length} locked.`);break;
  }
}
app.addEventListener('click',event=>{const button=event.target.closest('button');if(button&&!button.disabled)action(button).catch(error=>announce(error.message));});
app.addEventListener('input',event=>{
  const el=event.target;
  if(el.dataset.field&&el.tagName!=='SELECT'&&editable){const key=el.dataset.field;if(key==='tags')current().tags=[...new Set(el.value.split(',').map(t=>t.trim()).filter(Boolean))];else if(TEXT_FIELDS.includes(key))current()[key]=el.value;changed();refreshDerived();}
  if(el.id==='search'){state.filters.search=el.value;refreshDerived();}
  if(el.id==='tag-filter'){state.filters.tag=el.value;refreshDerived();}
});
app.addEventListener('change',async event=>{
  const el=event.target;
  try{
    if(el.dataset.bulk){el.checked?state.bulk.add(el.dataset.bulk):state.bulk.delete(el.dataset.bulk);document.querySelectorAll('[data-selection-count]').forEach(e=>e.textContent=`${state.bulk.size} selected`);const button=document.querySelector('[data-action="export-selected"]');if(button)button.disabled=!state.bulk.size;}
    if(el.dataset.field==='workflow'&&editable){current().workflow=el.value;changed();render(true);}
    if(el.id==='workflow-filter'){state.filters.workflow=el.value;refreshDerived();}
    if(el.id==='entry-size'){state.preferences.entrySize=el.value;persist();render(true);}
    if(el.id==='roll-mode'){state.rollMode=el.value;render();}
    if(el.dataset.slot!==undefined){const i=Number(el.dataset.slot);if(!state.slots[i].locked&&!state.slots.some((s,j)=>j!==i&&el.value&&s.id===el.value)){state.slots[i].id=el.value||null;render();}}
    if(el.dataset.state!==undefined){const slot=state.slots[Number(el.dataset.state)];if(!slot.locked){slot.state=el.value;render();}}
    if(el.id==='image-upload'&&el.files[0]&&editable){
      const file=el.files[0],m=current();if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw new Error('Choose a PNG, JPEG, WebP or GIF image.');if(file.size>5*1024*1024)throw new Error('Choose an image smaller than 5 MB.');
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read this image.'));reader.readAsDataURL(file);});
      await new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(new Error('This file is not a readable image.'));image.src=data;});
      if(!state.mutations.includes(m))return;m.image=data;m.visual='upload';changed(m);render(true);announce('Reference image attached.');
    }
  }catch(error){announce(error.message);}
});
document.querySelector('#import-file').addEventListener('change',async event=>{try{if(event.target.files[0])await readImport(event.target.files[0]);}catch(error){announce(`Import not applied. ${error.message}`);}finally{event.target.value='';}});
dialog.addEventListener('change',event=>{
  if(event.target.id==='export-format'){const markdown=event.target.value==='markdown';document.querySelector('#notes-choice').hidden=!markdown;document.querySelector('#export-note').textContent=markdown?'Markdown contains readable definitions and effects, without images.':'JSON always includes complete definitions and embedded reference images.';}
  if(event.target.dataset.importId){importDecisions[event.target.dataset.importId]=event.target.value;const unresolved=importPlan.filter(row=>row.type==='conflict'&&!importDecisions[row.incoming.id]).length;document.querySelector('[data-dialog="apply-import"]').disabled=unresolved>0;document.querySelector('#import-progress').textContent=unresolved?`${unresolved} conflicts still need a choice.`:'All conflicts resolved.';}
});
dialog.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  try{
    switch(button.dataset.dialog){
      case 'close':closeDialog();break;
      case 'download':doExport();break;
      case 'apply-import':if(!editable)return;state.mutations=resolveImport(state.mutations,importPlan,importDecisions);cleanSelection();persist();closeDialog();render();announce('Import applied.');break;
      case 'confirm-delete':if(!editable)return;state.mutations=state.mutations.filter(m=>m.id!==button.dataset.id);cleanSelection();persist();closeDialog();render();announce('Mutation permanently deleted.');break;
    }
  }catch(error){announce(error.message);}
});
dialog.addEventListener('close',()=>{importPlan=null;importDecisions={};});
window.addEventListener('resize',sizeEditor);
window.addEventListener('beforeunload',event=>{if(queue?.isDirty()){event.preventDefault();event.returnValue='';}});

async function initialize(){
  try{
    const access=await acquireEditingLock();editable=access.editable;storageMessage=access.message||'';
    db=await openStorage();const saved=await readSnapshot(db);if(saved){state.mutations=saved.mutations;state.preferences=saved.preferences;}
    cleanSelection();state.slots.forEach((s,i)=>s.id=state.mutations.filter(m=>m.workflow!=='Archived')[i]?.id||null);
    saveStatus={phase:'saved'};queue=createSaveQueue(data=>saveSnapshot(db,data),status=>{saveStatus=status;updateStatus();});render();
  }catch(error){editable=false;storageMessage=`Your local library could not be opened. No stored data has been changed. ${error.message}`;saveStatus={phase:'error'};render();}
}
void initialize();
