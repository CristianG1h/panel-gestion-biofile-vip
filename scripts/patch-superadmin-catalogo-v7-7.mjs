import fs from 'node:fs';

const archivo = new URL('../superadmin.html', import.meta.url);
let html = fs.readFileSync(archivo, 'utf8');
const MARCA = 'SUPERADMIN_CATALOGO_SOLO_ORDENES_V77';

if (html.includes(MARCA)) {
  console.log('[Panel] Super Admin v7.7 ya usa solo autocompletados de Órdenes de Servicio.');
  process.exit(0);
}

function reemplazar(buscar, reemplazo, etiqueta) {
  if (!html.includes(buscar)) throw new Error('No se encontró ' + etiqueta + '.');
  html = html.replace(buscar, reemplazo);
}

// El laboratorio deja de mostrar/consultar el catálogo previo que podía contener
// errores históricos del antiguo flujo de Acuerdos Comerciales.
reemplazar(
  '.labGrid{display:grid;grid-template-columns:minmax(260px,1fr) auto auto auto;gap:8px;align-items:end;margin-top:12px}',
  '.labGrid{display:grid;grid-template-columns:minmax(260px,1fr) auto auto;gap:8px;align-items:end;margin-top:12px}',
  'la cuadrícula del laboratorio'
);

reemplazar(
  '<h3 style="margin:0">🧪 Laboratorio de paquetes BIOFILE</h3>',
  '<h3 style="margin:0">🔎 Revisión de paquetes BIOFILE</h3>',
  'el título del laboratorio'
);

reemplazar(
  '<div class="muted">Pruebe una empresa sin tocar pacientes. Puede ver lo guardado, hacer una investigación real en Acuerdos Comerciales y, solo si el resultado es correcto, guardarlo en el catálogo.</div>',
  '<div class="muted">Revisa los paquetes exclusivamente desde Órdenes de Servicio usando los autocompletados reales de BIOFILE. No abre ni verifica el módulo de Acuerdos Comerciales.</div>',
  'la explicación del laboratorio'
);

reemplazar(
  '      <button class="btn gris" id="labConsultar">Ver guardado</button>\n      <button class="btn azul" id="labProbar">Probar BIOFILE</button>\n      <button class="btn verde" id="labProbarGuardar">Probar y guardar</button>',
  '      <button class="btn azul" id="labProbar">Revisar en BIOFILE</button>\n      <button class="btn verde" id="labProbarGuardar">Revisar y guardar</button>',
  'los botones del laboratorio'
);

reemplazar(
  '<div class="labEstado" id="labEstado">Escriba una empresa para comenzar.</div>',
  '<div class="labEstado" id="labEstado">Escriba una empresa para revisar sus paquetes.</div>',
  'el estado inicial del laboratorio'
);

// En los resultados mostramos únicamente la revisión en vivo. Se elimina el
// bloque "Catálogo antes de la prueba", que era el que enseñaba errores viejos
// como "No se encontró el botón Buscar de Acuerdos Comerciales".
html = html.replace(
  "    let h=pintarCatalogoLab(data&&data.previo,'Catálogo antes de la prueba');",
  "    let h='';"
);
html = html.replace(
  "  let h=pintarCatalogoLab(data.previo,'Catálogo antes de la prueba');",
  "  let h='';"
);
html = html.replace(/Diagnóstico de la prueba/g, 'Diagnóstico de la revisión');
html = html.replace(/Catálogo guardado después de la prueba/g, 'Catálogo guardado después de la revisión');

// Quitar la consulta independiente de "Ver guardado". El Super Admin debe
// ejecutar siempre la revisión real por autocompletados de Órdenes de Servicio.
const inicioConsulta = html.indexOf('async function consultarCatalogoLab(){');
const inicioPrueba = html.indexOf('async function probarCatalogoLab(guardar){', inicioConsulta);
if (inicioConsulta < 0 || inicioPrueba < 0) {
  throw new Error('No se encontró el bloque consultarCatalogoLab().');
}
html = html.slice(0, inicioConsulta) + html.slice(inicioPrueba);

reemplazar(
  "  const botones=[$('labProbar'),$('labProbarGuardar'),$('labConsultar')];botones.forEach(b=>b.disabled=true);",
  "  const botones=[$('labProbar'),$('labProbarGuardar')];botones.forEach(b=>b.disabled=true);",
  'la lista de botones de revisión'
);

html = html.replace(
  "  labEstado(guardar?'Investigando BIOFILE y guardando solo si la prueba es válida…':'Investigando BIOFILE en vivo sin modificar el catálogo…','');",
  "  labEstado(guardar?'Revisando BIOFILE y guardando solo si el resultado es válido…':'Revisando BIOFILE en vivo sin modificar el catálogo…','');"
);
html = html.replace(
  "    labEstado(guardar?'Prueba correcta. El resultado válido quedó guardado.':'Prueba correcta. No se modificó el catálogo.','ok')",
  "    labEstado(guardar?'Revisión correcta. El resultado válido quedó guardado.':'Revisión correcta. No se modificó el catálogo.','ok')"
);
html = html.replace(
  "    labEstado('La prueba detectó un problema: '+(d.error||e.message),'err')",
  "    labEstado('La revisión detectó un problema: '+(d.error||e.message),'err')"
);

html = html.replace("$('labConsultar').onclick=consultarCatalogoLab;\n", '');
reemplazar(
  "$('labEmpresa').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();consultarCatalogoLab()}});",
  "$('labEmpresa').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();probarCatalogoLab(false)}});",
  'el Enter del laboratorio'
);

// Marca explícita para que el parche sea idempotente.
reemplazar(
  '/* SUPERADMIN_LAB_CATALOGO_V71 */',
  '/* SUPERADMIN_LAB_CATALOGO_V71 */\n/* ' + MARCA + ' */',
  'la marca del laboratorio v7.1'
);

if (html.includes('id="labConsultar"') ||
    html.includes('consultarCatalogoLab') ||
    html.includes('Catálogo antes de la prueba') ||
    html.includes('investigación real en Acuerdos Comerciales')) {
  throw new Error('Quedaron restos del flujo anterior de Acuerdos Comerciales.');
}
if (!html.includes('autocompletados reales de BIOFILE') ||
    !html.includes('Revisar en BIOFILE') ||
    !html.includes('Resultado en vivo de BIOFILE')) {
  throw new Error('La revisión exclusiva por Órdenes de Servicio quedó incompleta.');
}

fs.writeFileSync(archivo, html, 'utf8');
console.log('[Panel] v7.7: Super Admin revisa paquetes únicamente por autocompletados de Órdenes de Servicio.');
