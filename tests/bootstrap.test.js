import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const bootstrap=fileURLToPath(new URL('../bootstrap.ps1',import.meta.url)).replaceAll("'","''");
function run(script){
 const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-Command',`$ErrorActionPreference='Stop'; . '${bootstrap}'; ${script}`],{encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);
}
const options={skip:process.platform!=='win32'};
test('supported Node skips prompts and installation',options,()=>run(`
 function Find-SupportedNode { return 'existing-node' }
 function Read-Host { throw 'Unexpected prompt' }
 function Install-NodeLts { throw 'Unexpected install' }
 if ((Resolve-Node) -ne 'existing-node') { throw 'Wrong executable' }
`));
test('N declines without installation and invalid answers are retried',options,()=>run(`
 function Find-SupportedNode { return $null }
 function Find-WinGet { return 'mock-winget' }
 $script:answers=@('invalid',' n '); $script:index=0
 function Read-Host { $value=$script:answers[$script:index]; $script:index++; return $value }
 function Install-NodeLts { throw 'Unexpected install' }
 if ($null -ne (Resolve-Node)) { throw 'Should decline' }
 if ($script:index -ne 2) { throw 'Did not retry invalid input' }
`));
test('Y installs once, refreshes PATH and uses the installed Node',options,()=>run(`
 $script:installed=$false; $script:refreshed=$false
 function Find-SupportedNode { if ($script:installed -and $script:refreshed) { return 'new-node' } }
 function Find-WinGet { return 'mock-winget' }
 function Read-Host { return 'y' }
 function Install-NodeLts($winget) { if ($winget -ne 'mock-winget' -or $script:installed) { throw 'Wrong install' }; $script:installed=$true; return 0 }
 function Refresh-ProcessPath { $script:refreshed=$true }
 if ((Resolve-Node) -ne 'new-node') { throw 'New Node not selected' }
`));
for (const scenario of ['missing-winget','failed-install','missing-after-install']) {
 test(`bootstrap reports ${scenario} without continuing`,options,()=>run(`
 function Find-SupportedNode { return $null }
 function Find-WinGet { ${scenario==='missing-winget'?'return $null':"return 'mock-winget'"} }
 function Read-Host { return 'Y' }
 function Install-NodeLts { return ${scenario==='failed-install'?1:0} }
 function Refresh-ProcessPath { }
 $caught=$false
 try { Resolve-Node } catch { $caught=$true; if ($_.Exception.Message -notmatch 'nodejs.org') { throw } }
 if (-not $caught) { throw 'Expected failure' }
 `));
}
