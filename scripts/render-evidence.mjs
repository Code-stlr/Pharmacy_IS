import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const {chromium}=await import(pathToFileURL(path.join(root,'frontend/node_modules/playwright/index.mjs')));
const out=path.join(root,'.build/evidence-previews');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1600,height:1200}});
 for(const name of ['domain-erd']){
  await page.goto(pathToFileURL(path.join(root,'docs/diagrams',name+'.svg')).href);
  await page.locator('svg').screenshot({path:path.join(out,name+'.png')});
 }
}finally{await browser.close()}
