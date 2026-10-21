/** Phase 13: real browser storage-failure, import, interruption and raw recovery proof. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {seedAtlas} from '../atlas-data.js';
import {ensureTimeline,syncEra} from '../temporal-model.js';
import {deleteObject} from '../deletion-engine.js';

const HOST='http://127.0.0.1:4173/Starsilk_Map_of_the_All/';
const KEY='starsilk.map-of-the-all.draft.v1';
const MARKER=KEY+'.sessionFallback';
const executablePath=[
  '/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
].find(existsSync);
if(!executablePath)throw Error('Chromium required; no synthetic browser success');
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let output='';for(const stream of [server.stdout,server.stderr])stream.on('data',data=>output+=String(data).slice(0,900));
let browser;
const watchdog=setTimeout(()=>{console.error('PHASE13_BROWSER_TIMEOUT');server.kill('SIGTERM');process.exit(124);},190000);watchdog.unref();
async function ready(){
  for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Preview exited '+output);
    try{if((await fetch(HOST)).ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  throw Error('Preview unavailable '+output);
}
async function stored(page,location='localStorage'){
  return page.evaluate(({key,location})=>{
    const raw=window[location].getItem(key);return raw?JSON.parse(raw):null;
  },{key:KEY,location});
}
async function onScreen(page){
  await page.goto(HOST,{waitUntil:'domcontentloaded'});
  await page.locator('.world-label').first().waitFor({timeout:30000});
}
async function injectStorageDenial(page,both=false){
  await page.evaluate(({key,both})=>{
    const real=Storage.prototype.setItem;
    window.__phase13OriginalSetItem=real;
    Storage.prototype.setItem=function(k,v){
      if(k===key && (both || this===window.localStorage))throw new DOMException('storage quota injected','QuotaExceededError');
      return real.call(this,k,v);
    };
  },{key:KEY,both});
}
async function clickAndWaitSaved(page){
  await page.evaluate(()=>document.getElementById('motionBtn').click());
  await page.waitForFunction(key=>Boolean(window.localStorage.getItem(key)),KEY);
}
async function deleteViaKeyboard(page,id){
  await page.locator('[data-drawer="nav"]').click();
  await page.locator('.node-btn[data-atlas-id="'+id+'"]').click();
  page.once('dialog',async dialog=>dialog.accept());
  await page.keyboard.press('Delete');
}
async function run(){
  await ready();
  browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const errors=[];

  // Reproduce the old defect: stale local draft must not resurrect a deleted system.
  const ctx=await browser.newContext({viewport:{width:1536,height:864},reducedMotion:'reduce'});
  const page=await ctx.newPage();page.on('pageerror',err=>errors.push(err.message));
  await onScreen(page);
  await clickAndWaitSaved(page);
  await injectStorageDenial(page,false);
  await deleteViaKeyboard(page,'north-reach');
  const local=await stored(page),session=await stored(page,'sessionStorage');
  assert.ok(local.nodes.some(n=>n.id==='north-reach'),'stale primary intentionally left untouched');
  assert.ok(!session.nodes.some(n=>n.id==='north-reach'),'synchronous session fallback recorded deletion');
  assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),MARKER),'1');
  await page.reload({waitUntil:'domcontentloaded'}); // Immediate simulated process restart.
  await page.locator('.world-label').first().waitFor({timeout:30000});
  assert.ok(!(await stored(page,'sessionStorage')).nodes.some(n=>n.id==='north-reach'));
  assert.match(await page.locator('#savedStatus').textContent(),/SESSION RECOVERED/);
  assert.equal(await page.locator('#atlasSessionRecovery').count(),1,'recovered session offers a dedicated persistence action');
  console.log('PHASE13_BROWSER_STAGE stale-local-no-resurrection');

  // Explicitly promote the recovered session without requiring unrelated edits.
  await page.locator('[data-drawer="nav"]').click();
  await page.locator('#atlasSessionRecovery button').filter({hasText:'SAVE RECOVERED DRAFT LOCALLY'}).click();
  await page.waitForFunction(key=>{
    const raw=localStorage.getItem(key);
    return raw&&!JSON.parse(raw).nodes.some(n=>n.id==='north-reach');
  },KEY);
  assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),MARKER),null);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.ok(!(await stored(page)).nodes.some(n=>n.id==='north-reach'));
  console.log('PHASE13_BROWSER_STAGE promotion-from-session');

  // Neither store available: fail closed instead of showing a phantom deletion.
  const blocked=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const blockPage=await blocked.newPage();blockPage.on('pageerror',err=>errors.push(err.message));
  await onScreen(blockPage);
  await clickAndWaitSaved(blockPage);
  await injectStorageDenial(blockPage,true);
  await deleteViaKeyboard(blockPage,'triangulum');
  assert.ok((await stored(blockPage)).nodes.some(n=>n.id==='triangulum'),'failed deletion did not overwrite local');
  assert.equal(await blockPage.evaluate(key=>sessionStorage.getItem(key),KEY),null);
  assert.match(await blockPage.locator('#savedStatus').textContent(),/EXPORT REQUIRED/);
  await blockPage.reload({waitUntil:'domcontentloaded'});
  assert.ok((await stored(blockPage)).nodes.some(n=>n.id==='triangulum'));
  console.log('PHASE13_BROWSER_STAGE dual-failure-rejection');

  // A confirmed imported v1 draft must also fail closed until a store is available.
  const imported=seedAtlas();ensureTimeline(imported);
  deleteObject(imported,'triangulum',{type:'node'});syncEra(imported);
  await injectStorageDenial(blockPage,true);
  await blockPage.locator('#fileInput').setInputFiles({
    name:'phase13-deleted-draft.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(imported),'utf8')
  });
  await blockPage.locator('#importConfirmDialog').waitFor({state:'visible'});
  await blockPage.locator('#importConfirmBtn').click();
  assert.ok((await stored(blockPage)).nodes.some(n=>n.id==='triangulum'),'failed import never overwrites live draft');
  assert.equal(await blockPage.locator('#importConfirmDialog').isVisible(),true,'import remains cancelable/retryable');
  await blockPage.evaluate(()=>{Storage.prototype.setItem=window.__phase13OriginalSetItem;});
  await blockPage.locator('#importConfirmBtn').click();
  await blockPage.waitForFunction(key=>{
    const raw=localStorage.getItem(key);
    return raw&&!JSON.parse(raw).nodes.some(n=>n.id==='triangulum');
  },KEY);
  await blockPage.reload({waitUntil:'domcontentloaded'});
  assert.ok(!(await stored(blockPage)).nodes.some(n=>n.id==='triangulum'));
  assert.ok((await stored(blockPage)).nodes.every(n=>n.status==='draft'),'import does not promote canon');
  console.log('PHASE13_BROWSER_STAGE guarded-import-retry');

  // Corrupted previous bytes must be downloadable, never silently replaced.
  const bad='{"unreadable":';
  const corrupt=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true});
  await corrupt.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:KEY,raw:bad});
  const damaged=await corrupt.newPage();damaged.on('pageerror',err=>errors.push(err.message));
  await damaged.goto(HOST,{waitUntil:'domcontentloaded'});
  await damaged.locator('#atlasRecoveryTools').waitFor({state:'attached'});
  await damaged.locator('[data-drawer="nav"]').click();
  await damaged.locator('#atlasRecoveryTools').waitFor({state:'visible'});
  const pending=damaged.waitForEvent('download');
  await damaged.locator('#atlasRecoveryTools button').filter({hasText:'DOWNLOAD ORIGINAL JSON'}).click();
  const download=await pending;
  assert.equal(await readFile(await download.path(),'utf8'),bad);
  assert.equal(await damaged.evaluate(key=>localStorage.getItem(key),KEY),bad);
  await injectStorageDenial(damaged,false);
  damaged.once('dialog',async dialog=>dialog.accept());
  await damaged.locator('#atlasRecoveryTools button').filter({hasText:'REPLACE WITH NEW DRAFT'}).click();
  assert.equal(await damaged.evaluate(key=>localStorage.getItem(key),KEY),bad,'corrupt original remains byte-exact when local storage refuses replacement');
  assert.equal(await damaged.evaluate(key=>sessionStorage.getItem(key),KEY),null,'replacement cannot silently succeed only in temporary session storage');
  assert.equal(await damaged.locator('#atlasRecoveryTools').count(),1,'raw recovery controls remain available');
  console.log('PHASE13_BROWSER_STAGE byte-exact-corrupt-recovery');
  await corrupt.close();
  await blocked.close();
  await ctx.close();
  assert.deepEqual(errors,[]);
  console.log('PHASE13_BROWSER_PASS stale-local=true failed-writes=true import=true raw-recovery=true errors=0');
}
try{await run();}catch(e){console.error('PHASE13_BROWSER_FAIL',e.stack||e);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');clearTimeout(watchdog);}
process.exit(process.exitCode||0);
