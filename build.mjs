import {build} from 'esbuild';
await build({entryPoints:['src/main.js'],outfile:'assets/museum.js',bundle:true,format:'iife',minify:true,legalComments:'eof'});
