import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (html.includes('/* PANEL_CATALOGO_PAQUETES_V7 */')) {
  console.log('[Panel] Catálogo de paquetes v7 ya instalado.');
  process.exit(0);
}
if (!html.includes('/* PANEL_MANUAL_ORDEN_BIOFILE_V613 */')) {
  throw new Error('Primero debe ejecutarse patch-manual-orden-biofile-v6-13.mjs.');
}

function reemplazarUna(texto, buscar, reemplazo, etiqueta) {
  if (!texto.includes(buscar)) throw new Error('No se encontró ' + etiqueta + '.');
  return texto.replace(buscar, reemplazo);
}

const css = [
  '',
  '/* PANEL_CATALOGO_PAQUETES_V7 */',
  '.ordenCfgV7{margin:12px 0;border:1px solid var(--borde);border-radius:12px;background:var(--panel);overflow:hidden}',
  '.ordenCfgV7Head{padding:10px 12px;background:rgba(27,123,199,.08);border-bottom:1px solid var(--borde);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}',
  '.ordenCfgV7Head b{font-size:13px}.ordenCfgV7Grid{display:grid;grid-template-columns:1.25fr 1.25fr 1fr;gap:10px;padding:12px}',
  '.ordenCfgV7 .campoV7 label{display:block;font-size:10px;font-weight:850;margin-bottom:4px;opacity:.78}',
  '.ordenCfgV7 input,.ordenCfgV7 select{width:100%;min-height:39px;border:1px solid var(--borde);border-radius:8px;padding:8px 9px;background:var(--fondo);color:var(--texto);font:inherit}',
  '.ordenCfgV7 input[readonly]{opacity:.85;cursor:not-allowed}',
  '.ordenCfgV7Estado{margin:0 12px 12px;padding:8px 10px;border:1px solid var(--borde);border-radius:8px;font-size:11px;line-height:1.4;opacity:.9}',
  '.ordenCfgV7Estado.ok{border-color:#63A97B}.ordenCfgV7Estado.warn{border-color:#D7A93B}.ordenCfgV7Estado.err{border-color:#C95B51}',
  '.ordenCfgV7 .miniV7{font-size:10px;opacity:.72;margin-top:4px;line-height:1.35}',
  'html[data-theme="dark"] .ordenCfgV7Head{background:#173A56}',
  '@media(max-width:780px){.ordenCfgV7Grid{grid-template-columns:1fr}.ordenCfgV7Head .btn{width:100%}}',
  ''
].join('\n');

const styleEnd = html.indexOf('</style>');
if (styleEnd < 0) throw new Error('No se encontró </style>.');
html = html.slice(0, styleEnd) + css + html.slice(styleEnd);

const autoIntro = '<h3>Enviar este paciente automáticamente</h3><p>El paciente se agregará a su cola personal. Otros usuarios pueden procesar al mismo tiempo pacientes diferentes.</p>';
const autoUi = [
  autoIntro,
  '        <div class="ordenCfgV7" id="ordenAutoV7">',
  '          <div class="ordenCfgV7Head"><div><b>Configuración de la orden BIOFILE</b><div class="miniV7">La empresa proviene del registro y no se puede cambiar en el envío automático.</div></div><button class="btn gris sm" id="btnActualizarCatalogoV7" type="button">↻ Actualizar paquetes</button></div>',
  '          <div class="ordenCfgV7Grid">',
  '            <div class="campoV7"><label>Empresa / Acuerdo comercial</label><input id="autoEmpresaV7" type="text" readonly></div>',
  '            <div class="campoV7"><label>Tipo de evaluación</label><select id="autoTipoV7"></select></div>',
  '            <div class="campoV7"><label>Paquete</label><select id="autoPaqueteV7"><option value="NO APLICA">NO APLICA</option></select></div>',
  '          </div>',
  '          <div class="ordenCfgV7Estado" id="autoCatalogoEstadoV7">Preparando catálogo de paquetes…</div>',
  '        </div>'
].join('\n');
html = reemplazarUna(html, autoIntro, autoUi, 'la configuración del envío automático');

