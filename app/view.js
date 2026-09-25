import {STATES as states, WORKFLOWS as workflows, ICON_NAMES as iconNames, filterMutations, applicableEffects, title as name} from './model.js';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// The selected A presentation. UI functions read state; persistence and mutations live in the controller.
export function createView(s){
  const {mutations,selected,slots,rollMode,rolls}=s;
  const {libraryView,entrySize,previewLayout,rollerLayout,editorShare,autoFitPreview}=s.preferences;
  const {search,workflow:workflowFilter,tag:tagFilter}=s.filters;
  const current=()=>mutations.find(m=>m.id===selected);
  const get=id=>mutations.find(m=>m.id===id);
  const pool=()=>filterMutations(mutations,s.filters);
const badge = m => `<span class="badge ${m.workflow.toLowerCase()}">● ${esc(m.workflow)}</span>`;
const tags = m => `<div class="tags">${m.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`;
const brandMark = `<svg class="brand-mark" viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M5 3v9l22 12v9M27 3v9L5 24v9M5 7h22M5 29h22M10 14l12 8M22 14l-12 8" stroke="currentColor" stroke-width="2"/></svg>`;
function art(m) {
  if (m.image && m.visual !== 'icon') return `<img src="${esc(m.image)}" alt="Reference for ${esc(name(m))}">`;
  const paths = {
    brain:'M54 22c-8-16-27-11-30 3-15 0-20 18-12 29-10 15-1 32 13 32 4 15 22 17 29 5 8 12 27 10 30-5 16-1 22-18 13-31 8-15-1-28-13-30-3-14-22-19-30-3Z M54 22v69 M25 25l8 14-6 14 M13 54l16 4 8 14-12 14 M33 39l12-7 M37 72l9 9 M83 25L71 39l8 14 M96 55l-17 5-9 14 14 12 M71 39l-9-7 M70 74l-9 8',
    skull:'M29 75C4 44 24 12 54 12s51 31 29 63l-5 25H32Z M28 47l18-3v18H29Z M63 44l18 3-1 15H63Z M54 60l-7 15h14Z M34 85h44 M42 83v17 M54 83v17 M66 83v17',
    hand:'M31 101L17 70c-5-12 6-16 12-5l6 9-7-43c-2-10 10-12 12-2l5 29-1-41c0-10 12-10 12 0l1 40 5-35c2-10 14-7 12 3l-5 36 9-25c4-9 14-4 11 5L78 88l-9 15Z M43 77l17-7 12 5 M44 89l20 2',
    stomach:'M47 10v30c-10 7-16 13-21 28-8 21 3 34 21 34 25 0 45-17 43-41-1-18-15-22-27-12L60 10Z M36 81c12-20 22-10 35-24 M49 101l-4 10 M57 100l-2 11',
    muscle:'M32 20l13 11c27-13 48 8 35 35l10 19-12 9-17-12C35 98 9 71 28 44L18 30Z M36 37l31 35 M30 49l22 28 M46 35l29 25 M34 62l11 14',
    skin:'M14 35l37-20 44 23-38 23Z M14 35v42l43 24 38-22V38 M14 49l43 24 38-22 M14 64l43 24 38-22 M57 61v40 M32 31l7 16 M54 20l8 15 M72 33l7 15 M31 72v10 M77 70v10',
    bones:'M32 19c-10-13-24-4-18 7-12 4-9 20 4 18l35 49c-6 12 8 23 16 12 10 10 22-2 14-12 7-11-7-19-14-12L35 32c7-9 3-16-3-13Z M30 39l27 41 M24 43l29 38 M70 24c5-11 17-9 17 2 12 0 12 15 1 18L50 96 M70 38L47 68',
    heart:'M48 31c-2-15 1-22 9-25l6 7-3 20 M64 34c5-15 12-18 20-15l1 11-13 11 M44 31C24 16 12 37 19 59c5 21 26 43 42 50 15-18 31-39 28-57-2-15-15-19-28-12-6-10-10-12-17-9Z M48 38l9 19-6 19 12 29 M57 58l18-8 M52 74l-20-10 M61 85l15-13',
    lungs:'M51 7v35l-12 13 M59 7v35l12 13 M40 29C22 32 12 57 13 88c0 17 13 15 32 2l1-42-6-19Z M69 29c18 3 28 28 27 59 0 17-13 15-32 2l-1-42 6-19Z M38 49l-9 14 8 12 M27 65l-7 15 M72 49l9 14-8 12 M83 65l7 15 M38 78l-9 14 M72 78l9 14',
    eye:'M8 60Q53 13 102 60 53 107 8 60Z M9 60l-5-8 M17 48l-5-10 M30 38l-4-12 M47 31V17 M65 32l3-13 M83 41l8-10 M96 53l10-6 M22 74l-5 12 M41 87l-3 12 M62 89l3 12 M83 80l7 10 M74 60a20 20 0 1 1-40 0 20 20 0 1 1 40 0 M59 60a5 14 0 1 1-10 0 5 14 0 1 1 10 0',
    spine:'M52 10l-5 94 M61 10l-4 94 M40 24l26 2-3 10-24-2Z M39 45l25 2-3 10-23-2Z M38 66l24 2-3 10-22-2Z M36 87l24 2-3 10-22-2Z M40 29L17 13l12 28 10 8 M65 29l29-13-18 30-13 4 M38 52L12 44l16 23 9 7 M63 52l31-8-20 23-13 7 M37 75l-21 4 18 13 M60 75l24 7-24 10',
    teeth:'M14 43c14-22 65-22 81 0l-7 46c-15 18-46 18-65 0L14 43Z M15 46l15 21 4-29 M36 36l12 36 8-38 M60 36l9 36 10-33 M81 41l-1 28 13-21 M23 86l10-18 9 29 M46 100l8-25 9 26 M68 97l8-25 10 18',
  };
  return `<svg class="specimen-svg" viewBox="0 0 110 120" fill="none" aria-hidden="true"><path d="${paths[m.kind] || paths.bones}" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 112h24m54 0h24M55 110v4" stroke="currentColor" opacity=".35"/></svg>`;
}
function artwork(m) { return `<div class="card-art">${art(m)}<span class="card-index">${esc(iconNames[m.kind])}</span></div>`; }
function effects(m, state) {
  return applicableEffects(m,state).map(e=>effect(m,e.polarity)).join('');
}
function effect(m, polarity) {
  return `<div class="effect ${polarity}">${m[polarity+'Title'] ? `<strong>${polarity==='positive'?'+':'−'} ${esc(m[polarity+'Title'])}</strong>` : ''}<span class="description">${m[polarity] ? esc(m[polarity]) : `<span class="missing">${polarity==='positive'?'Positive':'Negative'} effect not written yet.</span>`}</span></div>`;
}
function stateCard(m,state,showImage=true) { return `<article class="state-card ${state.toLowerCase()}"><span class="state-label">${state}</span><h3>${esc(name(m))}</h3>${showImage ? `<div class="preview-art">${art(m)}</div>` : ""}${effects(m,state)}</article>`; }
function layoutToggle(target,value) {
  return `<div class="segmented" role="group" aria-label="${target==='preview'?'State preview':'Roller'} layout"><button class="small ${value==='columns'?'active':''}" data-layout-target="${target}" data-layout="columns" aria-pressed="${value==='columns'}">Side by side</button><button class="small ${value==='stacked'?'active':''}" data-layout-target="${target}" data-layout="stacked" aria-pressed="${value==='stacked'}">Stacked</button></div>`;
}
function libraryControls() {
  return `<div class="library-controls"><div class="segmented" role="group" aria-label="Library view">${['cards','list'].map(v=>`<button class="small ${libraryView===v?'active':''}" data-library-view="${v}" aria-pressed="${libraryView===v}">${v==='cards'?'Cards':'List'}</button>`).join('')}</div><label class="size-control">Entry size<select id="entry-size">${['small','medium','large'].map(v=>`<option value="${v}" ${entrySize===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></label></div>`;
}
function iconPicker() {
  const m=current();
  return `<div class="visual-picker"><div class="row spread wrap"><label>Body-part icon</label>${m.image?`<div class="segmented" role="group" aria-label="Visual source"><button class="small ${m.visual==='icon'?'active':''}" data-visual="icon" aria-pressed="${m.visual==='icon'}">Body icon</button><button class="small ${m.visual!=='icon'?'active':''}" data-visual="upload" aria-pressed="${m.visual!=='icon'}">Uploaded image</button></div>`:''}</div><div class="icon-picker" role="group" aria-label="Body-part icons">${Object.entries(iconNames).map(([kind,label])=>`<button class="icon-choice ${m.kind===kind && (!m.image || m.visual==='icon')?'active':''}" data-icon="${kind}" aria-pressed="${m.kind===kind && (!m.image || m.visual==='icon')}">${art({kind})}<span>${label}</span></button>`).join('')}</div><p class="muted" style="font-size:11px">Choose an outline or use your own image. Switching to an icon keeps your upload available.</p></div>`;
}
function previews() {
  const m = current();
  if(!m)return "";
  return `<div class="preview-heading"><div class="eyebrow">One definition / three states</div><div class="row wrap">${true?`<button class="small ${autoFitPreview?'active':'quiet'}" data-action="auto-fit-preview" aria-pressed="${autoFitPreview}" title="Keep all preview content visible; dragging switches to manual sizing">Auto-fit preview</button>`:''}${layoutToggle('preview',previewLayout)}</div></div><div class="state-grid layout-${previewLayout}">${states.map(s => stateCard(m,s)).join('')}</div><p class="state-footnote">Only applicable effects appear. Design notes stay off the cards.</p>`;
}
function toolbar() {
  return `<div class="toolbar"><label class="search"><span aria-hidden="true">⌕</span><span class="sr-only">Search mutations</span><input id="search" type="search" value="${esc(search)}" placeholder="Search names, effects, notes…"></label><label><span class="sr-only">Workflow filter</span><select id="workflow-filter">${[['active','Not archived'],['all','All workflows'],...workflows.map(w=>[w,w])].map(([v,t])=>`<option value="${v}" ${v===workflowFilter?'selected':''}>${t}</option>`).join('')}</select></label><label class="tag-filter"><span class="sr-only">Filter by tag</span><input id="tag-filter" value="${esc(tagFilter)}" placeholder="Filter by tag…"></label><span class="count" data-pool-count>${pool().length} in pool</span></div>`;
}
function library(type) {
  const items = pool();
  if (!items.length) return `<div class="empty"><strong>No matching studies</strong>Try a different search or clear your filters.<br><button class="small quiet" data-action="clear-filters" style="margin-top:12px">Clear filters</button></div>`;
  if (type === 'adaptive') return library(libraryView==='cards'?'grid':'list');
  if (type === 'list') return `<div class="mutation-list size-${entrySize}">${items.map(m=>`<div class="list-shell"><label class="list-checkbox"><input type="checkbox" data-bulk="${esc(m.id)}" ${s.bulk.has(m.id)?'checked':''} aria-label="Select ${esc(name(m))} for export"></label><button class="mutation-list-item ${m.id===selected?'selected':''}" data-select="${esc(m.id)}" aria-pressed="${m.id===selected}"><span class="list-art">${art(m)}</span><span class="list-copy"><span class="row spread wrap"><span class="card-name">${esc(name(m))}</span>${badge(m)}</span><span class="list-effects"><span class="positive">+ ${esc(m.positive || 'Benefit not written')}</span><span class="negative">− ${esc(m.negative || 'Drawback not written')}</span></span>${tags(m)}</span></button></div>`).join('')}</div>`;
  return `<div class="library-grid size-${entrySize}">${items.map(m=>`<article class="card-shell"><label class="bulk-checkbox"><input type="checkbox" data-bulk="${esc(m.id)}" ${s.bulk.has(m.id)?'checked':''} aria-label="Select ${esc(name(m))} for export"></label><button class="mutation-card ${m.id===selected?'selected':''}" data-select="${esc(m.id)}" aria-pressed="${m.id===selected}">${artwork(m)}<div class="card-body">${badge(m)}<div class="card-name">${esc(name(m))}</div><p class="card-caption">${esc(m.body || 'A new idea, still taking shape.')}</p>${tags(m)}</div></button></article>`).join('')}</div>`;
}
function field(label,key,textarea=false,placeholder='') {
  const value = current()[key];
  return `<label>${label}${textarea?`<textarea data-field="${key}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`:`<input data-field="${key}" value="${esc(value)}" placeholder="${esc(placeholder)}">`}</label>`;
}
function editorHeading() { return `<div class="editor-title"><div><small>DEFINITION</small><h2 data-current-name>${esc(name(current()))}</h2></div><div class="row wrap"><button class="small quiet" data-action="export-current">Export</button><button class="small quiet" data-action="duplicate">Duplicate</button><button class="small quiet" data-action="archive">${current().workflow==='Archived'?'Restore':'Archive'}</button>${current().workflow==='Archived'?'<button class="small danger" data-action="delete">Delete</button>':''}<button class="small" data-action="add-compare" title="Place this mutation in an unlocked comparison slot">Compare ↗</button></div></div>`; }
function editorForm() {
  const m = current();
  return `<div class="editor-form">
    <div class="field-pair">${field('Mutation name','name',false,'Untitled mutation')}<label>Workflow<select data-field="workflow">${workflows.map(w=>`<option ${m.workflow===w?'selected':''}>${w}</option>`).join('')}</select></label></div>
    <div class="field-pair"><div class="effect-field"><span class="effect-label">+ Positive effect</span>${field('Short title · optional','positiveTitle',false,'What does it give?')}${field('Effect description','positive',true,'Describe the benefit in your own words…')}</div><div class="effect-field negative"><span class="effect-label">− Negative effect</span>${field('Short title · optional','negativeTitle',false,'What does it take?')}${field('Effect description','negative',true,'Describe the cost or drawback…')}</div></div>
    ${field('Bodily change · optional','body',true,'What changes beneath—or through—the skin?')}
    <label>Tags · comma separated<input data-field="tags" value="${esc(m.tags.join(', '))}" placeholder="bones, mobility, sustain"></label>
    <details class="form-details" open><summary>Design notes & visual reference</summary><div class="details-content">${field('Design notes · excluded from player previews','notes',true,'Questions, intent, interactions, things to investigate…')}${iconPicker()}<div class="image-controls"><span class="thumb">${art(m)}</span><div><label class="upload-label">${m.image?'Replace':'Attach'} reference image<input class="file-input" type="file" id="image-upload" accept="image/png,image/jpeg,image/webp,image/gif"></label><p class="muted" style="font-size:11px;margin-top:5px">PNG, JPEG, WebP or GIF · up to 5 MB</p></div>${m.image?'<button class="small quiet" data-action="remove-image">Remove</button>':''}</div></div></details>
  </div>`;
}
function workspace() {
  if(!mutations.length)return `<section class="welcome panel"><div class="eyebrow">Your local design space</div><h2>Start with a body. Find the trade-off.</h2><p>Create your first mutation, import a teammate's JSON file, or explore the sample library. Everything you create is saved in this browser.</p><div class="row wrap"><button class="primary" data-action="new">+ New mutation</button><button data-action="import">Import JSON</button><button class="quiet" data-action="examples">Load sample ideas</button></div><p class="muted">Sample ideas are illustrative and can be edited or archived. Export JSON backups to keep a copy outside this browser.</p></section>`;
  return `<div class="workspace-a"><section class="library-section"><div class="section-heading row spread wrap"><span class="eyebrow muted">Mutation library</span>${libraryControls()}</div><div class="selection-tools"><span data-selection-count>${s.bulk.size} selected</span><button class="small quiet" data-action="select-visible">Select visible</button><button class="small quiet" data-action="clear-selection">Clear</button><button class="small" data-action="export-selected" ${s.bulk.size?'':'disabled'}>Export selected</button></div><div class="library-pane" data-library="adaptive">${library('adaptive')}</div></section><section class="panel adjustable-editor" style="--editor-share:${editorShare}fr;--preview-share:${100-editorShare}fr"><div class="panel-head">${editorHeading()}</div><div class="panel-body" id="definition-fields">${editorForm()}</div><div class="editor-divider" role="separator" tabindex="0" aria-label="Resize definition editor and previews" aria-orientation="horizontal" aria-controls="definition-fields" aria-valuemin="25" aria-valuemax="80" aria-valuenow="${editorShare}"><span></span><small>Drag to resize · double-click to reset</small><span></span></div><div class="preview-region" data-previews>${previews()}</div></section></div>`;
}
function slotOptions(index) {
  const selectedId = slots[index].id;
  const items = pool();
  if (selectedId && !items.some(m=>m.id===selectedId)) items.unshift(get(selectedId));
  return `<option value="">Empty slot</option>${items.map(m=>`<option value="${esc(m.id)}" ${selectedId===m.id?'selected':''} ${slots.some((s,i)=>i!==index && s.id===m.id)?'disabled':''}>${esc(name(m))}${!pool().some(p=>p.id===m.id)?' (outside filter)':''}</option>`).join('')}`;
}
function comparisonSlots() {
  return slots.map((s,i)=>{
    const m=get(s.id);
    return `<section class="slot ${s.locked?'locked':''} ${m?'':'empty-slot'}"><div class="slot-top"><span class="eyebrow muted">Offer / 0${i+1}</span><button class="small ${s.locked?'active':'quiet'}" data-lock="${i}" aria-pressed="${s.locked}" ${!m?'disabled':''}>${s.locked?'● Locked':'○ Lock slot'}</button></div><div class="slot-fields"><label><span class="sr-only">Mutation in slot ${i+1}</span><select data-slot="${i}" ${s.locked?'disabled':''}>${slotOptions(i)}</select></label><label><span class="sr-only">State in slot ${i+1}</span><select data-state="${i}" ${s.locked?'disabled':''}>${states.map(st=>`<option ${st===s.state?'selected':''}>${st}</option>`).join('')}</select></label></div>${m?`${artwork(m)}${stateCard(m,s.state,false)}<div class="slot-footer">${esc(m.workflow)} · ${esc(m.tags.join(' / ') || 'No tags')}<button class="small quiet" style="float:right" data-edit="${esc(m.id)}">Edit ↗</button><div style="clear:both"></div></div>`:`<div class="empty"><strong>No mutation in this slot</strong>Choose a mutation or reroll.<br>More distinct eligible mutations are needed<br>to fill every available slot.</div>`}</section>`;
  }).join('');
}
function comparison() {
  return `<div class="comparison-head"><div><h2>Three choices. What changes?</h2><p class="muted" style="margin-top:5px">Lock a reference point. Keep discovering what belongs beside it.</p></div><div class="roll-controls"><label><span class="sr-only">Reroll mode</span><select id="roll-mode"><option value="mutations" ${rollMode==='mutations'?'selected':''}>Mutations only</option><option value="both" ${rollMode==='both'?'selected':''}>Mutations + states</option></select></label><button class="primary" data-action="reroll" ${slots.every(s=>s.locked)?'disabled':''}>↻ Reroll offers</button></div></div><div class="roller-layout-control">${layoutToggle('roller',rollerLayout)}</div><div class="comparison-grid layout-${rollerLayout}" data-slots>${comparisonSlots()}</div><div class="comparison-tip">${rollMode==='mutations'?'Each slot keeps its selected state.':'Unlocked slots receive a random mutation and state.'} Locked slots stay exactly as they are, even outside the current filters. No duplicate mutations in a roll. <span class="count" style="margin-left:8px">ROLL ${String(rolls).padStart(2,'0')}</span></div>`;
}

function render(){
 return `<header class="topbar"><div class="brand">${brandMark}<div>MUTATION DESIGNER<span class="brand-sub">BODY / BENEFIT / CONSEQUENCE</span></div></div><nav class="topnav" aria-label="Workspace"><button data-view="workspace" class="${s.view==='workspace'?'active':''}" aria-pressed="${s.view==='workspace'}">Library & editor</button><button data-view="compare" class="${s.view==='compare'?'active':''}" aria-pressed="${s.view==='compare'}">Comparison lab</button></nav><div class="row wrap"><span id="save-status" role="status"></span><button class="small quiet" data-action="import">Import</button><button class="small" data-action="export">Export / backup</button></div></header>
 <div id="storage-alert" role="alert"></div>
 <main class="page"><div class="hero"><div><div class="eyebrow">${s.view==='compare'?'Controlled experiment / picker studies':'A collection of beautiful problems.'}</div><h1>${s.view==='compare'?'Pick your poison.':'Anatomy of an idea.'}</h1><p>${s.view==='compare'?'Explore combinations, compare trade-offs, and test the wording.':'Give an idea a body. Find its benefit. Decide what it costs.'}</p></div><button class="primary" data-action="new">+ New mutation</button></div>
 ${mutations.length||s.view==='compare'?toolbar():''}${s.view==='compare'?comparison():workspace()}
 <footer class="bottom-meta"><span>${mutations.length} DEFINITIONS · SAVED IN THIS BROWSER</span><span>Markdown for handoff · JSON for backup and exchange</span></footer></main>`;
}
return {render,library,previews,comparisonSlots};
}
