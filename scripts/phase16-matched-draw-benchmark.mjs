/** Reproducible short-run comparison against the stacked parent renderer.
 * Execute from either worktree with its own built dist; no browser profile reuse.
 */
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {seedAtlas} from '../atlas-data.js';
const uri='http://127.0.0.1:4173/Starsilk_Map_of_the_All/?atlasDiagnostics=1';
const binary=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome/chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'].find(existsSync);
if(!binary)throw Error('Chromium unavailable');
const data=seedAtlas();
const colors=['#58ccf2','#9ad6ff','#c084fc','#f5b85d','#40cdb3','#eab1e0','#8facf2'];
data.regions=data.nodes.filter(n=>n.kind==='galaxy').map((n,i)=>{
  const [x,,z]=n.position;return{id:'qa-sector-'+i,name:'EDITORIAL TEST '+i,
    affiliation:'PROVISIONAL / NOT CANON',parentId:null,status:'draft',color:colors[i],
    points:[[x-8,z-8],[x+8,z-8],[x+8,z+8],[x-8,z+8]]};
});
const server=spawn(process.execPath,['./node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:['ignore','pipe','pipe']});
let browser;const watchdog=setTimeout(()=>{server.kill('SIGTERM');process.exit(124);},125000);watchdog.unref();
try{
  let ready=false;
  for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error('Preview exited');try{if((await fetch(uri)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
  if(!ready)throw Error('Preview never responded');
  browser=await chromium.launch({headless:true,executablePath:binary,
    args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:1536,height:864},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.addInitScript(raw=>localStorage.setItem('starsilk.map-of-the-all.draft.v1',raw),JSON.stringify(data));
  await page.goto(uri,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.world-label').first().waitFor({timeout:35000});
  await page.waitForFunction(()=>{const d=window.__atlasDiagnostics?.();return d?.authoredSectors===7&&d?.renderedFrames>=5;},null,{timeout:40000});
  const info=await page.evaluate(()=>window.__atlasDiagnostics());
  console.log('PHASE16_MATCHED_DRAW '+JSON.stringify({cwd:process.cwd(),quality:info.quality,
    epoch:info.epoch,view:info.viewKind,viewport:info.viewport,
    authored:info.authoredSectors,provisional:info.provisionalCells,
    drawCalls:info.drawCalls,geometries:info.geometries,
    regionObjects:info.regionObjects??null,regionPins:info.regionPins??null}));
  await context.close();
}catch(error){console.error('PHASE16_MATCHED_DRAW_FAIL',error.stack||error);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');clearTimeout(watchdog);}
process.exit(process.exitCode||0);
