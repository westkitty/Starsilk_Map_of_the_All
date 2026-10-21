/** Phase 17: map typography, literal draft labels and touch accessibility.
 * Disposable Playwright contexts only. No real saved user profiles.
 */
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {seedAtlas} from '../atlas-data.js';
const url='http://127.0.0.1:4173/Starsilk_Map_of_the_All/';
const binary=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'].find(existsSync);
if(!binary)throw Error('Real Chromium binary required');
const raw=seedAtlas(),target=raw.nodes.find(n=>n.id==='perseus-confluence');
const literal='LITERAL <img src=x onerror="window.__atlasInjected=true"> & a galaxy';
target.name=literal;raw.selected=target.id;
mkdirSync('atlas-qa-evidence',{recursive:true});
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let log='';for(const o of [server.stdout,server.stderr])o.on('data',d=>log+=String(d).slice(0,1200));
let browser;const watchdog=setTimeout(()=>{console.error('PHASE17_BROWSER_TIMEOUT');server.kill('SIGTERM');process.exit(124);},155000);watchdog.unref();
async function ready(){for(let n=0;n<90;n++){if(server.exitCode!==null)throw Error('Preview exited '+log);try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw Error('Preview unavailable '+log);}
try{
  await ready();browser=await chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const desk=await browser.newContext({viewport:{width:1536,height:864},reducedMotion:'reduce'});
  const page=await desk.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(data=>localStorage.setItem('starsilk.map-of-the-all.draft.v1',data),JSON.stringify(raw));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  const label=page.locator('.world-label[data-atlas-id="perseus-confluence"]');
  await label.waitFor({state:'visible',timeout:30000});
  assert.equal(await label.locator('.label-name').textContent(),literal,'editable imported name must remain literal');
  assert.equal(await label.locator('img,script,svg').count(),0,'never parse draft names into DOM elements');
  assert.equal(await page.evaluate(()=>window.__atlasInjected??false),false,'inline event strings must never execute');
  assert.match(await label.getAttribute('aria-label'),/editable atlas draft/i);
  const reference=page.locator('.world-label[data-status="reference"]').first();
  await reference.waitFor({state:'visible',timeout:30000});
  assert.match(await reference.getAttribute('aria-label'),/source reference, illustrative map position/i,
    'canonical identity is not a canonical map coordinate');
  await label.click();
  assert.equal(await page.evaluate(()=>window.__atlasInjected??false),false);
  await page.locator('[data-drawer="inspect"]').click();
  assert.equal(await page.locator('#inspectorTitle').textContent(),literal,'inspector selection survives safe label');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'atlas-qa-evidence/phase17-labels-desktop.png'});
  console.log('PHASE17_STAGE safe-draft-label-and-reference-authority');
  await desk.close();
  const touch=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const phone=await touch.newPage();phone.on('pageerror',e=>errors.push('mobile '+e.message));
  await phone.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  const labels=phone.locator('.world-label:visible');await labels.first().waitFor({timeout:30000});
  const sizes=await labels.evaluateAll(nodes=>nodes.map(el=>({name:el.querySelector('.label-name')?.textContent,height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,font:parseFloat(getComputedStyle(el).fontSize),opacity:parseFloat(getComputedStyle(el).opacity)})));
  assert.ok(sizes.length>0);
  assert.ok(sizes.every(r=>r.height>=43.5&&r.width>=43.5),'mobile/stylus label hit targets must reach 44px');
  assert.ok(sizes.every(r=>r.font>=11.8),'mobile labels must not collapse to the legacy 10px font');
  assert.ok(sizes.every(r=>r.opacity>=.81),'mobile labels must retain readable minimum opacity');
  const browserDims=await phone.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(browserDims.scroll<=browserDims.width,'labels never cause mobile horizontal overflow');
  const touchTarget=labels.first();
  await touchTarget.tap();
  assert.deepEqual(errors,[],'No runtime errors in either viewport');
  await phone.screenshot({path:'atlas-qa-evidence/phase17-labels-phone.png'});
  console.log('PHASE17_BROWSER_PASS '+JSON.stringify({literalName:true,noMarkup:true,noScriptExecution:true,sourceAuthority:true,mouseSelection:true,touchLabels:sizes.length,minTargetHeight:Math.min(...sizes.map(r=>r.height)),minFont:Math.min(...sizes.map(r=>r.font)),minAlpha:Math.min(...sizes.map(r=>r.opacity)),mobile:browserDims,physicalDevice:false}));
  await touch.close();
}catch(err){console.error('PHASE17_BROWSER_FAIL',err.stack||err);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');clearTimeout(watchdog);}
process.exit(process.exitCode||0);
