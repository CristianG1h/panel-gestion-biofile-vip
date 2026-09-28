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
const nacionales=fs.readFileSync('assets/js/nacionales.js','utf8');
new vm.Script(nacionales);
assert(nacionales.includes('Empresa / Acuerdo BIOFILE'), 'Debe existir selector de empresa/acuerdo en Nacionales');
assert(nacionales.includes('Enviar a BIOFILE'), 'Debe existir acción clara de envío');
assert(nacionales.includes('Ver resumen'), 'Debe existir resumen legible');
assert(!nacionales.includes("JSON.stringify({archivo:"), 'No se debe mostrar JSON crudo al usuario');
assert(nacionales.includes("data-action=\"delete\""), 'Nacionales debe tener una X para eliminar conceptos');
assert(!nacionales.includes("data-action=\"exclude\""), 'Nacionales no debe usar Excluir/Incluir');
assert(!nacionales.includes("EXCLUIDO"), 'Nacionales no debe mostrar el estado Excluido');
assert(nacionales.includes('✓ Revisión guardada.'), 'Guardar revisión debe confirmar y cerrar la edición');
assert(nacionales.includes('Productos automáticos organizados por ciudad'), 'Ajustes avanzados debe mostrar el mapa por ciudad');
assert(nacionales.includes('Reintentar envío'), 'Nacionales debe mostrar reintento claro cuando BIOFILE está ocupado');
assert(nacionales.includes('Preparando BIOFILE'), 'Nacionales debe distinguir preparación de envío real');
assert(nacionales.includes('safeRetry'), 'Nacionales debe permitir reintento seguro cuando no se creó ninguna orden');
assert(nacionales.includes('Examen que se enviará a BIOFILE'), 'Nacionales debe mostrar el producto BIOFILE exacto antes de enviar');
assert(nacionales.includes('productPlan'), 'Nacionales debe resolver el producto BIOFILE por ciudad y examen');
console.log('Panel: sintaxis, empresa/acuerdo, resumen legible y progreso real verificados.');
