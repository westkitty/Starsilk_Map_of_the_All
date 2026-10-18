/** Phase 11 real-browser delete acceptance: draft-only, guarded, undoable, durable. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {seedAtlas} from '../atlas-data.js';

const ROOT='http://127.0.0.1:4173/Starsilk_Map_of_the_All/';
const KEY='starsilk.map-of-the-all.draft.v1';
const chrome=[
  '/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
].find(existsSync);
if(!chrome)throw Error('Chromium is required for deletion acceptance; no simulated PASS');
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let log='';for(const s of [server.stdout,server.stderr])s.on('data',c=>log+=String(c).slice(0,2000));
let browser;
const timer=setTimeout(()=>{console.error('DELETE_BROWSER_TIMEOUT');server.kill('SIGTERM');process.exit(124);},160000);timer.unref();
async function ready(){
  for(let i=0;i<90;i++){if(server.exitCode!==null)throw Error('Preview exited '+log);
    try{if((await fetch(ROOT)).ok)return;}catch{}await new Promise(r=>setTimeout(r,200));}
  throw Error('Preview unavailable '+log);
}
async function main(){
  await ready();
  browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:1536,height:864},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(ROOT,{waitUntil:'domcontentloaded'});
  await page.locator('.world-label').first().waitFor({timeout:30000});
  await page.locator('[data-drawer="nav"]').click();
  await page.locator('.node-btn').filter({hasText:'NORTH REACH'}).click();
  let dialogCount=0;
  page.once('dialog',async dialog=>{dialogCount++;assert.match(dialog.message(),/Dependent draft objects: 20/);await dialog.dismiss();});
  await page.keyboard.press('Delete');
  assert.equal(dialogCount,1);
  assert.ok(await page.locator('.node-btn').filter({hasText:'NORTH REACH'}).count(),'cancel preserves draft galaxy');
  page.once('dialog',async dialog=>{dialogCount++;assert.match(dialog.message(),/Only the current era is affected/);await dialog.accept();});
  await page.keyboard.press('Delete');
  await page.waitForFunction(key=>{const r=localStorage.getItem(key);return r&&!JSON.parse(r).nodes.some(n=>n.id==='north-reach');},KEY);
  const deleted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  assert.equal(deleted.nodes.length,seedAtlas().nodes.length-21,'cascade removes galaxy and its twenty child objects');
  assert.ok(deleted.nodes.some(n=>n.id==='worldsvault'),'canonical source landmark preserved');
  assert.ok(deleted.nodes.some(n=>n.id==='mother'),'source Mother remains protected');
  assert.ok(!deleted.routes.some(r=>r.from==='north-reach'||r.to==='north-reach'),'incident corridors removed');
  await page.keyboard.press('Control+z');
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.nodes.some(n=>n.id==='north-reach'),KEY);
  await page.keyboard.press('Control+y');
  await page.waitForFunction(key=>!JSON.parse(localStorage.getItem(key))?.nodes.some(n=>n.id==='north-reach'),KEY);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(key=>!JSON.parse(localStorage.getItem(key))?.nodes.some(n=>n.id==='north-reach'),KEY);
  console.log('DELETE_BROWSER_STAGE confirmed-cascade-cancel-undo-redo-reload');

  await page.locator('[data-drawer="nav"]').click();
  await page.locator('.node-btn').filter({hasText:'WORLDSVAULT'}).click();
  await page.keyboard.press('Delete');
  const readonly=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  assert.ok(readonly.nodes.some(n=>n.id==='worldsvault'),'keyboard Delete cannot erase canonical source identity');
  console.log('DELETE_BROWSER_STAGE canonical-protection');

  await page.locator('.node-btn').filter({hasText:'PERSEUS CONFLUENCE'}).click();
  await page.locator('[data-drawer="inspect"]').click();
  await page.locator('#objName').focus();
  await page.keyboard.press('Delete');
  await page.keyboard.press('Backspace');
  const guarded=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  assert.ok(guarded.nodes.some(n=>n.id==='perseus-confluence'),'text field keys cannot delete selected node');
  await context.close();

  const mobile=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push('mobile: '+e.message));
  await phone.goto(ROOT,{waitUntil:'domcontentloaded'});
  await phone.locator('[data-drawer="nav"]').click();
  await phone.locator('.node-btn').filter({hasText:'TRIANGULUM'}).click();
  await phone.locator('[data-drawer="inspect"]').click();
  await phone.locator('#deleteBtn').waitFor({state:'visible'});
  phone.once('dialog',async dialog=>dialog.accept());
  await phone.locator('#deleteBtn').click();
  await phone.waitForFunction(key=>{const raw=localStorage.getItem(key);return raw&&!JSON.parse(raw).nodes.some(n=>n.id==='triangulum');},KEY);
  assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile no horizontal overflow');
  await mobile.close();
  console.log('DELETE_BROWSER_STAGE mobile-inspector-touch');

  const groupContext=await browser.newContext({viewport:{width:1536,height:864},reducedMotion:'reduce'});
  const groupPage=await groupContext.newPage();groupPage.on('pageerror',e=>errors.push('group: '+e.message));
  await groupPage.goto(ROOT,{waitUntil:'domcontentloaded'});
  await groupPage.locator('.world-label').first().waitFor({timeout:30000});
  await groupPage.locator('[data-drawer="regions"]').click();
  assert.equal(await groupPage.locator('#strategyDeleteGroup').isDisabled(),true);
  await groupPage.locator('.world-label[data-atlas-id="perseus-confluence"]').click();
  await groupPage.locator('.world-label[data-atlas-id="centauri-marches"]').click({modifiers:['Shift']});
  assert.equal(await groupPage.locator('#strategyCount').textContent(),'2');
  assert.equal(await groupPage.locator('#strategyDeleteGroup').isEnabled(),true);
  let prohibitedDialogCount=0;
  const prohibitedDelete=async dialog=>{prohibitedDialogCount++;await dialog.dismiss();};
  groupPage.on('dialog',prohibitedDelete);
  await groupPage.evaluate(()=>document.querySelector('#helpDialog').showModal());
  await groupPage.keyboard.press('Delete');
  assert.equal(prohibitedDialogCount,0,'delete shortcut must not open confirmation behind a dialog');
  assert.equal(await groupPage.locator('#strategyCount').textContent(),'2','modal keyboard must not delete a group');
  await groupPage.evaluate(()=>document.querySelector('#helpDialog').close());
  await groupPage.locator('#strategyGroupSnap').focus();
  await groupPage.keyboard.press('Backspace');
  assert.equal(prohibitedDialogCount,0,'text/select focus must not open confirmation');
  assert.equal(await groupPage.locator('#strategyCount').textContent(),'2','select input must not trigger group deletion');
  groupPage.off('dialog',prohibitedDelete);
  groupPage.once('dialog',async dialog=>{
    assert.match(dialog.message(),/DELETE 2 SELECTED DRAFT OBJECT/);
    assert.match(dialog.message(),/Total nodes including descendants: 42/);
    await dialog.dismiss();
  });
  await groupPage.locator('#strategyDeleteGroup').click();
  assert.equal(await groupPage.locator('#strategyCount').textContent(),'2','cancel keeps selected group');
  groupPage.once('dialog',async dialog=>{
    assert.match(dialog.message(),/Undo restores the entire selection/);
    await dialog.accept();
  });
  await groupPage.keyboard.press('Delete');
  await groupPage.waitForFunction(key=>{
    const raw=localStorage.getItem(key);if(!raw)return false;
    const s=JSON.parse(raw);
    return !s.nodes.some(n=>n.id==='perseus-confluence'||n.id==='centauri-marches');
  },KEY);
  assert.equal(await groupPage.locator('#strategyCount').textContent(),'0','selection clears when nodes are removed');
  const grouped=await groupPage.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
  assert.equal(grouped.nodes.length,seedAtlas().nodes.length-42);
  assert.ok(grouped.nodes.some(n=>n.id==='worldsvault'),'canonical source survives group deletion');
  assert.ok(grouped.timeline.snapshots.war.nodes.some(n=>n.id==='perseus-confluence'),'other eras remain independent');
  assert.ok(!grouped.routes.some(r=>['perseus-confluence','centauri-marches'].includes(r.from)||['perseus-confluence','centauri-marches'].includes(r.to)),'dependent draft routes removed');
  await groupPage.keyboard.press('Control+z');
  await groupPage.waitForFunction(key=>{
    const s=JSON.parse(localStorage.getItem(key));
    return s?.nodes.some(n=>n.id==='perseus-confluence')&&s.nodes.some(n=>n.id==='centauri-marches');
  },KEY);
  await groupPage.keyboard.press('Control+y');
  await groupPage.waitForFunction(key=>{
    const s=JSON.parse(localStorage.getItem(key));
    return s&&!s.nodes.some(n=>n.id==='perseus-confluence'||n.id==='centauri-marches');
  },KEY);
  await groupPage.reload({waitUntil:'domcontentloaded'});
  await groupPage.waitForFunction(key=>{
    const s=JSON.parse(localStorage.getItem(key));
    return s&&!s.nodes.some(n=>n.id==='perseus-confluence'||n.id==='centauri-marches');
  },KEY);
  console.log('DELETE_BROWSER_STAGE atomic-group-cancel-undo-redo-reload-era');
  await groupContext.close();

  const groupMobile=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const groupPhone=await groupMobile.newPage();groupPhone.on('pageerror',e=>errors.push('group-mobile: '+e.message));
  await groupPhone.goto(ROOT,{waitUntil:'domcontentloaded'});
  await groupPhone.locator('[data-drawer="regions"]').click();
  await groupPhone.locator('#strategySelectAll').click();
  assert.equal(await groupPhone.locator('#strategyCount').textContent(),'7');
  assert.ok((await groupPhone.locator('#strategyDeleteGroup').boundingBox()).height>=42);
  groupPhone.once('dialog',async dialog=>{assert.match(dialog.message(),/DELETE 7 SELECTED/);await dialog.accept();});
  await groupPhone.locator('#strategyDeleteGroup').click();
  await groupPhone.waitForFunction(key=>{
    const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).nodes.every(n=>n.status==='reference');
  },KEY);
  assert.ok(await groupPhone.locator('#strategyDeleteGroup').isDisabled());
  assert.equal(await groupPhone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await groupMobile.close();
  console.log('DELETE_BROWSER_STAGE mobile-select-all-delete-canonical-survival');

  assert.deepEqual(errors,[]);
  console.log('DELETE_BROWSER_PASS cancel=true cascade=true undo=true redo=true reload=true canon=true keyboard=true mobile=true batch=true mixed-domain=true errors=0');
}
try{await main();}catch(e){console.error('DELETE_BROWSER_FAIL',e.stack||e);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');clearTimeout(timer);}
process.exit(process.exitCode||0);
