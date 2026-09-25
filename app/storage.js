import {validateCollection,cleanPreferences} from './model.js';
const DB_NAME='mutation-designer', STORE='library', KEY='current';
export function openStorage(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
    request.onerror=()=>reject(request.error||new Error('Browser storage could not be opened.'));
    request.onblocked=()=>reject(new Error('Another tab is blocking browser storage. Close other Mutation Designer tabs and reload.'));
  });
}
export function readSnapshot(db){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(KEY);
    tx.oncomplete=()=>{
      try{const data=request.result;if(data===undefined){resolve(null);return;}
        if(data.version!==1)throw new Error('The saved library version is unsupported.');
        resolve({mutations:validateCollection(data.mutations),preferences:cleanPreferences(data.preferences)});
      }catch(error){reject(error);}
    };
    tx.onerror=()=>reject(tx.error||new Error('Could not read your library.'));
    tx.onabort=()=>reject(tx.error||new Error('Reading your library was interrupted.'));
  });
}
export function saveSnapshot(db,data){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({version:1,mutations:data.mutations,preferences:data.preferences},KEY);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||new Error('Your library could not be saved.'));
    tx.onabort=()=>reject(tx.error||new Error('Saving was interrupted.'));
  });
}
// Serializes commits and coalesces rapid edits without ever marking newer edits saved early.
export function createSaveQueue(write,onStatus){
  let latest=null,revision=0,savedRevision=0,running=false,failed=false;
  async function drain(){
    if(running)return;running=true;
    try{while(latest){const task=latest;latest=null;onStatus({phase:'saving'});
      try{await write(task.data);savedRevision=task.revision;failed=false;}
      catch(error){if(!latest)latest=task;failed=true;onStatus({phase:'error',message:error.message});break;}
    }}finally{running=false;}
    if(!failed && savedRevision===revision)onStatus({phase:'saved'});
  }
  return {
    enqueue(data){revision++;latest={revision,data:structuredClone(data)};failed=false;void drain();},
    retry(){failed=false;void drain();},
    isDirty(){return revision!==savedRevision;},
  };
}
export function acquireEditingLock(){
  return new Promise(resolve=>{
    if(!navigator.locks){resolve({editable:false,message:'This browser does not support safe local editing. Open this app in a current Chrome, Edge, or Firefox browser.'});return;}
    navigator.locks.request('mutation-designer-editor',{ifAvailable:true},async lock=>{
      if(!lock){resolve({editable:false,message:'Another tab is editing this library. Close that tab and reload here to edit. You can still view and export this copy.'});return;}
      resolve({editable:true});await new Promise(()=>{});
    }).catch(error=>resolve({editable:false,message:`Could not acquire editing access: ${error.message}`}));
  });
}
