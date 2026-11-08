import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'docs/diagrams');
const build=path.join(root,'.build/diagrams');
await fs.mkdir(build,{recursive:true});
const markdown=await fs.readFile(path.join(out,'domain-erd.md'),'utf8');
const mermaid=markdown.match(/```mermaid\r?\n([\s\S]*?)```/)[1];
await fs.writeFile(path.join(build,'domain-erd.mmd'),mermaid);
const browser=process.env.DIAGRAM_BROWSER;
if(!browser)throw new Error('Set DIAGRAM_BROWSER to a Chromium executable. Install @mermaid-js/mermaid-cli under .build/diagrams with browser download disabled.');
await fs.writeFile(path.join(build,'browser.json'),JSON.stringify({executablePath:browser}));
execFileSync(process.execPath,[path.join(build,'node_modules/@mermaid-js/mermaid-cli/src/cli.js'),'-i',path.join(build,'domain-erd.mmd'),'-o',path.join(out,'domain-erd.svg'),'-p',path.join(build,'browser.json'),'-b','white'],{stdio:'inherit'});

const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const start=(w,h,title)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><style>text{font-family:Arial,sans-serif;fill:#263746} .box{fill:white;stroke:#176b62;stroke-width:2}.link{fill:none;stroke:#6b7280;stroke-width:1.5}</style><rect width="100%" height="100%" fill="#f5f8f7"/><text x="40" y="50" font-size="30">${esc(title)}</text>`;
let uml=start(1500,1160,'Pharmacy IS — UML use cases');
uml+='<rect x="330" y="90" width="840" height="1020" class="box"/><text x="350" y="125" font-size="24">Pharmacy IS system boundary</text>';
const cases=[['Register / sign in',180],['View own records',290],['Edit own account',400],['Change language',510],['Manage patients',620],['Manage inventory',730],['Record prescription',840],['Dispense medication',950]];
for(const [name,y] of cases)uml+=`<ellipse cx="750" cy="${y}" rx="240" ry="42" class="box"/><text x="750" y="${y+8}" font-size="24" text-anchor="middle">${esc(name)}</text>`;
for(const [name,y,side,targets] of [['Patient',330,'left',[0,1,2,3]],['Pharmacist',820,'left',[0,2,3,4,5,6,7]],['Admin',760,'right',[0,2,3,4,5,6,7]]]){
 const x=side==='left'?140:1350;
 uml+=`<rect x="${x-110}" y="${y-45}" width="220" height="90" class="box"/><text x="${x}" y="${y-8}" text-anchor="middle" font-size="21">«actor»</text><text x="${x}" y="${y+24}" text-anchor="middle" font-size="25">${name}</text>`;
 for(const i of targets)uml+=`<path d="M${side==='left'?x+110:x-110},${y} L${side==='left'?510:990},${cases[i][1]}" class="link"/>`;
}
uml+='<text x="350" y="1080" font-size="19">Dedicated user administration is a planned Week 11 extension.</text></svg>';
await fs.writeFile(path.join(out,'use-cases.svg'),uml);

const wireframes=[
 ['patient-search','Patient search',['Navigation: Patients / Inventory / Prescriptions / History','Search: name, reference or phone','Results: reference / full name / birth date','Action: create or edit patient','Empty state: no matching records']],
 ['prescription-entry','Prescription entry',['Reference / Patient selector / Doctor selector','Issued on / Valid until','Medication selector / Prescribed quantity / Directions','Action: add medication line','Save / Cancel; inline validation feedback']],
 ['dispensing','Dispensing confirmation',['Patient selector','Batch selector: medication / lot / remaining stock','Prescription line: reference / medication / remaining','Positive quantity','Save opens confirmation; success refreshes stock and history']],
];
for(const [name,title,rows] of wireframes){let svg=start(1100,760,title+' — retrospective wireframe');svg+='<text x="40" y="88" font-size="20">Captured 2026-11-08 from the implemented workflow; not a historical Week 3 artifact.</text>';rows.forEach((row,i)=>{const y=130+i*105;svg+=`<rect x="40" y="${y}" width="1020" height="80" fill="none" stroke="#6b7280" stroke-width="2" stroke-dasharray="6 4"/><text x="65" y="${y+46}" font-size="24">${esc(row)}</text>`});svg+='</svg>';await fs.writeFile(path.join(out,'wireframe-'+name+'.svg'),svg);}
console.log('Exported ERD, UML and three wireframes.');
