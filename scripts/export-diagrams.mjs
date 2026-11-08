import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'docs/diagrams');
const build = path.join(root, '.build/diagrams');
const browser = process.env.DIAGRAM_BROWSER;
if (!browser) throw new Error('Set DIAGRAM_BROWSER to a Chromium executable. See docs/diagrams/README.md for dependencies.');
const markdown = await fs.readFile(path.join(out, 'domain-erd.md'), 'utf8');
const diagram = markdown.match(/```mermaid\r?\n([\s\S]*?)```/);
if (!diagram) throw new Error('No Mermaid diagram found in domain-erd.md.');
await fs.mkdir(build, {recursive: true});
await fs.writeFile(path.join(build, 'domain-erd.mmd'), diagram[1]);
await fs.writeFile(path.join(build, 'browser.json'), JSON.stringify({executablePath: browser}));
execFileSync(process.execPath, [path.join(build, 'node_modules/@mermaid-js/mermaid-cli/src/cli.js'), '-i', path.join(build, 'domain-erd.mmd'), '-o', path.join(out, 'domain-erd.svg'), '-p', path.join(build, 'browser.json'), '-b', 'white'], {stdio: 'inherit'});
console.log('Exported PostgreSQL ER diagram.');
