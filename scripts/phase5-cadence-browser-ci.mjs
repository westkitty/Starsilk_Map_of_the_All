/** Phase 5 honest frame cadence and renderer-lifecycle proof.
 * Runs in isolated, disposable Playwright contexts. No real user drafts.
 */
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const URL='http://127.0.0.1:4173/Starsilk_Map_of_the_All/?atlasDiagnostics=1';
const binary=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'].find(existsSync);
if(!binary)throw Error('Chromium binary required for frame-cadence proof');
mkdirSync('atlas-qa-evidence',{recursive:true});
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let serverLog='';for(const stream of [server.stdout,server.stderr])stream.on('data',d=>serverLog+=String(d).slice(0,1500));
let browser;
const watchdog=setTimeout(()=>{console.error('CADENCE_BROWSER_TIMEOUT');server.kill('SIGTERM');process.exit(124);},220000);watchdog.unref();
async function ready(){for(let n=0;n<90;n++){if(server.exitCode!==null)throw Error('Preview died '+serverLog);
  try{if((await fetch(URL)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}
  throw Error('Preview unavailable '+serverLog);
}
const metric=page=>page.evaluate(()=>window.__atlasDiagnostics?.()||null);
async function sample(page,label,previousFrame=0){
  // A view/era state change is not renderer proof until fresh frames exist.
  await page.waitForFunction(prev=>{const m=window.__atlasDiagnostics?.();
    return m&&m.renderedFrames>=prev+3&&m.sampleCount>=8&&Number.isFinite(m.fps)&&m.fps>0;
  },previousFrame,{timeout:35000});
  const m=await metric(page);
  assert.ok(m&&m.sampleCount>=8,label+' requires actual callback timestamp samples');
  assert.equal(Object.hasOwn(m,'nodes'),false,'read-only diagnostics never serialize drafts');
  assert.equal(Object.hasOwn(m,'routes'),false,'read-only diagnostics never return saved routes');
  assert.ok(m.fps>0&&m.fps<300,label+' cadence FPS must be a realistic rate');
  for(const key of ['frameP50Ms','frameP95Ms','frameP99Ms','callbackP95Ms']){
    assert.ok(Number.isFinite(m[key])&&m[key]>=0,label+' '+key+' finite');
  }
  assert.ok(m.frameP50Ms<=m.frameP95Ms&&m.frameP95Ms<=m.frameP99Ms,
    label+' frame percentiles must be nondecreasing');
  for(const key of ['drawCalls','geometries','textures','triangles'])
    assert.ok(Number.isFinite(m[key])&&m[key]>=0,label+' '+key+' finite');
  console.log('CADENCE_SAMPLE '+JSON.stringify({label,view:m.viewKind,epoch:m.epoch,
    viewport:m.viewport,quality:m.quality,frames:m.sampleCount,renderedFrames:m.renderedFrames,
    fps:m.fps,medianFps:m.medianFps,p50:m.frameP50Ms,p95:m.frameP95Ms,p99:m.frameP99Ms,
    callbackP95:m.callbackP95Ms,slowPct:m.slowFramePct,
    geometries:m.geometries,textures:m.textures,drawCalls:m.drawCalls,
    resumeCount:m.resumeCount}));
  return m;
}
async function desktop(){
  const context=await browser.newContext({viewport:{width:1536,height:864},reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.world-label').first().waitFor({timeout:35000});
  const origin=await sample(page,'desktop/all/balanced');
  assert.equal(origin.viewKind,'all');assert.equal(origin.epoch,'post');
  // Use the same real navigation as the existing stellar acceptance suite.
  await page.locator('[data-drawer="nav"]').click();
  await page.locator('.node-btn').filter({hasText:'PERSEUS CONFLUENCE'}).first().click();
  await page.locator('[data-drawer="inspect"]').click();
  await page.locator('#enterBtn').click();
  await page.waitForFunction(()=>window.__atlasDiagnostics?.().viewKind==='galaxy',{timeout:12000});
  const galaxy=await sample(page,'desktop/galaxy',origin.renderedFrames);
  await page.locator('.world-label[data-atlas-id="perseus-confluence-system-1"]').click();
  await page.locator('#stellarDiveButton').click();
  await page.waitForFunction(()=>window.__atlasDiagnostics?.().viewKind==='system',{timeout:12000});
  const system=await sample(page,'desktop/system',galaxy.renderedFrames);
  await page.keyboard.press('Home');
  await page.waitForFunction(()=>window.__atlasDiagnostics?.().viewKind==='all',{timeout:12000});
  await page.waitForTimeout(1600);
  const restored=await sample(page,'desktop/all/returned',system.renderedFrames);
  assert.ok(restored.geometries<=origin.geometries+12,
    'repeated scene teardown must not retain geometries: '+origin.geometries+' -> '+restored.geometries);
  // The three era snapshots are separate renderer rebuilds; no schema mutations.
  await page.locator('[data-drawer="eras"]').click();
  await page.locator('.era-btn').filter({hasText:'BLOOD ECLIPSE'}).click();
  await page.waitForFunction(()=>window.__atlasDiagnostics?.().epoch==='war');
  const war=await sample(page,'desktop/war',restored.renderedFrames);
  await page.locator('#temporalScrub').evaluate(e=>{e.value='1';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForFunction(()=>window.__atlasDiagnostics?.().epoch==='locking');
  const locking=await sample(page,'desktop/locking',war.renderedFrames);
  await page.locator('.era-btn').filter({hasText:'POST-SIEGE'}).click();
  await page.waitForFunction(()=>window.__atlasDiagnostics?.().epoch==='post');
  const returnedEra=await sample(page,'desktop/post-return',locking.renderedFrames);
  assert.ok(returnedEra.geometries<=origin.geometries+12,
    'three-era roundtrip must not retain disposed geometry');
  assert.deepEqual(errors,[],'No browser JS errors in frame/lifecycle path');
  await page.screenshot({path:'atlas-qa-evidence/phase5-cadence-desktop.png'});
  await context.close();
  return {origin:origin.geometries,returned:restored.geometries,
    galaxy:galaxy.drawCalls,system:system.drawCalls};
}
async function mobile(){
  const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.locator('.world-label').first().waitFor({timeout:35000});
  const initial=await sample(page,'touch-emulated/all');
  assert.equal(initial.viewKind,'all');
  assert.equal(await page.locator('.atlas-pull-tab').count(),6);
  assert.equal(errors.length,0,'No mobile runtime exceptions');
  await page.screenshot({path:'atlas-qa-evidence/phase5-cadence-mobile.png'});
  await context.close();
  return {fps:initial.fps,samples:initial.sampleCount};
}
try{await ready();browser=await chromium.launch({headless:true,executablePath:binary,
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const d=await desktop();const m=await mobile();
  console.log('PHASE5_CADENCE_BROWSER_PASS '+JSON.stringify({desktop:d,mobile:m,physicalDevice:false}));
}catch(e){console.error('PHASE5_CADENCE_BROWSER_FAIL',e.stack||e);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');clearTimeout(watchdog);}
process.exit(process.exitCode||0);