const imagenes = '        <div class="imagenes">';
const manualUi = [
  '        <div class="ordenCfgV7" id="ordenManualV7">',
  '          <div class="ordenCfgV7Head"><div><b>Empresa, evaluación y paquete para ingreso manual</b><div class="miniV7">Aquí sí puede cambiar la empresa antes de copiar los datos a BIOFILE.</div></div><button class="btn gris sm" id="btnActualizarCatalogoManualV7" type="button">↻ Actualizar paquetes</button></div>',
  '          <div class="ordenCfgV7Grid">',
  '            <div class="campoV7"><label>Empresa / Acuerdo comercial</label><input id="manualEmpresaV7" type="text" autocomplete="off"></div>',
  '            <div class="campoV7"><label>Tipo de evaluación</label><select id="manualTipoV7"></select></div>',
  '            <div class="campoV7"><label>Paquete</label><select id="manualPaqueteV7"><option value="NO APLICA">NO APLICA</option></select></div>',
  '          </div>',
  '          <div class="ordenCfgV7Estado" id="manualCatalogoEstadoV7">Listo para consultar paquetes.</div>',
  '        </div>',
  imagenes
].join('\n');
html = reemplazarUna(html, imagenes, manualUi, 'el bloque de imágenes del ingreso manual');

const marker = 'function pintar(){';
const idx = html.indexOf(marker);
if (idx < 0) throw new Error('No se encontró function pintar().');

