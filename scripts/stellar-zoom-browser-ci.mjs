/** Phase 3 original semantic-zoom acceptance; entirely disposable Brave profile. */
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {seedAtlas} from '../atlas-data.js';
const URL='http://127.0.0.1:4173/Starsilk_Map_of_the_All/';
const binary=['/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'].find(existsSync);
if(!binary)throw Error('Chromium binary missing');
mkdirSync('atlas-qa-evidence',{recursive:true});
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let logs='';for(const stream of [server.stdout,server.stderr])stream.on('data',d=>logs+=String(d).slice(0,1000));
let browser;
async function ready(){for(let i=0;i<75;i++){if(server.exitCode!==null)throw Error('Preview died '+logs);try{if((await fetch(URL)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw Error('Preview not available '+logs);}
async function test(){
 await ready();
 browser=await chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(URL,{waitUntil:'domcontentloaded'});
 await page.locator('.world-label').first().waitFor();
 assert.equal(await page.locator('#stellarHud').isVisible(),false);
 assert.equal(await page.locator('#stellarDive').isVisible(),false);
 await page.locator('[data-drawer="nav"]').click();
 await page.locator('.node-btn').filter({hasText:'PERSEUS CONFLUENCE'}).click();
 await page.locator('[data-drawer="inspect"]').click();
 await page.locator('#enterBtn').click();
 await page.locator('.world-label[data-atlas-id="perseus-confluence-system-1"]').waitFor({state:'visible',timeout:15000});
 assert.equal(await page.locator('#stellarHud').isVisible(),false);
 await page.locator('.world-label[data-atlas-id="perseus-confluence-system-1"]').click();
 await page.locator('#stellarDive').waitFor({state:'visible'});
 const expectedSystem=seedAtlas().nodes.find(n=>n.id==='perseus-confluence-system-1');
 assert.equal(await page.locator('#stellarDiveName').textContent(),expectedSystem.name);
 await page.locator('#stellarDiveButton').click();
 await page.locator('#stellarHud').waitFor({state:'visible'});
 assert.match(await page.locator('#stellarHudInfo').textContent(),/3 DRAFT PLANETS/);
 await page.locator('#stellarOverviewButton').click();
 assert.equal(await page.locator('#stellarHud').isVisible(),true);
 // Planet inspection and stepwise ascent must coexist with the new HUD.
 const planet=page.locator('.world-label[data-atlas-id="perseus-confluence-system-1-planet-1"]');
 await planet.waitFor({state:'visible',timeout:12000});
 await planet.click();
 assert.match(await page.locator('#inspectorTitle').textContent(),/UNNAMED 1/);
 await page.locator('#stellarBackButton').click();
 assert.equal(await page.locator('#stellarHud').isVisible(),true,'first back clears planet selection');
 await page.locator('#stellarBackButton').click();
 await page.locator('#stellarDive').waitFor({state:'visible'});
 assert.equal(await page.locator('#stellarHud').isVisible(),false);
 console.log('STELLAR_HUD_PASS galaxy_system_back_overview=true');
 await page.locator('[data-drawer="edit"]').click();
 await page.locator('[data-studio-mode="move"]').click();
 await page.mouse.move(610,380);await page.mouse.wheel(0,-320);
 await page.waitForTimeout(350);
 assert.equal(await page.locator('#stellarHud').isVisible(),false,'wheel must never descend while editing');
 await page.locator('[data-studio-mode="orbit"]').click();
 await page.locator('[data-drawer="edit"]').click();
 await page.evaluate(()=>{
   window.__stellarWheelProbe=[];
   document.addEventListener('wheel',ev=>window.__stellarWheelProbe.push({
     target:ev.target.id||ev.target.className||ev.target.tagName,deltaY:ev.deltaY,defaultPrevented:ev.defaultPrevented
   }),{capture:true});
 });
 await page.keyboard.press('f');await page.waitForTimeout(500);
 console.log('STELLAR_PRE_ZOOM '+JSON.stringify(await page.evaluate(()=>({
   selectedLabel:document.querySelector('.world-label.selected')?.dataset.atlasId,
   activeDrawer:document.getElementById('atlas')?.dataset.activeDrawer,
   hoveredTag:document.elementFromPoint(620,400)?.outerHTML.slice(0,160),
   notifications:document.querySelector('#notifications')?.textContent?.slice(-180),
   diveHidden:document.getElementById('stellarDive').hidden
 }))));
 const selectedBox=await page.locator('.world-label.selected').boundingBox();
 assert.ok(selectedBox,'selected stellar system label must remain accessible');
 const pointer={x:selectedBox.x+selectedBox.width/2,y:selectedBox.y+selectedBox.height/2};
 const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('.world-label')?.dataset.atlasId||null,pointer);
 assert.equal(hit,expectedSystem.id,'selected label must be visible before zoom');
 // Synthetic, targeted wheel verifies label-to-canvas event bridging without
 // relying on label motion between pointer hover and real wheel dispatch.
 const bridged=await page.evaluate(()=>{
   const canvas=document.getElementById('spaceCanvas');
   const label=document.querySelector('.world-label.selected');
   const received=[];
   const watch=ev=>received.push({deltaY:ev.deltaY,target:ev.target.id});
   canvas.addEventListener('wheel',watch,{capture:true});
   label.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:-40}));
   canvas.removeEventListener('wheel',watch,{capture:true});
   return received;
 });
 assert.ok(bridged.some(e=>e.target==='spaceCanvas'&&e.deltaY===-40),'label wheel must forward into OrbitControls canvas');
 console.log('STELLAR_LABEL_BRIDGE_PASS synthetic_target_wheel=true');
 for(let i=0;i<5&&!(await page.locator('#stellarHud').isVisible());i++){
   await page.mouse.move(pointer.x,pointer.y);await page.mouse.wheel(0,-340);await page.waitForTimeout(180);
 }
 if(!(await page.locator('#stellarHud').isVisible())){
   console.error('STELLAR_ZOOM_PROBE '+JSON.stringify(await page.evaluate(()=>({
     wheel:window.__stellarWheelProbe,
     selected:document.querySelector('.world-label.selected')?.dataset.atlasId,
     hud:document.getElementById('stellarHud').hidden,
     notifications:document.querySelector('#notifications')?.textContent?.slice(-220)
   }))));
 }
 await page.locator('#stellarHud').waitFor({state:'visible',timeout:3000});
 const wheelEvents=await page.evaluate(()=>window.__stellarWheelProbe||[]);
 assert.ok(wheelEvents.some(w=>w.target==='spaceCanvas'),'a real wheel must reach the WebGL canvas');
 assert.equal(errors.length,0,'No browser JS errors: '+errors.join('; '));
 await page.screenshot({path:'atlas-qa-evidence/stellar-zoom-desktop.png'});
 await context.close();
 console.log('STELLAR_LABEL_WHEEL_PASS from_label=true forwarded_to_canvas=true');
 const mobile=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const phone=await mobile.newPage();const mobileErrors=[];phone.on('pageerror',e=>mobileErrors.push(e.message));
 await phone.goto(URL,{waitUntil:'domcontentloaded'});
 await phone.locator('.world-label').first().waitFor();
 await phone.locator('[data-drawer="nav"]').tap();
 await phone.locator('.node-btn').filter({hasText:'PERSEUS CONFLUENCE'}).tap();
 await phone.locator('[data-drawer="inspect"]').tap();
 await phone.locator('#enterBtn').tap();
 // The inspector is an intentional mobile overlay; dismiss before interacting
 // with underlying stellar labels, exactly as a touch user must.
 await phone.locator('#closeMobileInspector').tap();
 assert.equal(await phone.locator('#rightPanel').isVisible(),false,'mobile inspector dismissal must expose 3D view');
 await phone.locator('.world-label[data-atlas-id="perseus-confluence-system-1"]').waitFor({state:'visible',timeout:12000});
 await phone.locator('.world-label[data-atlas-id="perseus-confluence-system-1"]').tap();
 await phone.locator('#stellarDive').waitFor({state:'visible',timeout:10000});
 await phone.locator('#stellarDiveButton').tap();
 await phone.locator('#stellarHud').waitFor({state:'visible',timeout:10000});
 const hud=await phone.locator('#stellarHud').boundingBox();
 assert.ok(hud&&hud.x>=0&&hud.x+hud.width<=412,'touch HUD must fit phone viewport');
 await phone.locator('#stellarBackButton').tap();
 await phone.locator('#stellarDive').waitFor({state:'visible'});
 assert.equal(mobileErrors.length,0,'No mobile JS errors: '+mobileErrors.join('; '));
 await phone.screenshot({path:'atlas-qa-evidence/stellar-zoom-mobile.png'});
 await mobile.close();
 console.log('STELLAR_BROWSER_PASS deliberate_inward_dolly=true label_forwarding=true edit_guard=true noncanon_hud=true touch_hud=true');
}
try{await test();}catch(e){console.error('STELLAR_BROWSER_FAIL',e.stack||e);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');}
process.exit(process.exitCode||0);
