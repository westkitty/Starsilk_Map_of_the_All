/** Real built legacy Planner and candidate standalone Atlas, one disposable origin.
 * Inputs: <atlas-dist> <planner-dist>. No production URLs, user profiles or writes.
 */
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname,join} from 'node:path';
import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {seedAtlas,STORAGE_KEY,validateAtlas} from '../atlas-data.js';
import {setSuppressed} from '../visual-suppression.js';
import {ensureTimeline,syncEra} from '../temporal-model.js';
import {readDraft} from '../draft-recovery.js';

const atlasRoot=resolve(process.argv[2]||'dist');
const plannerRoot=resolve(process.argv[3]||'planner/dist');
const retiredPreview=process.argv.includes('--retired');
const binary=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'].find(existsSync);
if(!binary)throw Error('Headless Chromium unavailable');
for(const [name,root] of [['standalone',atlasRoot],['Planner',plannerRoot]]){
  if(!existsSync(join(root,'index.html')))throw Error(name+' built HTML missing at '+root);
}
if(!existsSync(join(plannerRoot,'map-of-the-all','index.html')))
  throw Error('Pinned Planner distribution has no embedded Atlas entrypoint');
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
  '.css':'text/css;charset=utf-8','.json':'application/json;charset=utf-8',
  '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon',
  '.woff':'font/woff','.woff2':'font/woff2'};