const helper = [
  '',
  'const TIPOS_EVALUACION_V7=[',
  "  'EVALUACIÓN MÉDICA OCUPACIONAL DE INGRESO',",
  "  'EVALUACIÓN MÉDICA OCUPACIONAL PERIÓDICO',",
  "  'EVALUACIÓN MÉDICA OCUPACIONAL EGRESO',",
  "  'EVALUACIÓN MÉDICA POST INCAPACIDAD'",
  '];',
  "const ORDEN_AUTO_V7={empresa:'',tipo:TIPOS_EVALUACION_V7[0],paquete:'NO APLICA',catalogo:null};",
  "const ORDEN_MANUAL_V7={empresa:'',tipo:TIPOS_EVALUACION_V7[0],paquete:'NO APLICA',catalogo:null,activo:false};",
  'function normV7(v){return String(v||\'\').normalize(\'NFD\').replace(/[\\u0300-\\u036f]/g,\'\').replace(/[^A-Za-z0-9]+/g,\' \').trim().toUpperCase()}',
  'function empresaSeguraV7(r){',
  "  try{var d=datosRelacionManualV612(r);if(d&&d.acuerdo)return d.acuerdo}catch(_){ }",
  "  try{var m=metaEmpresaPanelV69(r);if(m&&m.acuerdo)return m.acuerdo}catch(_){ }",
  "  return limpiar(r&&r['Acuerdo comercial']||r&&r['Acuerdo Comercial']||r&&r['Empresa en misión'])||'PARTICULARES'",
  '}',
  'function llenarTiposV7(id,valor){var s=$(id);if(!s)return;s.innerHTML=TIPOS_EVALUACION_V7.map(function(x){return \'<option value="\'+esc(x)+\'">\'+esc(x)+\'</option>\'}).join(\'\');s.value=TIPOS_EVALUACION_V7.includes(valor)?valor:TIPOS_EVALUACION_V7[0]}',
  'function paquetesTipoV7(catalogo,tipo){return ((catalogo&&catalogo.paquetes)||[]).filter(function(p){return normV7(p.tipoEvaluacion)===normV7(tipo)})}',
  'function llenarPaquetesV7(id,catalogo,tipo,seleccion){',
  "  var s=$(id);if(!s)return;var ps=paquetesTipoV7(catalogo,tipo);var opciones=['NO APLICA'].concat(ps.map(function(p){return p.nombre}));",
  '  s.innerHTML=opciones.map(function(x){return \'<option value="\'+esc(x)+\'">\'+esc(x)+\'</option>\'}).join(\'\');',
  "  s.value=opciones.some(function(x){return normV7(x)===normV7(seleccion)})?opciones.find(function(x){return normV7(x)===normV7(seleccion)}):'NO APLICA';",
  '}',
  'function estadoCatalogoV7(id,texto,tipo){var e=$(id);if(!e)return;e.textContent=texto;e.className=\'ordenCfgV7Estado \'+(tipo||\'\')}',
  'async function cargarCatalogoV7(empresa){',
  "  empresa=String(empresa||'').trim();if(!empresa)return{catalogo:null,actualizando:false};",
  "  var r=await api('/api/catalogo/empresa?empresa='+encodeURIComponent(empresa));return r.data||{}",
  '}',
  'function mensajeCatalogoV7(data,catalogo,tipo){',
  "  if(!catalogo)return data&&data.actualizando?'Investigando esta empresa en BIOFILE. Mientras termina puede usar NO APLICA.':'Aún no hay paquetes guardados para esta empresa. Puede usar NO APLICA.';",
  "  var n=paquetesTipoV7(catalogo,tipo).length,fecha=catalogo.ultimaRevisionIso?new Date(catalogo.ultimaRevisionIso).toLocaleString('es-CO',{timeZone:'America/Bogota'}):'';",
  "  var base=n?n+' paquete(s) disponible(s) para este tipo de evaluación.':'No hay paquetes activos para este tipo de evaluación; se usará NO APLICA.';",
  "  if(fecha)base+=' Última revisión: '+fecha+'.';if(data&&data.actualizando)base+=' Actualizando en segundo plano…';return base",
  '}',
  'async function consultarCatalogoAutoV7(force){',
  "  if(!actual)return;var empresa=empresaSeguraV7(actual);ORDEN_AUTO_V7.empresa=empresa;$('autoEmpresaV7').value=empresa;",
  "  estadoCatalogoV7('autoCatalogoEstadoV7',force?'Solicitando actualización del catálogo…':'Consultando paquetes…','');",
  "  if(force)try{await api('/api/catalogo/refrescar',{method:'POST',body:JSON.stringify({empresa:empresa})})}catch(_){ }",
  "  try{var data=await cargarCatalogoV7(empresa),cat=data.catalogo||null;ORDEN_AUTO_V7.catalogo=cat;if(cat&&cat.acuerdoExacto){ORDEN_AUTO_V7.empresa=cat.acuerdoExacto;$('autoEmpresaV7').value=cat.acuerdoExacto}",
  "    llenarPaquetesV7('autoPaqueteV7',cat,ORDEN_AUTO_V7.tipo,ORDEN_AUTO_V7.paquete);ORDEN_AUTO_V7.paquete=$('autoPaqueteV7').value;",
  "    estadoCatalogoV7('autoCatalogoEstadoV7',mensajeCatalogoV7(data,cat,ORDEN_AUTO_V7.tipo),cat?'ok':'warn');",
  "    if(data.actualizando)setTimeout(function(){if(actual)consultarCatalogoAutoV7(false)},4500)",
  "  }catch(e){ORDEN_AUTO_V7.catalogo=null;llenarPaquetesV7('autoPaqueteV7',null,ORDEN_AUTO_V7.tipo,'NO APLICA');ORDEN_AUTO_V7.paquete='NO APLICA';estadoCatalogoV7('autoCatalogoEstadoV7','No fue posible consultar paquetes ahora. Se mantendrá NO APLICA.','err')}",
  '}',
  'function prepararAutoPaquetesV7(r){',
  "  ORDEN_AUTO_V7.empresa=empresaSeguraV7(r);ORDEN_AUTO_V7.tipo=TIPOS_EVALUACION_V7[0];ORDEN_AUTO_V7.paquete='NO APLICA';ORDEN_AUTO_V7.catalogo=null;",
  "  llenarTiposV7('autoTipoV7',ORDEN_AUTO_V7.tipo);$('autoEmpresaV7').value=ORDEN_AUTO_V7.empresa;llenarPaquetesV7('autoPaqueteV7',null,ORDEN_AUTO_V7.tipo,'NO APLICA');consultarCatalogoAutoV7(false)",
  '}',
  'async function consultarCatalogoManualV7(force){',
  "  var empresa=String($('manualEmpresaV7')&&$('manualEmpresaV7').value||'').trim();ORDEN_MANUAL_V7.empresa=empresa;ORDEN_MANUAL_V7.activo=true;",
  "  if(!empresa){ORDEN_MANUAL_V7.catalogo=null;llenarPaquetesV7('manualPaqueteV7',null,ORDEN_MANUAL_V7.tipo,'NO APLICA');estadoCatalogoV7('manualCatalogoEstadoV7','Escriba una empresa para consultar sus paquetes.','warn');return}",
  "  estadoCatalogoV7('manualCatalogoEstadoV7',force?'Solicitando actualización del catálogo…':'Consultando paquetes…','');",
  "  if(force)try{await api('/api/catalogo/refrescar',{method:'POST',body:JSON.stringify({empresa:empresa})})}catch(_){ }",
  "  try{var data=await cargarCatalogoV7(empresa),cat=data.catalogo||null;ORDEN_MANUAL_V7.catalogo=cat;if(cat&&cat.acuerdoExacto&&normV7($('manualEmpresaV7').value)===normV7(empresa)){$('manualEmpresaV7').value=cat.acuerdoExacto;ORDEN_MANUAL_V7.empresa=cat.acuerdoExacto}",
  "    llenarPaquetesV7('manualPaqueteV7',cat,ORDEN_MANUAL_V7.tipo,ORDEN_MANUAL_V7.paquete);ORDEN_MANUAL_V7.paquete=$('manualPaqueteV7').value;",
  "    estadoCatalogoV7('manualCatalogoEstadoV7',mensajeCatalogoV7(data,cat,ORDEN_MANUAL_V7.tipo),cat?'ok':'warn');if(typeof pintarDatos==='function'&&actual)pintarDatos(actual);",
  "    if(data.actualizando)setTimeout(function(){if(actual&&ORDEN_MANUAL_V7.activo)consultarCatalogoManualV7(false)},4500)",
  "  }catch(e){ORDEN_MANUAL_V7.catalogo=null;llenarPaquetesV7('manualPaqueteV7',null,ORDEN_MANUAL_V7.tipo,'NO APLICA');ORDEN_MANUAL_V7.paquete='NO APLICA';estadoCatalogoV7('manualCatalogoEstadoV7','No fue posible consultar paquetes. Puede continuar con NO APLICA.','err')}",
  '}',
  'function prepararManualPaquetesV7(r){',
  "  var empresa=empresaSeguraV7(r);ORDEN_MANUAL_V7.empresa=empresa;ORDEN_MANUAL_V7.tipo=TIPOS_EVALUACION_V7[0];ORDEN_MANUAL_V7.paquete='NO APLICA';ORDEN_MANUAL_V7.catalogo=null;ORDEN_MANUAL_V7.activo=true;",
  "  $('manualEmpresaV7').value=empresa;llenarTiposV7('manualTipoV7',ORDEN_MANUAL_V7.tipo);llenarPaquetesV7('manualPaqueteV7',null,ORDEN_MANUAL_V7.tipo,'NO APLICA');consultarCatalogoManualV7(false)",
  '}',
  "function configAutoV7(r){return{empresa:ORDEN_AUTO_V7.empresa||empresaSeguraV7(r),tipoEvaluacion:ORDEN_AUTO_V7.tipo||TIPOS_EVALUACION_V7[0],paquete:ORDEN_AUTO_V7.paquete||'NO APLICA'}}",
  ''
].join('\n');

