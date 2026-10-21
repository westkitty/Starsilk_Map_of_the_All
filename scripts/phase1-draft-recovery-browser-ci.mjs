/** Phase 1-only, disposable-profile evidence for backup and restore. No user's profile is opened. */
import {spawn} from 'node:child_process';
import {existsSync, readFileSync, mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {seedAtlas,addNode,validateAtlas,STORAGE_KEY} from '../atlas-data.js';
import {ensureTimeline,syncEra,switchEra} from '../temporal-model.js';
import {regionFromGroup} from '../strategic-model.js';

const ROOT='http://127.0.0.1:4173/Starsilk_Map_of_the_All/';
const chrome=[
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].find(existsSync);
if(!chrome)throw Error('Chromium-family executable unavailable');
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let logs='';for(const stream of [server.stdout,server.stderr])stream.on('data',v=>logs+=String(v).slice(0,1000));
let browser;
async function ready(){for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Preview exited '+logs);try{if((await fetch(ROOT)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw Error('Preview unavailable '+logs);}
function fixture(){
  const s=seedAtlas();ensureTimeline(s);
  for(const era of ['post','war','locking']){
    switchEra(s,era);
    s.nodes[0].name='PHASE1 '+era.toUpperCase()+' GALAXY';
    s.nodes[0].description='Disposable recovery fixture '+era;
    const a=addNode(s,'annotation','north-reach');
    a.name='PHASE1 '+era.toUpperCase()+' ANNOTATION';
    a.description='Not canon; QA only';
    s.routes[0].kind=era==='post'?'starsilk':'hookshot';
    s.regions.push({...regionFromGroup(s,['north-reach','halcyon-arm'],{kind:'all',id:null}),name:'PHASE1 '+era.toUpperCase()+' REGION'});
    syncEra(s);
  }
  switchEra(s,'post');
  assert.deepEqual(validateAtlas(s),[]);
  return s;
}
function verifyEras(state){
  assert.equal(state.version,1);
  assert.deepEqual(Object.keys(state.timeline.snapshots),['war','locking','post']);
  for(const era of ['post','war','locking']){
    const snap=state.timeline.snapshots[era];
    assert.equal(snap.nodes[0].name,'PHASE1 '+era.toUpperCase()+' GALAXY');
    assert.ok(snap.nodes.some(n=>n.name==='PHASE1 '+era.toUpperCase()+' ANNOTATION'));
    assert.ok(snap.regions.some(r=>r.name==='PHASE1 '+era.toUpperCase()+' REGION'));
    assert.equal(snap.routes[0].kind,era==='post'?'starsilk':'hookshot');
  }
}
async function open(page){const response=await page.goto(ROOT,{waitUntil:'domcontentloaded',timeout:30000});assert.equal(response.status(),200);await page.locator('[data-drawer="nav"]').waitFor();}
async function test(){
  const source=fixture(),sourceRaw=JSON.stringify(source);
  await ready();
  browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const orig=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true});
  await orig.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:STORAGE_KEY,raw:sourceRaw});
  const a=await orig.newPage();await open(a);
  await a.locator('[data-drawer="nav"]').click();
  const [download]=await Promise.all([a.waitForEvent('download',{timeout:20000}),a.locator('#exportBtn').click()]);
  const bytes=readFileSync(await download.path(),'utf8');
  const exported=JSON.parse(bytes);
  verifyEras(exported);assert.deepEqual(validateAtlas(exported),[]);
  assert.equal(await a.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),sourceRaw,'export must not change source storage');
  await orig.close();
  console.log('PHASE1_RECOVERY export backup three-era regions/routes/annotations=PASS file='+download.suggestedFilename());
  const restore=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true});
  const b=await restore.newPage();await open(b);
  await b.locator('[data-drawer="nav"]').click();
  const input=b.locator('#fileInput');
  const before=await b.evaluate(key=>localStorage.getItem(key),STORAGE_KEY);
  await input.setInputFiles({name:'phase1-backup.json',mimeType:'application/json',buffer:Buffer.from(bytes)});
  await b.locator('#importConfirmDialog').waitFor({state:'visible',timeout:10000});
  assert.equal((await b.locator('#importSummaryEras').textContent()).trim(),'3');
  await b.locator('#importCancelBtn').click();
  assert.equal(await b.locator('#importConfirmDialog').isVisible(),false);
  assert.equal(await b.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),before,'Cancel must not overwrite storage');
  console.log('PHASE1_RECOVERY cancel=PASS');
  await input.setInputFiles({name:'bad-schema.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});
  await b.waitForTimeout(400);
  assert.equal(await b.locator('#importConfirmDialog').isVisible(),false,'bad schema must not reach confirmation');
  assert.equal(await b.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),before,'bad import must not overwrite storage');
  console.log('PHASE1_RECOVERY reject_invalid=PASS');
  await input.setInputFiles({name:'phase1-backup.json',mimeType:'application/json',buffer:Buffer.from(bytes)});
  await b.locator('#importConfirmDialog').waitFor({state:'visible',timeout:10000});
  const [safetyCopy]=await Promise.all([b.waitForEvent('download',{timeout:20000}),b.locator('#importBackupBtn').click()]);
  assert.ok(readFileSync(await safetyCopy.path(),'utf8').includes('"version": 1'));
  await b.locator('#importConfirmBtn').click();
  await b.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await b.waitForFunction(key=>{try{return JSON.parse(localStorage.getItem(key)).timeline.snapshots.war.nodes[0].name==='PHASE1 WAR GALAXY';}catch{return false;}},STORAGE_KEY,{timeout:10000});
  const saved=JSON.parse(await b.evaluate(key=>localStorage.getItem(key),STORAGE_KEY));
  assert.deepEqual(validateAtlas(saved),[]);verifyEras(saved);
  for(const era of ['post','war','locking'])for(const n of saved.timeline.snapshots[era].nodes){assert.equal(n.status,'draft');assert.equal(n.sourceUrl,null);}
  const next=await restore.newPage();await open(next);
  assert.equal(await next.locator('#savedStatus').count(),1);
  verifyEras(JSON.parse(await next.evaluate(key=>localStorage.getItem(key),STORAGE_KEY)));
  await restore.close();
  console.log('PHASE1_RECOVERY restore reload source_demoted all_eras=PASS');
  const corrupt=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true});
  const rejected='{"damaged":[';
  await corrupt.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:STORAGE_KEY,raw:rejected});
  const c=await corrupt.newPage();await open(c);
  await c.locator('[data-drawer="nav"]').click();
  await c.locator('#atlasRecoveryTools').waitFor();
  const [badCopy]=await Promise.all([c.waitForEvent('download',{timeout:20000}),c.locator('#atlasRecoveryTools button').first().click()]);
  assert.equal(readFileSync(await badCopy.path(),'utf8'),rejected);
  assert.equal(await c.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),rejected);
  await corrupt.close();
  console.log('PHASE1_RECOVERY corrupt_exact_bytes_preserved=PASS');
  const mobile=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
  const m=await mobile.newPage();await open(m);
  const geometry=await m.evaluate(()=>{
    const tab=document.getElementById('atlasPullTabs');
    const b=tab?.getBoundingClientRect();
    return {viewport:innerWidth,tabWidth:b?.width,visibleTabs:[...document.querySelectorAll('.atlas-pull-tab')].filter(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}).length,tabTotal:document.querySelectorAll('.atlas-pull-tab').length,tabScrollWidth:tab?.scrollWidth,tabClientWidth:tab?.clientWidth};
  });
  await m.keyboard.press('/');
  const search=await m.evaluate(()=>({drawer:document.getElementById('atlas')?.getAttribute('data-active-drawer'),focused:document.activeElement?.id||null}));
  console.log('PHASE1_UX_OBSERVATION '+JSON.stringify({geometry,search}));
  await mobile.close();
  console.log('PHASE1_RECOVERY_BROWSER_PASS disposable_profiles_only=true');
}
try{await test();}catch(error){console.error('PHASE1_RECOVERY_BROWSER_FAIL',error.stack||error);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');}
process.exit(process.exitCode||0);
