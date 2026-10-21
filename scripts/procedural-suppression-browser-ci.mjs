/** Phase 14: actual WebGL subtraction, persistence, Undo/Redo, era and touch QA. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright-core';

const ROOT='http://127.0.0.1:4173/Starsilk_Map_of_the_All/';
const KEY='starsilk.map-of-the-all.draft.v1';
const chrome=[
  '/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
].find(existsSync);
if(!chrome)throw Error('Chromium missing: cannot verify real WebGL suppression');
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let log='';for(const s of [server.stdout,server.stderr])s.on('data',d=>log+=String(d).slice(0,1400));
let browser;
const watchdog=setTimeout(()=>{console.error('SUPPRESSION_BROWSER_TIMEOUT');server.kill('SIGTERM');process.exit(124);},180000);watchdog.unref();
async function ready(){
  for(let i=0;i<90;i++){
    if(server.exitCode!==null)throw Error('Preview exited '+log);
    try{if((await fetch(ROOT)).ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  throw Error('Preview unavailable '+log);
}
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const draws=page=>page.evaluate(()=>Number(document.querySelector('#drawCalls').textContent));
async function monitor(page,errors){
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{
    if(m.type()==='error'&&/THREE.WebGLProgram|Shader Error|VALIDATE_STATUS/i.test(m.text()))errors.push(m.text());
  });
  await page.goto(ROOT,{waitUntil:'domcontentloaded'});
  await page.locator('.world-label').first().waitFor({timeout:30000});
  await page.waitForFunction(()=>Number(document.querySelector('#drawCalls')?.textContent)>0,null,{timeout:30000});
}
async function suppress(page,id){
  await page.locator('#visualTarget').selectOption(id);
  await page.locator('#visualSuppressBtn').click();
  await page.waitForFunction(({key,id})=>{
    const raw=localStorage.getItem(key);
    return raw&&JSON.parse(raw).suppressedVisuals?.includes(id);
  },{key:KEY,id});
}
async function changeDraws(page,reference,direction,description){
  await page.waitForFunction(({reference,direction})=>{
    const n=Number(document.querySelector('#drawCalls')?.textContent);
    return direction==='less'?n<reference:n>reference;
  },{reference,direction},{timeout:16000});
  const actual=await draws(page);
  console.log('SUPPRESSION_DRAW '+description+' initial='+reference+' changed='+actual);
  return actual;
}
async function run(){
  await ready();
  browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const errors=[],ctx=await browser.newContext({viewport:{width:1536,height:864},reducedMotion:'reduce'});
  const page=await ctx.newPage();
  await monitor(page,errors);
  await page.locator('[data-drawer="nav"]').click();
  assert.equal(await page.locator('#visualTarget').isVisible(),true);
  const initial=await draws(page);
  await suppress(page,'network:all');
  const reduced=await changeDraws(page,initial,'less','network:all');
  assert.ok(initial-reduced>=20,'suppression must actually remove procedural 3D objects, not only DOM controls');
  let state=await saved(page);
  assert.equal(state.nodes.length,149,'suppression never deletes draft entities');
  assert.equal(state.nodes.find(n=>n.id==='worldsvault').status,'reference');
  assert.equal(state.layers.routes,true,'suppression does not modify layer hide');
  await page.keyboard.press('Control+z');
  await page.waitForFunction(key=>!(JSON.parse(localStorage.getItem(key))?.suppressedVisuals||[]).includes('network:all'),KEY);
  const restored=await changeDraws(page,reduced,'more','undo');
  await page.keyboard.press('Control+y');
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.suppressedVisuals?.includes('network:all'),KEY);
  await changeDraws(page,restored,'less','redo');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.suppressedVisuals?.includes('network:all'),KEY);
  console.log('SUPPRESSION_BROWSER_STAGE initial-network-undo-redo-reload');

  await page.locator('[data-drawer="nav"]').click();
  await page.locator('#visualTarget').selectOption('network:all');
  await page.locator('#visualSuppressBtn').click();
  await page.waitForFunction(key=>!JSON.parse(localStorage.getItem(key)).suppressedVisuals.includes('network:all'),KEY);
  await page.waitForFunction(initial=>Number(document.querySelector('#drawCalls')?.textContent)>=initial-5,initial,{timeout:15000});
  const beadDraw=await draws(page);
  await suppress(page,'flow:pulses');
  await changeDraws(page,beadDraw,'less','flow:pulses');
  const beforeNode=await draws(page);
  await suppress(page,'flow:node:0');
  await changeDraws(page,beforeNode,'less','flow:node:0');
  const prior=await saved(page);
  assert.equal(prior.suppressedVisuals.length,2);
  assert.equal(prior.timeline.snapshots.war.suppressedVisuals.length,0);
  await page.locator('[data-drawer="eras"]').click();
  await page.locator('#eraOptions button').first().click();
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.epoch==='war',KEY);
  assert.deepEqual((await saved(page)).suppressedVisuals,[]);
  await page.locator('#eraOptions button').last().click();
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.epoch==='post',KEY);
  assert.deepEqual(new Set((await saved(page)).suppressedVisuals),new Set(['flow:pulses','flow:node:0']));
  await page.locator('[data-drawer="nav"]').click();
  await page.locator('#visualResetBtn').click();
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.suppressedVisuals?.length===0,KEY);
  assert.equal(await page.locator('#visualResetBtn').isDisabled(),true);
  console.log('SUPPRESSION_BROWSER_STAGE flow-individual-era-reset');
  await ctx.close();

  const mobile=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const phone=await mobile.newPage();await monitor(phone,errors);
  await phone.locator('[data-drawer="nav"]').click();
  await phone.locator('#visualTarget').waitFor({state:'visible'});
  const control=await phone.locator('#visualTarget').boundingBox();
  assert.ok(control.height>=42,'touch target should not be tiny');
  await suppress(phone,'wall:debris');
  await suppress(phone,'wall:lattice');
  await phone.reload({waitUntil:'domcontentloaded'});
  assert.deepEqual(new Set((await saved(phone)).suppressedVisuals),new Set(['wall:debris','wall:lattice']));
  assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  console.log('SUPPRESSION_BROWSER_STAGE mobile-touch-persistent-subtraction');
  await mobile.close();

  assert.deepEqual(errors,[],'no WebGL shader failures or uncaught JS errors');
  console.log('SUPPRESSION_BROWSER_PASS real-draw-reduction=true undo=true redo=true reload=true era=true canonical=true mobile=true errors=0');
}
try{await run();}catch(e){console.error('SUPPRESSION_BROWSER_FAIL',e.stack||e);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');clearTimeout(watchdog);}
process.exit(process.exitCode||0);