html = html.slice(0, idx) + helper + html.slice(idx);

html = reemplazarUna(
  html,
  "if(p.c==='__acuerdo')return rel.acuerdo;",
  "if(p.c==='__acuerdo')return ORDEN_MANUAL_V7.activo&&ORDEN_MANUAL_V7.empresa?ORDEN_MANUAL_V7.empresa:rel.acuerdo;",
  'el acuerdo del ingreso manual'
);
html = reemplazarUna(
  html,
  "if(p.c==='__mision')return rel.mision;",
  "if(p.c==='__mision')return ORDEN_MANUAL_V7.activo&&ORDEN_MANUAL_V7.empresa?ORDEN_MANUAL_V7.empresa:rel.mision;",
  'la empresa en misión del ingreso manual'
);
html = reemplazarUna(
  html,
  "if(p.c==='__tipoEvaluacion')return primeroManualV613(r,['Tipo de Evaluación Médica o Procedimiento','Tipo evaluación','Tipo Evaluación'])||p.d;",
  "if(p.c==='__tipoEvaluacion')return ORDEN_MANUAL_V7.activo?ORDEN_MANUAL_V7.tipo:(primeroManualV613(r,['Tipo de Evaluación Médica o Procedimiento','Tipo evaluación','Tipo Evaluación'])||p.d);",
  'el tipo de evaluación manual'
);
html = reemplazarUna(
  html,
  "if(p.c==='__paquete')return primeroManualV613(r,['Nombre del Paquete','Paquete'])||p.d;",
  "if(p.c==='__paquete')return ORDEN_MANUAL_V7.activo?ORDEN_MANUAL_V7.paquete:(primeroManualV613(r,['Nombre del Paquete','Paquete'])||p.d);",
  'el paquete manual'
);

