import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=process.argv[2];
if(!destination)throw new Error('Usage: node adapters/export.mjs <new-output-directory>');
const output=path.resolve(destination);
// Never overwrite a checkout or an existing export.
await fs.mkdir(output,{recursive:false});
const files=['index.html','portal-exhibit-0.html','portal-exhibit-1.html','portal-exhibit-2.html','portal-exhibit-3.html','content.js','exhibit.js','exhibit.css','world-config.js','template.css','story-pages.css','integrated-worlds.css','portal-museum.css','portal-starry.css','portal-museum.js','portal-tour.js','icon.svg','LICENSE','ATTRIBUTION.md'];
for(const name of files)await fs.copyFile(path.join(root,name),path.join(output,name));
await fs.cp(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
const entry=path.join(output,'index.html');
await fs.writeFile(entry,(await fs.readFile(entry,'utf8')).replace(/<title>.*?<\/title>/,'<title>Starry Museum a Freefolio template by OSSPH</title>'));
await fs.writeFile(path.join(output,'README.md'),'# Starry Museum\n\nServe this static folder with any HTTP server. Edit `content.js` for the fictional profile and projects, and `index.html` for the Chinese museum labels. No install, API key, analytics or backend. WebGL enhances the exhibit; direct HTML links are provided as a fallback.\n\nThe source build, licenses and customization guide are supplied in the linked source repository. See `ATTRIBUTION.md` for painting, wood and animation credits.\n');
console.log(`Exported static template to ${output}`);
