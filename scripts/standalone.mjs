import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('dist');
let html=await readFile(resolve(root,'index.html'),'utf8');
for(const match of [...html.matchAll(/<script type="module" crossorigin src="([^"]+)"><\/script>/g)]){
  const js=(await readFile(resolve(root,match[1].replace(/^\//,'')),'utf8')).replace(/<\/script/gi,'<\\/script');
  html=html.replace(match[0],()=>`<script type="module">${js}</script>`);
}
for(const match of [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)">/g)]){
  const css=await readFile(resolve(root,match[1].replace(/^\//,'')),'utf8');html=html.replace(match[0],()=>`<style>${css}</style>`);
}
const favicon=(await readFile(resolve(root,'favicon.svg'))).toString('base64');
html=html.replace(/href="(?:\/|\.\/)?favicon\.svg"/,`href="data:image/svg+xml;base64,${favicon}"`).replace('href="./" aria-label="墨境首页"','href="#" aria-label="墨境首页"');
if(/(?:src|href)="\/assets\//.test(html))throw Error('Standalone artifact contains unresolved asset references');
await writeFile(resolve(root,'mario.html'),html);
console.log(`Offline game: dist/mario.html (${Buffer.byteLength(html)} bytes, no external assets)`);
