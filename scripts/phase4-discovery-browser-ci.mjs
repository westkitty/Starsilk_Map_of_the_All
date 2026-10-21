/** Phase 4: accessible navigation acceptance, synthetic profile only. */
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';

const URL='http://127.0.0.1:4173/Starsilk_Map_of_the_All/';
const binary=['/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'].find(existsSync);
if(!binary)throw Error('Chromium binary not found');
mkdirSync('atlas-qa-evidence',{recursive:true});
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let diagnostics='';
for(const stream of [server.stdout,server.stderr])stream.on('data',d=>diagnostics+=String(d).slice(0,1000));
let browser;
const destinations=[
  ['nav','leftPanel'],['inspect','rightPanel'],['edit','studioPanel'],
  ['regions','strategyPanel'],['routes','networkPanel'],['eras','temporalPanel']
];
async function ready(){
  for(let i=0;i<75;i++){if(server.exitCode!==null)throw Error('Preview crashed: '+diagnostics);
    try{if((await fetch(URL)).ok)return;}catch{}
    await new Promise(r=>setTimeout(r,250));
  }
  throw Error('Preview unavailable: '+diagnostics);
}
async function checkViewport(width,{touch}){
  const ctx=await browser.newContext({viewport:{width,height:915},isMobile:touch,hasTouch:touch,reducedMotion:'reduce'});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  try{await page.locator('.world-label').first().waitFor({timeout:18000});}
  catch(error){
    console.error('PHASE4_BOOT_DIAGNOSTIC '+JSON.stringify(await page.evaluate(()=>({
      url:location.href,readyState:document.readyState,labels:document.querySelectorAll('.world-label').length,
      loading:document.getElementById('loading')?.textContent?.slice(0,260),
      rail:document.getElementById('atlasPullTabs')?.children.length,
      webgl:document.getElementById('spaceCanvas')?.getContext('webgl2')!==null
    })))+' js_errors='+errors.join('; '));
    throw error;
  }
  assert.equal(await page.locator('#atlas').getAttribute('data-active-drawer'),'none');
  assert.equal(await page.locator('#atlasPullTabs button').count(),6);
  const measure=await page.evaluate(()=>{
    const rail=document.getElementById('atlasPullTabs');
    return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,
      railScroll:rail.scrollWidth,railClient:rail.clientWidth,
      targets:[...rail.querySelectorAll('button')].map(b=>{
        const r=b.getBoundingClientRect();
        return {id:b.dataset.drawer,x:r.x,right:r.right,top:r.top,bottom:r.bottom,
          height:r.height,width:r.width,visible:getComputedStyle(b).visibility};
      })};
  });
  assert.equal(measure.scroll,width,'no horizontal viewport overflow');
  for(const target of measure.targets){
    assert.ok(target.x>=-0.1&&target.right<=width+0.1,
      target.id+' hidden outside '+width+'px view: '+JSON.stringify(target));
    assert.ok(target.height>=(touch?43.5:39.5),target.id+' has undersized '+(touch?'touch':'pointer')+' target');
    assert.equal(target.visible,'visible');
  }
  if(width<=620)assert.ok(measure.railScroll<=measure.railClient+1,
    'all six mobile destinations must be visible without horizontal swipe');
  for(const [key,panel] of destinations){
    const b=page.locator('.atlas-pull-tab[data-drawer="'+key+'"]');
    if(touch)await b.tap();else await b.click();
    assert.equal(await page.locator('#atlas').getAttribute('data-active-drawer'),key);
    assert.equal(await b.getAttribute('aria-expanded'),'true');
    await page.locator('#'+panel).waitFor({state:'visible',timeout:8500});
    if(touch&&width===360&&key==='edit'){
      await page.locator('[data-studio-mode="route"]').tap();
      assert.equal(await page.locator('#atlas').getAttribute('data-studio-mode'),'route');
    }
    if(touch)await b.tap();else await b.click();
    if(touch&&width===360&&key==='edit')
      assert.equal(await page.locator('#atlas').getAttribute('data-studio-mode'),'orbit','closing editor cancels route mode');
    assert.equal(await page.locator('#atlas').getAttribute('data-active-drawer'),'none');
    assert.equal(await b.getAttribute('aria-expanded'),'false');
  }
  // Slash must expose the drawer BEFORE placing keyboard focus in its search.
  await page.keyboard.press('/');
  assert.equal(await page.locator('#atlas').getAttribute('data-active-drawer'),'nav');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'search');
  assert.equal(await page.locator('#leftPanel').isVisible(),true);
  if(touch){
    for(const id of ['undoBtn','redoBtn','exportBtn','importBtn']){
      const item=page.locator('#'+id);
      assert.equal(await item.isVisible(),true,id+' must be visible in Explore');
      const rect=await item.boundingBox();
      assert.ok(rect&&rect.height>=43.5,id+' must have a 44px touch target');
    }
  }
  if(touch&&width===360){
    const [download]=await Promise.all([
      page.waitForEvent('download'),page.locator('#exportBtn').tap()
    ]);
    assert.match(download.suggestedFilename(),/starsilk-map-of-the-all-draft-v1\.json$/);
    assert.equal(await page.locator('#undoBtn').isDisabled(),true,'no history at startup');
  }
  await page.locator('#search').fill('perseus');
  assert.ok(await page.locator('#searchResults .search-result').count()>0,'search results visible');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#atlas').getAttribute('data-active-drawer'),'none');
  assert.equal(await page.locator('#search').inputValue(),'','Escape clears search input');
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.drawer),'nav','focus returns to drawer trigger');
  // Explore and select a draft; reopening search must never replace selection.
  const nav=page.locator('.atlas-pull-tab[data-drawer="nav"]');
  if(touch)await nav.tap();else await nav.click();
  const perseus=page.locator('.node-btn').filter({hasText:'PERSEUS CONFLUENCE'}).first();
  if(touch)await perseus.tap();else await perseus.click();
  assert.match(await page.locator('#inspectorTitle').textContent(),/PERSEUS CONFLUENCE/);
  assert.equal(await page.locator('.atlas-pull-tab[data-drawer="inspect"]').getAttribute('data-has-selection'),'true');
  assert.match(await page.locator('.atlas-pull-tab[data-drawer="inspect"]').getAttribute('aria-label'),/PERSEUS CONFLUENCE/);
  if(touch&&width===360){
    const before=await page.locator('.node-btn').count();
    await page.locator('#addNodeBtn').tap();
    assert.equal(await page.locator('#undoBtn').isEnabled(),true);
    assert.equal(await page.locator('.node-btn').count(),before+1,'add draft should create one navigator entry');
    await page.locator('#undoBtn').tap();
    assert.equal(await page.locator('.node-btn').count(),before,'Undo restores navigator count');
    await page.locator('#redoBtn').tap();
    assert.equal(await page.locator('.node-btn').count(),before+1,'Redo restores draft object');
    await page.locator('#undoBtn').tap();
    assert.equal(await page.locator('.node-btn').count(),before,'second Undo preserves starting seed');
  }
  if(touch)await nav.tap();else await nav.click();
  await page.keyboard.press('/');
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'search');
  assert.match(await page.locator('#inspectorTitle').textContent(),/PERSEUS CONFLUENCE/);
  assert.equal(errors.length,0,'browser JS errors: '+errors.join('; '));
  await page.screenshot({path:'atlas-qa-evidence/phase4-navigation-'+width+'.png'});
  console.log('PHASE4_DISCOVERY_VIEW_PASS '+JSON.stringify({width,targets:measure.targets.length,
    minHeight:Math.min(...measure.targets.map(t=>t.height)),viewportOverflow:measure.scroll-width,
    railOverflow:measure.railScroll-measure.railClient,errors:errors.length}));
  await ctx.close();
}
try{
 await ready();
 browser=await chromium.launch({headless:true,executablePath:binary,
   args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 await checkViewport(360,{touch:true});
 await checkViewport(412,{touch:true});
 await checkViewport(1280,{touch:false});
 console.log('PHASE4_DISCOVERY_BROWSER_PASS all_six_visible=true search_focus=true escape_focus=true selection_preserved=true');
}catch(error){console.error('PHASE4_DISCOVERY_BROWSER_FAIL',error.stack||error);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');}
process.exit(process.exitCode||0);
