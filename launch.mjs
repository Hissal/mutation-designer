import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,openSync,closeSync,readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const APP_URL='http://127.0.0.1:4174/';
const root=dirname(fileURLToPath(import.meta.url));
export function browserCandidates(env=process.env){
  return [
    [env.ProgramFiles,'Google/Chrome/Application/chrome.exe'],
    [env['ProgramFiles(x86)'],'Google/Chrome/Application/chrome.exe'],
    [env.LOCALAPPDATA,'Google/Chrome/Application/chrome.exe'],
    [env['ProgramFiles(x86)'],'Microsoft/Edge/Application/msedge.exe'],
    [env.ProgramFiles,'Microsoft/Edge/Application/msedge.exe'],
    [env.LOCALAPPDATA,'Microsoft/Edge/Application/msedge.exe'],
  ].filter(([base])=>base).map(([base,path])=>join(base,path));
}
export function appArguments(profile){
  return [`--app=${APP_URL}`,`--user-data-dir=${profile}`,'--window-size=1440,1000','--no-first-run','--no-default-browser-check'];
}
export async function serverStatus(url=APP_URL){
  try{
    const response=await fetch(url,{signal:AbortSignal.timeout(1500),redirect:'error'});
    if(!response.ok)return 'occupied';
    // Recognize the actual app document, including an already running pre-launcher server.
    const html=await response.text();
    return html.includes('<title>Mutation Designer</title>') && (/src="\.?\/app\/controller\.js"/).test(html) && (/href="\.?\/app\/style\.css"/).test(html)?'ready':'occupied';
  }catch(error){
    if(error.cause?.code==='ECONNREFUSED')return 'absent';
    return 'occupied';
  }
}
function startProcess(command,args,options={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{shell:false,...options});
    child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});
  });
}
export async function ensureServer({status=serverStatus,start,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=60}={}){
  const initial=await status();if(initial==='ready')return 'reused';
  if(initial!=='absent')throw new Error('Port 4174 is occupied by another application or an unresponsive server. Close it and try again. The port is kept fixed to protect access to your saved library.');
  await start();
  for(let i=0;i<attempts;i++){if(await status()==='ready')return 'started';await wait(200);}
  throw new Error('The local server did not become ready. Check server.log in the MutationDesigner folder under Local AppData.');
}
async function main(){
  if(process.platform!=='win32')throw new Error('Use npm start and open the local URL on non-Windows systems.');
  if(Number(process.versions.node.split('.')[0])<22)throw new Error('Please install Node.js 22 or newer.');
  if(!process.env.LOCALAPPDATA)throw new Error('LOCALAPPDATA is unavailable; cannot locate your persistent app profile.');
  const data=join(process.env.LOCALAPPDATA,'MutationDesigner'),profile=join(data,'browser-profile'),configFile=join(data,'launcher.json');
  mkdirSync(data,{recursive:true});
  let browser;
  if(existsSync(configFile)){
    const config=JSON.parse(readFileSync(configFile,'utf8'));browser=config.browser;
    if(typeof browser!=='string'||!existsSync(browser))throw new Error('The browser previously used by Mutation Designer is unavailable. Restore it before launching to keep access to its library.');
  }else{
    browser=browserCandidates().find(existsSync);
    if(!browser)throw new Error('Install Google Chrome or Microsoft Edge to use the dedicated app window. You can still use npm start in a regular browser.');
  }
  if(process.argv.includes('--check')){
    console.log(`Browser: ${browser}\nProfile: ${profile}\nURL: ${APP_URL}\nServer: ${await serverStatus()}`);return;
  }
  await ensureServer({start:async()=>{
    const log=openSync(join(data,'server.log'),'a');
    try{await startProcess(process.execPath,[join(root,'server.mjs')],{cwd:root,env:{...process.env,PORT:'4174'},detached:true,windowsHide:true,stdio:['ignore',log,log]});}
    finally{closeSync(log);}
  }});
  await startProcess(browser,appArguments(profile),{detached:true,stdio:'ignore'});
  writeFileSync(configFile,JSON.stringify({browser},null,2));
  console.log('Mutation Designer opened. This launcher can close. The local server stays available in the background.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){main().catch(error=>{console.error(`\nCould not open Mutation Designer.\n${error.message}\n`);process.exitCode=1;});}
