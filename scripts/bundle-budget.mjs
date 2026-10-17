// Standalone Atlas production contract. Keep regression budgets explicit.
import {readdirSync,readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {join} from 'node:path';

const root=new URL('../dist/',import.meta.url);
const html=readFileSync(new URL('index.html',root),'utf8');
if(!html.includes('/Starsilk_Map_of_the_All/assets/'))throw Error('Wrong GitHub Pages base path');
if(!html.includes('https://westkitty.github.io/Star_System_Planner/'))throw Error('Missing independent Planner handoff');
const assets=readdirSync(new URL('assets/',root)).filter(x=>/\.(js|css)$/.test(x));
if(!assets.some(x=>x.endsWith('.js'))||!assets.some(x=>x.endsWith('.css')))throw Error('Atlas assets missing');
let total=0;
const metrics=assets.map(name=>{
  const bytes=readFileSync(new URL('assets/'+name,root));
  const gzip=gzipSync(bytes,{level:9}).byteLength;
  total+=gzip;
  return {name,bytes:bytes.byteLength,gzip};
});
const budgetBytes=225000;
console.log('ATLAS_BUNDLE_BUDGET '+JSON.stringify({gzipTotal:total,budgetBytes,assets:metrics}));
if(total>budgetBytes)throw Error('Atlas exceeds compressed JS/CSS delivery budget');