const inicioEnviar = html.indexOf('async function enviarRegistro(');
const finEnviar = html.indexOf("$('btnMasivo').onclick", inicioEnviar);
if (inicioEnviar < 0 || finEnviar < 0) throw new Error('No se encontró enviarRegistro() final.');
const enviarNuevo = [
  "async function enviarRegistro(r,imgs=true,sil=false,configOrden=null){",
  "  const d=doc(r),rk=claveRegistro(r),cfg=configOrden||{empresa:empresaSeguraV7(r),tipoEvaluacion:TIPOS_EVALUACION_V7[0],paquete:'NO APLICA'};",
  "  const body={documento:d,fila:filaDe(r),subirImagenes:!!imgs,empresa:cfg.empresa||empresaSeguraV7(r),tipoEvaluacion:cfg.tipoEvaluacion||TIPOS_EVALUACION_V7[0],paquete:cfg.paquete||'NO APLICA'};",
  "  const{data,status}=await api('/api/biofile/enviar',{method:'POST',body:JSON.stringify(body)});",
  "  if(data.job?.id&&data.job?.usuario?.id===usuarioActual.id){trabajos[rk]={...data.job,jobId:data.job.id};if(trabajos[d])delete trabajos[d];guardarJobs()}",
  "  if(!sil)toast(data.mensaje||'Solicitud enviada.',status===409?'':'ok');pintar();iniciarPoll();return data",
  "}",
  ""
].join('\n');
html = html.slice(0, inicioEnviar) + enviarNuevo + html.slice(finEnviar);

html = reemplazarUna(
  html,
  "function mostrarAuto(){",
  "function mostrarAuto(){prepararAutoPaquetesV7(actual);",
  'mostrarAuto()'
);
html = reemplazarUna(
  html,
  "async function mostrarManual(){",
  "async function mostrarManual(){prepararManualPaquetesV7(actual);",
  'mostrarManual()'
);

