/** Phase 16 — prove real draft-region render economy without touching user data. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {seedAtlas} from '../atlas-data.js';
const uri='http://127.0.0.1:4173/Starsilk_Map_of_the_All/?atlasDiagnostics=1';
const binary=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'].find(existsSync);
if(!binary)throw Error('Chromium browser required');
const seed=seedAtlas(),sites=seed.nodes.filter(n=>n.kind==='galaxy');
const colors=['#58ccf2','#9ad6ff','#c084fc','#f5b85d','#40cdb3','#eab1e0','#8facf2'];
seed.regions=sites.map((n,i)=>{const [x,,z]=n.position;return {
  id:'qa-sector-'+i,name:'EDITORIAL TEST '+i,affiliation:'PROVISIONAL / NOT CANON',parentId:null,
  status:'draft',color:colors[i],points:[[x-8,z-8],[x+8,z-8],[x+8,z+8],[x-8,z+8]]
};});
mkdirSync('atlas-qa-evidence',{recursive:true});
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let log='';for(const out of [server.stdout,server.stderr])out.on('data',d=>log+=String(d).slice(0,900));
let browser;
const watchdog=setTimeout(()=>{console.error('PHASE16_BROWSER_TIMEOUT');server.kill('SIGTERM');process.exit(124);},215000);watchdog.unref();
async function ready(){for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error('preview died '+log);
  try{if((await fetch(uri)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}
  throw Error('preview not ready '+log);}
const get=page=>page.evaluate(()=>window.__atlasDiagnostics?.());
const wait=(page,fn)=>page.waitForFunction(fn,null,{timeout:24000});
const setSeed=page=>page.addInitScript(raw=>{if(!localStorage.getItem('starsilk.map-of-the-all.draft.v1'))localStorage.setItem('starsilk.map-of-the-all.draft.v1',raw);},JSON.stringify(seed));
try{
  await ready();
  browser=await chromium.launch({headless:true,executablePath:binary,
    args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:1536,height:864},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await setSeed(page);
  await page.goto(uri,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.world-label').first().waitFor({timeout:32000});
  await wait(page,()=>window.__atlasDiagnostics?.().authoredSectors===7);
  const initial=await get(page);
  assert.equal(initial.provisionalCells,7);
  assert.equal(initial.regionObjects,14,'Only 7 authored fills plus 7 outlines while editor closed');
  assert.equal(initial.regionPins,0,'Closed editor must not retain decorative vertex pins');
  assert.ok(initial.regionRebuilds>=1);
  console.log('PHASE16_STAGE static-fills '+JSON.stringify({objects:initial.regionObjects,pins:initial.regionPins,builds:initial.regionRebuilds,calls:initial.drawCalls}));
  await page.locator('[data-drawer="nav"]').click();
  await page.locator('.node-btn[data-atlas-id="perseus-confluence"]').click();
  const selected=await get(page);
  assert.equal(selected.regionRebuilds,initial.regionRebuilds,'Selection-only update must reuse authored GPU objects');
  console.log('PHASE16_STAGE cache-no-realloc');
  await page.locator('[data-drawer="regions"]').click();
  await page.locator('#strategyModeRegion').click();
  await page.locator('.strategy-sector-row').first().click();
  await wait(page,()=>window.__atlasDiagnostics?.().regionPins===8);
  const active=await get(page);
  assert.equal(active.regionObjects,23,'Seven region shells plus one selected accent and eight active handles');
  assert.equal(await page.locator('.strategy-vertex').count(),4,'Editor HTML vertex handles still present');
  await page.screenshot({path:'atlas-qa-evidence/phase16-region-active.png'});
  console.log('PHASE16_STAGE active-editor '+JSON.stringify({objects:active.regionObjects,pins:active.regionPins,draws:active.drawCalls}));
  await page.locator('#strategyModePan').click();
  await wait(page,()=>window.__atlasDiagnostics?.().regionPins===0);
  await page.locator('#strategyModeRegion').click();
  await wait(page,()=>window.__atlasDiagnostics?.().regionPins===8);
  await page.locator('#strategyClose').click();
  await wait(page,()=>window.__atlasDiagnostics?.().regionPins===0);
  const closed=await get(page);
  assert.equal(closed.authoredSectors,7);
  assert.equal(closed.regionObjects,14);
  assert.ok(Number.isFinite(closed.drawCalls),'renderer draw-call telemetry remains valid');
  console.log('PHASE16_STAGE close-removes-pins '+JSON.stringify({objects:closed.regionObjects,pins:closed.regionPins,draws:closed.drawCalls}));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.world-label').first().waitFor({timeout:32000});
  await wait(page,()=>window.__atlasDiagnostics?.().authoredSectors===7);
  assert.equal((await get(page)).regionPins,0);
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('starsilk.map-of-the-all.draft.v1')));
  assert.equal(persisted.version,1);
  assert.equal(persisted.regions.length,7,'All seven synthetic authored polygons survive reload unchanged');
  assert.ok(persisted.regions.every(r=>r.status==='draft'));
  assert.deepEqual(errors,[]);
  await context.close();
  const phoneContext=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const phone=await phoneContext.newPage();phone.on('pageerror',e=>errors.push('phone '+e.message));await setSeed(phone);
  await phone.goto(uri,{waitUntil:'domcontentloaded'});await phone.locator('.world-label').first().waitFor({timeout:32000});
  await wait(phone,()=>window.__atlasDiagnostics?.().authoredSectors===7);
  const mob=await get(phone);
  assert.equal(mob.regionObjects,14);assert.equal(mob.regionPins,0);
  const dims=await phone.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(dims.scroll<=dims.width,'No mobile viewport overflow');
  assert.deepEqual(errors,[]);
  await phone.screenshot({path:'atlas-qa-evidence/phase16-region-mobile.png'});
  console.log('PHASE16_BROWSER_PASS '+JSON.stringify({regions:7,closedObjects:14,selectedObjects:23,selectedPins:8,reuse:true,storedVersion:1,mobile:dims,physicalDevice:false}));
  await phoneContext.close();
}catch(error){console.error('PHASE16_BROWSER_FAIL',error.stack||error);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');clearTimeout(watchdog);}
process.exit(process.exitCode||0);
