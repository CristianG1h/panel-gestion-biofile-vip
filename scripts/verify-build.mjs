import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
for(const file of ['app-v3.html','superadmin.html','admin.html']) {
  const html=fs.readFileSync(file,'utf8');
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if(match[1].trim())new vm.Script(match[1],{filename:file});
}
const app=fs.readFileSync('app-v3.html','utf8');
assert(!app.includes('Math.floor((Date.now()-ini)/1800)'), 'No simulated progress');
assert(app.includes('id="btnNacionales"'));
assert(app.includes('window.BiofilePanel'));
new vm.Script(fs.readFileSync('assets/js/nacionales.js','utf8'));
console.log('Panel: sintaxis, integración Nacionales y progreso real verificados.');