const inicioBoton = html.indexOf("$('btnEnviarUno').onclick=");
const finBoton = html.indexOf('async function consultarExamenes()', inicioBoton);
if (inicioBoton < 0 || finBoton < 0) throw new Error('No se encontró el envío individual.');
const botonNuevo = [
  "$('btnEnviarUno').onclick=async()=>{",
  "  if(!actual)return;const cfg=configAutoV7(actual);",
  "  if(!confirm('¿Enviar a '+nombre(actual)+'?\\n\\nTipo: '+cfg.tipoEvaluacion+'\\nPaquete: '+cfg.paquete+'\\nEmpresa: '+cfg.empresa))return;",
  "  const b=$('btnEnviarUno');b.disabled=true;",
  "  try{await enviarRegistro(actual,$('imgIndividual').checked,false,cfg);activarTab('proceso');actualizarFicha()}catch(e){toast(e.message,'err')}finally{actualizarFicha()}",
  "}",
  ""
].join('\n');
html = html.slice(0, inicioBoton) + botonNuevo + html.slice(finBoton);

const restaurar = 'restaurar();';
if (!html.includes(restaurar)) throw new Error('No se encontró restaurar().');
const wiring = [
  "if($('autoTipoV7'))$('autoTipoV7').onchange=function(){ORDEN_AUTO_V7.tipo=this.value;ORDEN_AUTO_V7.paquete='NO APLICA';llenarPaquetesV7('autoPaqueteV7',ORDEN_AUTO_V7.catalogo,ORDEN_AUTO_V7.tipo,'NO APLICA');estadoCatalogoV7('autoCatalogoEstadoV7',mensajeCatalogoV7({},ORDEN_AUTO_V7.catalogo,ORDEN_AUTO_V7.tipo),ORDEN_AUTO_V7.catalogo?'ok':'warn')};",
  "if($('autoPaqueteV7'))$('autoPaqueteV7').onchange=function(){ORDEN_AUTO_V7.paquete=this.value};",
  "if($('btnActualizarCatalogoV7'))$('btnActualizarCatalogoV7').onclick=function(){consultarCatalogoAutoV7(true)};",
  "if($('manualTipoV7'))$('manualTipoV7').onchange=function(){ORDEN_MANUAL_V7.tipo=this.value;ORDEN_MANUAL_V7.paquete='NO APLICA';llenarPaquetesV7('manualPaqueteV7',ORDEN_MANUAL_V7.catalogo,ORDEN_MANUAL_V7.tipo,'NO APLICA');if(actual)pintarDatos(actual)};",
  "if($('manualPaqueteV7'))$('manualPaqueteV7').onchange=function(){ORDEN_MANUAL_V7.paquete=this.value;if(actual)pintarDatos(actual)};",
  "if($('manualEmpresaV7')){var manualEmpresaTimerV7=null;$('manualEmpresaV7').oninput=function(){ORDEN_MANUAL_V7.empresa=this.value.trim();ORDEN_MANUAL_V7.activo=true;clearTimeout(manualEmpresaTimerV7);manualEmpresaTimerV7=setTimeout(function(){consultarCatalogoManualV7(false);if(actual)pintarDatos(actual)},450)};}",
  "if($('btnActualizarCatalogoManualV7'))$('btnActualizarCatalogoManualV7').onclick=function(){consultarCatalogoManualV7(true)};",
  restaurar
].join('\n');
html = html.replace(restaurar, wiring);

if (!html.includes('PANEL_CATALOGO_PAQUETES_V7') ||
    !html.includes('autoEmpresaV7') ||
    !html.includes('manualEmpresaV7') ||
    !html.includes('tipoEvaluacion:cfg.tipoEvaluacion') ||
    !html.includes("ORDEN_AUTO_V7.paquete")) {
  throw new Error('La integración del catálogo de paquetes v7 quedó incompleta.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Panel] v7: empresa bloqueada en automático, tipo de evaluación y paquetes dinámicos; empresa editable en manual.');
