import {build} from 'esbuild';
import fs from 'node:fs/promises';
await build({entryPoints:['src/main.js'],outfile:'assets/museum.js',bundle:true,format:'iife',minify:true,legalComments:'eof'});
// Three.js embeds GLSL template literals. Normalize their insignificant
// indentation so downstream repositories can run git diff --check cleanly.
const bundled=await fs.readFile('assets/museum.js','utf8');
await fs.writeFile('assets/museum.js',bundled.replace(/^[ \t]+/gm,s=>s.replace(/\t/g,'  ')).replace(/[ \t]+$/gm,''));