const prefixes=[['/Starsilk_Map_of_the_All/',atlasRoot],['/Star_System_Planner/',plannerRoot]];
const server=createServer(async(req,res)=>{
  try{
    const uri=new URL(req.url,'http://127.0.0.1');
    const match=prefixes.find(([prefix])=>uri.pathname.startsWith(prefix));
    if(!match){res.writeHead(404);res.end('Unknown app route');return;}
    const sub=decodeURIComponent(uri.pathname.slice(match[0].length));
    const path=resolve(match[1],sub||'index.html');
    if(!path.startsWith(match[1]+sep)){res.writeHead(403);res.end();return;}
    const target=(await stat(path)).isDirectory()?join(path,'index.html'):path;
    const bytes=await readFile(target);
    res.writeHead(200,{'content-type':MIME[extname(target)]||'application/octet-stream',
      'cache-control':'no-store','x-content-type-options':'nosniff'});
    res.end(bytes);
  }catch(e){res.writeHead(404);res.end('Fixture not found');}
});
let browser;
const watchdog=setTimeout(()=>{console.error('PHASE6_TWO_CLIENT_TIMEOUT');process.exit(124);},210000);
watchdog.unref();
try{
  await new Promise((done,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',done);});
  const base='http://127.0.0.1:'+server.address().port;
  const fixture=seedAtlas();ensureTimeline(fixture);
  fixture.nodes.find(n=>n.id==='ember-span').name='QA CROSS-WRITER SURVIVAL MARKER';
  setSuppressed(fixture,'network:all',true);syncEra(fixture);
  assert.deepEqual(validateAtlas(fixture),[]);
  const original=JSON.stringify(fixture);
  browser=await chromium.launch({headless:true,executablePath:binary,
    args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:1536,height:864},
    reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:true});
  await context.addInitScript(({key,raw})=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,raw);
  },{key:STORAGE_KEY,raw:original});
  const current=await context.newPage();
  const errors=[];current.on('pageerror',e=>errors.push('dedicated:'+e.message));
  await current.goto(base+'/Starsilk_Map_of_the_All/',{waitUntil:'domcontentloaded',timeout:35000});
  await current.locator('.world-label').first().waitFor({timeout:35000});
  assert.equal(await current.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),original);
  const before=readDraft(original);
  assert.equal(before.rejectedRaw,null);
  console.log('PHASE6_TWO_CLIENT_STAGE dedicated-original-valid');

  const legacy=await context.newPage();legacy.on('pageerror',e=>errors.push('legacy:'+e.message));
  await legacy.goto(base+'/Star_System_Planner/map-of-the-all/',{waitUntil:'domcontentloaded',timeout:35000});
  if(retiredPreview){
    await legacy.locator('#exportRawDraft').waitFor({timeout:35000});
    assert.equal(await legacy.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),original,
      'Read-only migration entry must not modify the shared draft');
    assert.equal(await legacy.locator('#allLayersBtn').count(),0,
      'Retired entry must not load the legacy editor controls');
    const downloadPromise=legacy.waitForEvent('download',{timeout:12000});
    await legacy.locator('#exportRawDraft').click();
    const download=await downloadPromise;
    const exported=(await readFile(await download.path())).toString('utf8');
    assert.equal(exported,original,'Retirement entry must export byte-identical browser JSON');
    assert.equal(await legacy.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),original,
      'Download must not change the saved key');
    assert.equal(await current.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),original,
      'Opening retirement page must leave the modern client draft unchanged');
    assert.equal(await legacy.locator('a[href="https://westkitty.github.io/Starsilk_Map_of_the_All/"]').count(),1,
      'Retirement entry must link to authoritative standalone Atlas');
    assert.equal(errors.length,0,'Read-only retirement page and modern Atlas must have no runtime exceptions');
    // No-draft profiles must not offer a misleading export or create a key.
    const emptyContext=await browser.newContext({serviceWorkers:'block',acceptDownloads:true});
    const emptyPage=await emptyContext.newPage();
    await emptyPage.goto(base+'/Star_System_Planner/map-of-the-all/',{waitUntil:'domcontentloaded',timeout:35000});
    assert.equal(await emptyPage.locator('#exportRawDraft').isDisabled(),true);
    assert.equal(await emptyPage.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),null);
    await emptyContext.close();

    // Invalid raw JSON must still be downloadable byte-for-byte without normalization.
    const malformed='{__PHASE6_INVALID_JSON__\u00f8';
    const malformedContext=await browser.newContext({serviceWorkers:'block',acceptDownloads:true});
    await malformedContext.addInitScript(({key,raw})=>localStorage.setItem(key,raw),
      {key:STORAGE_KEY,raw:malformed});
    const malformedPage=await malformedContext.newPage();
    await malformedPage.goto(base+'/Star_System_Planner/map-of-the-all/',{waitUntil:'domcontentloaded',timeout:35000});
    const malformedDownload=malformedPage.waitForEvent('download',{timeout:12000});
    await malformedPage.locator('#exportRawDraft').click();
    const badFile=await malformedDownload;
    assert.equal((await readFile(await badFile.path())).toString('utf8'),malformed);
    assert.equal(await malformedPage.evaluate(key=>localStorage.getItem(key),STORAGE_KEY),malformed);
    await malformedContext.close();

    // The independent orbital Planner's root app must still mount after the preview build.
    const root=await context.newPage();root.on('pageerror',e=>errors.push('planner:'+e.message));
    await root.goto(base+'/Star_System_Planner/',{waitUntil:'domcontentloaded',timeout:35000});
    await root.waitForFunction(()=>document.getElementById('root')?.childElementCount>0,null,{timeout:35000});
    assert.equal(errors.length,0,'Root Planner and both Atlas surfaces must not throw browser errors: '+errors.join(' / '));
    await root.close();
    console.log('PHASE6_LEGACY_RETIREMENT_PREVIEW_PASS no_legacy_controls=true bytes_preserved=true exact_raw_download=true malformed_raw_roundtrip=true empty_profile_unchanged=true planner_root_mounted=true disposable_profiles_only=true');
    await context.close();
  }else{
  await legacy.locator('.world-label').first().waitFor({timeout:35000});
  await legacy.locator('[data-drawer="nav"]').click();
  await legacy.locator('#allLayersBtn').click();
  await legacy.waitForFunction(({key,old})=>localStorage.getItem(key)!==old,
    {key:STORAGE_KEY,old:original},{timeout:12000});
  const overwritten=await legacy.evaluate(key=>localStorage.getItem(key),STORAGE_KEY);
  const parsed=JSON.parse(overwritten);
  assert.equal(parsed.version,1,'old writer must be using the same v1 key');
  const markerPresent=parsed.nodes.some(n=>n.id==='ember-span'&&n.name==='QA CROSS-WRITER SURVIVAL MARKER');
  const suppressionPresent=parsed.timeline?.snapshots?.post?.suppressedVisuals?.includes('network:all')===true;
  assert.ok(!markerPresent||!suppressionPresent,'legacy writer unexpectedly preserved all synthetic new-client values');
  const newerRead=readDraft(overwritten);
  // The modern tab must retain its open draft without writing over the legacy mutation.
  await current.waitForFunction(()=>document.querySelector('#savedStatus')?.textContent?.includes('EXTERNAL WRITE'),null,{timeout:12000});
  const survivor=await current.evaluate(({key})=>({
    shared:localStorage.getItem(key),
    session:sessionStorage.getItem(key),
    fallback:sessionStorage.getItem(key+'.sessionFallback'),
    status:document.querySelector('#savedStatus')?.textContent
  }),{key:STORAGE_KEY});
  assert.equal(survivor.shared,overwritten,'Modern tab must not automatically clobber conflicting shared draft');
  assert.equal(survivor.fallback,'1','Modern tab must flag a session-only backup');
  const savedSession=JSON.parse(survivor.session);
  assert.equal(savedSession.nodes.find(n=>n.id==='ember-span')?.name,'QA CROSS-WRITER SURVIVAL MARKER');
  assert.ok(savedSession.timeline?.snapshots?.post?.suppressedVisuals?.includes('network:all'),
    'Modern open session must preserve era suppression');
  console.log('PHASE6_MODERN_CONFLICT_FENCE_PASS same_origin=true session_backup=true no_reoverwrite=true');
  console.log('PHASE6_TWO_CLIENT_WRITER_COLLISION '+JSON.stringify({
    sharedOrigin:true,storageKey:STORAGE_KEY,legacyWrote:true,
    lostNamedDraft:!markerPresent,lostEraSuppression:!suppressionPresent,
    currentReaderRejected:newerRead.rejectedRaw!==null,
    source:'pinned compiled Planner, built candidate Atlas',realUserData:false}));
  assert.equal(errors.length,0,'Both built clients must run without JS runtime errors: '+errors.join(' / '));
  await context.close();
  console.log('PHASE6_TWO_CLIENT_BROWSER_PASS disposable_profiles_only=true pinned_legacy=true');
  }
}catch(e){console.error('PHASE6_TWO_CLIENT_BROWSER_FAIL',e.stack||e);process.exitCode=1;}
finally{await browser?.close();await new Promise(done=>server.close(done));clearTimeout(watchdog);}
process.exit(process.exitCode||0);
