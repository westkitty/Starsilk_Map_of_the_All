/** Live-render contract for the All: no first-frame curve crash, no invasive HUD. */
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const ROOT='http://127.0.0.1:4173/Starsilk_Map_of_the_All/';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'].find(existsSync);
if(!chrome)throw Error('Chrome/Chromium browser unavailable');
mkdirSync('atlas-qa-evidence',{recursive:true});
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let logs='';for(const s of [server.stdout,server.stderr])s.on('data',c=>logs+=String(c).slice(0,1600));
let browser;const timeout=setTimeout(()=>{console.error('FOCUS_BROWSER_TIMEOUT');server.kill('SIGTERM');process.exit(124);},165000);timeout.unref();
async function ready(){for(let i=0;i<70;i++){if(server.exitCode!==null)throw Error('Preview exited '+logs);try{if((await fetch(ROOT)).ok)return}catch{}await new Promise(r=>setTimeout(r,250))}throw Error('Preview not ready '+logs)}
async function test(){await ready();browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const errors=[];
 for(const [name,w,h,touch] of [['desktop',1536,864,false],['tablet',1280,800,true],['phone',412,915,true]]){
   const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:touch,hasTouch:touch,reducedMotion:'reduce'});
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));
   const res=await page.goto(ROOT,{waitUntil:'domcontentloaded',timeout:30000});assert.equal(res.status(),200);
   await page.locator('.world-label').first().waitFor({timeout:30000});
   await page.waitForFunction(()=>Number(document.querySelector('#drawCalls')?.textContent)>0,{timeout:25000});
   assert.equal(await page.locator('#atlas').getAttribute('data-active-drawer'),'none');
   for(const id of ['leftPanel','rightPanel','studioPanel','strategyPanel','networkPanel','temporalPanel'])assert.equal(await page.locator('#'+id).isVisible(),false,id+' default collapsed');
   assert.equal(await page.locator('.atlas-pull-tab').count(),6);
   const geom=await page.evaluate(()=>{const c=document.getElementById('spaceCanvas').getBoundingClientRect();const rail=document.getElementById('atlasPullTabs').getBoundingClientRect();return {canvas:[c.width,c.height],rail:[rail.width,rail.height],scroll:document.documentElement.scrollWidth,viewport:innerWidth,draws:Number(document.getElementById('drawCalls').textContent),buttons:[...document.querySelectorAll('.atlas-pull-tab')].map(e=>({label:e.textContent,height:e.getBoundingClientRect().height,expanded:e.getAttribute('aria-expanded')}))}});
   assert.ok(geom.canvas[0]>=w-1&&geom.canvas[1]>=h-1,'canvas occupies full viewport');
   assert.ok(geom.draws>0,'scene actually renders GPU draw calls');
   assert.ok(geom.scroll<=geom.viewport,'no horizontal page overflow');
   assert.ok(geom.buttons.every(x=>x.height>=36&&!x.expanded.includes('true')),'accessible collapsed tabs');
   await page.screenshot({path:'atlas-qa-evidence/all-visible-'+name+'.png'});
   await page.locator('[data-drawer="nav"]').click();assert.equal(await page.locator('#leftPanel').isVisible(),true);
   assert.equal(await page.locator('#quality').isVisible(),true,'quality settings moved into Explore');
   if(name==='desktop'){
     const layers=page.locator('#layerControls input[type=checkbox]');
     assert.equal(await layers.count(),11);
     await page.locator('#allLayersBtn').click();
     assert.equal(await page.locator('#layerControls input[type=checkbox]:checked').count(),11,'first master click enables mixed layer set');
     await page.locator('#allLayersBtn').click();
     assert.equal(await page.locator('#layerControls input[type=checkbox]:checked').count(),0,'second master click disables all layers');
     await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
     const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starsilk.map-of-the-all.draft.v1')));
     assert.ok(Object.values(saved.layers).every(v=>v===false),'pagehide flushes pending edits');
     await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'h',ctrlKey:true,bubbles:true,cancelable:true})));
     assert.equal(await page.locator('#atlas').evaluate(el=>el.classList.contains('focus-view')),false,'Ctrl+H stays a browser shortcut');
   }
   await page.locator('[data-drawer="inspect"]').click();assert.equal(await page.locator('#rightPanel').isVisible(),true);
   assert.equal(await page.locator('#leftPanel').isVisible(),false);
   await page.keyboard.press('Escape');assert.equal(await page.locator('#rightPanel').isVisible(),false);
   await page.locator('[data-drawer="edit"]').click();assert.equal(await page.locator('#studioPanel').isVisible(),true);
   await page.locator('[data-drawer="regions"]').click();assert.equal(await page.locator('#strategyPanel').isVisible(),true);
   await page.locator('[data-drawer="routes"]').click();assert.equal(await page.locator('#networkPanel').isVisible(),true);
   await page.locator('[data-drawer="eras"]').click();assert.equal(await page.locator('#temporalPanel').isVisible(),true);
   assert.equal(await page.locator('#eraOptions').isVisible(),true);
   await page.locator('[data-drawer="eras"]').click();assert.equal(await page.locator('#temporalPanel').isVisible(),false);
   assert.ok(await page.locator('#drawCalls').textContent(),'GPU remains active after drawer transitions');
   await ctx.close();console.log('FOCUS_STAGE '+name+' '+JSON.stringify(geom));
 }
 // A corrupt old draft must remain in browser storage until explicit replacement.
 const rejected='{"broken":[';
 const recoveryContext=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true,reducedMotion:'reduce'});
 await recoveryContext.addInitScript(raw=>localStorage.setItem('starsilk.map-of-the-all.draft.v1',raw),rejected);
 const recovery=await recoveryContext.newPage();recovery.on('pageerror',e=>errors.push('recovery: '+e.message));
 await recovery.goto(ROOT,{waitUntil:'domcontentloaded'});
 await recovery.locator('[data-drawer="nav"]').click();
 assert.equal(await recovery.locator('#atlasRecoveryTools').isVisible(),true,'recovery is discoverable in Explore');
 await recovery.locator('#allLayersBtn').click();
 assert.equal(await recovery.evaluate(()=>localStorage.getItem('starsilk.map-of-the-all.draft.v1')),rejected,'invalid raw draft is not overwritten by edits');
 const [download]=await Promise.all([
   recovery.waitForEvent('download'),
   recovery.locator('#atlasRecoveryTools button').first().click()
 ]);
 assert.ok(download.suggestedFilename().includes('rejected-local-draft'));
 assert.equal(await recovery.evaluate(()=>localStorage.getItem('starsilk.map-of-the-all.draft.v1')),rejected,'download never mutates original bytes');
 recovery.once('dialog',dialog=>dialog.accept());
 await recovery.locator('#atlasRecoveryTools button').last().click();
 await recovery.waitForFunction(()=>{try{return JSON.parse(localStorage.getItem('starsilk.map-of-the-all.draft.v1')).version===1}catch{return false}});
 assert.equal(await recovery.locator('#atlasRecoveryTools').count(),0,'explicit replacement clears recovery UI');
 await recoveryContext.close();
 console.log('FOCUS_STAGE recovery preserved-download-and-explicit-replace');
 assert.deepEqual(errors,[],'no page errors, including negative curve sampling');
 console.log('FOCUS_BROWSER_PASS noFirstFrameError=true drawers=6 views=3 graphics=true');
}
try{await test();}catch(e){console.error('FOCUS_BROWSER_FAIL',e.stack||e);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');clearTimeout(timeout)}
process.exit(process.exitCode||0);
