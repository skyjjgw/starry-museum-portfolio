import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=process.cwd();
const entry=fs.readFileSync('index.html','utf8');
assert.equal((entry.match(/data-exhibit-frame=/g)||[]).length,4);
assert.ok(entry.includes('data-auto-tour'));
assert.ok(entry.includes('data-frame-fullscreen'));
assert.ok(!entry.includes('catalog.html'));
const context={};vm.runInNewContext(fs.readFileSync('content.js','utf8'),context);
assert.equal(context.MUSEUM_CONTENT.projects.length,4);
assert.equal(new Set(context.MUSEUM_CONTENT.projects.map(p=>p.name)).size,4);
// Catch broken relative asset references before exporting under a subdirectory.
for(const name of fs.readdirSync(root).filter(n=>/\.(html|css)$/.test(n))){
 const text=fs.readFileSync(name,'utf8');
 const refs=[...text.matchAll(/(?:src|href)="([^"]+)"|url\(['"]?([^)'"\s]+)['"]?\)/g)].map(m=>m[1]||m[2]);
 for(const ref of refs){if(/^(?:#|https?:|data:)/.test(ref))continue;assert.ok(fs.existsSync(path.resolve(root,ref.split(/[?#]/)[0])),`${name}: missing ${ref}`);}
}
const tour=fs.readFileSync('portal-tour.js','utf8');
assert.ok(tour.includes('prefers-reduced-motion'));
assert.ok(tour.includes('portal-user-interaction'));
for(const name of ['assets/museum.js','assets/starry-gallery/starry-night-mobile.webp','assets/starry-gallery/starry-flow-map.png','assets/starry-gallery/wood/oak-veneer.webp','assets/THREE-LICENSE.txt','assets/starry-gallery/INTERACTIVE-STARRY-NIGHT-LICENSE.txt'])assert.ok(fs.statSync(name).size>0);
console.log('Passed: four exhibits, unique fictional content, local assets, museum-only export and license presence.');
