import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
const manifestPath = new URL('../data/empresas-mision-v27/relaciones-acuerdo-mision-v67.json', import.meta.url);
const relacionesDir = new URL('../data/empresas-mision-v27/relaciones-v67/', import.meta.url);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const partes = fs.readdirSync(relacionesDir).filter((n) => /^parte-\d+\.json$/i.test(n)).sort();
const relaciones = partes.flatMap((n) => {
  const data = JSON.parse(fs.readFileSync(new URL(n, relacionesDir), 'utf8'));
  return Array.isArray(data.relaciones) ? data.relaciones : [];
});

if (partes.length !== manifest.parts) {
  throw new Error(`Relaciones v6.7 incompletas: se esperaban ${manifest.parts} partes y se encontraron ${partes.length}.`);
}
if (relaciones.length !== manifest.relations) {
  throw new Error(`Relaciones v6.7 incompletas: se esperaban ${manifest.relations} relaciones y se encontraron ${relaciones.length}.`);
}

const tieneRelacion = (principal, mision) => relaciones.some((r) => r[0] === principal && r[1] === mision);
const MEDYSCOL = 'MEDICINA, SALUD Y SEGURIDAD EN EL TRABAJO DE COLOMBIA SAS';
if (!tieneRelacion(MEDYSCOL, 'TEXTILES 1X1')) throw new Error('El Excel V2.7 no relaciona TEXTILES 1X1 con MEDYSCOL.');
if (!tieneRelacion(MEDYSCOL, 'SUDESPENSA BARRAGÁN SA')) throw new Error('El Excel V2.7 no relaciona SUDESPENSA BARRAGÁN SA con MEDYSCOL.');
if (!tieneRelacion('GESTLAB S.A.S', 'CANGURO INTERNATIONAL SAS')) throw new Error('El Excel V2.7 no relaciona CANGURO INTERNATIONAL SAS con GESTLAB S.A.S.');
if (manifest.specialAliases?.XXXX?.principal !== 'COMFICA COLOMBIA S.A.S.') throw new Error('XXXX debe resolverse como COMFICA.');

let html = fs.readFileSync(appPath, 'utf8');
const marcadorV66 = '/* REPORTE_EMPRESAS_RELACIONES_EXCEL_V66 */';
const inicioV66 = html.indexOf(marcadorV66);
const inicioGrupos = html.indexOf('function gruposReporteEmpresa(){', inicioV66);
const finReporte = html.indexOf("$('cerrarReporte').onclick=", inicioGrupos);
if (inicioV66 < 0 || inicioGrupos < 0 || finReporte < 0) {
  throw new Error('Primero debe ejecutarse patch-reporte-relaciones-v6-6.mjs.');
}

const codigo = String.raw`/* REPORTE_ACUERDO_MISION_V67 */
const RELACIONES_ACUERDO_MISION_V67=__RELACIONES__;
const NOMBRES_CORTOS_ACUERDO_V67=__CORTOS__;
const ALIAS_ESPECIALES_ACUERDO_V67=__ESPECIALES__;

function textoRelacionV67(valor){
  return textoEmpresaV66(valor)
    .replace(/\bUNO\s*(?:X|POR)\s*UNO\b/g,'1X1')
    .replace(/\bUNOXUNO\b/g,'1X1')
    .replace(/\b1\s*(?:X|POR)\s*1\b/g,'1X1')
    .replace(/\s+/g,' ')
    .trim();
}
function tokensRelacionV67(valor){return tokensEmpresaV66(textoRelacionV67(valor))}
function claveRelacionV67(valor){return tokensRelacionV67(valor).join('')}
function literalRelacionV67(valor){return textoRelacionV67(valor).replace(/\s+/g,'')}
function etiquetaAcuerdoV67(principal){return NOMBRES_CORTOS_ACUERDO_V67[principal]||principal}
function misionValidaV67(valor){
  var t=textoRelacionV67(valor);
  return !!t&&!['NO REFIERE','ERROR REVISAR','PENDIENTE'].includes(t)&&!/^[0-9]+$/.test(t);
}

const RELACIONES_V67=RELACIONES_ACUERDO_MISION_V67
  .filter(function(par){return Array.isArray(par)&&par.length>=2&&limpiar(par[0])&&misionValidaV67(par[1])})
  .map(function(par){return{principal:limpiar(par[0]),mision:limpiar(par[1]),clave:claveRelacionV67(par[1]),tokens:tokensRelacionV67(par[1]),literal:literalRelacionV67(par[1])}});
const MISIONES_EXACTAS_V67=new Map();
const PRINCIPALES_V67=new Map();
RELACIONES_V67.forEach(function(r){
  if(r.clave){var arr=MISIONES_EXACTAS_V67.get(r.clave)||[];arr.push(r);MISIONES_EXACTAS_V67.set(r.clave,arr)}
  var kp=claveRelacionV67(r.principal);if(kp&&!PRINCIPALES_V67.has(kp))PRINCIPALES_V67.set(kp,r.principal);
});
Object.values(ALIAS_ESPECIALES_ACUERDO_V67).forEach(function(x){var kp=claveRelacionV67(x.principal);if(kp&&!PRINCIPALES_V67.has(kp))PRINCIPALES_V67.set(kp,x.principal)});

function elegirExactaV67(candidatas){
  if(!candidatas||!candidatas.length)return null;
  if(candidatas.length===1)return candidatas[0];
  var principales=new Map();
  candidatas.forEach(function(r){principales.set(claveRelacionV67(r.principal),r.principal)});
  if(principales.size===1)return candidatas[0];
  var propia=candidatas.find(function(r){return claveRelacionV67(r.principal)===r.clave});
  return propia||null;
}
function resultadoRelacionV67(principal,mision,confianza,origen){
  principal=limpiar(principal);mision=limpiar(mision)||principal;
  return{principal:principal,visible:etiquetaAcuerdoV67(principal),mision:mision,confianza:Number(confianza||0),origen:origen||'excel'};
}
function resolverEspecialV67(valor){
  var clave=claveRelacionV67(valor);
  var entrada=Object.entries(ALIAS_ESPECIALES_ACUERDO_V67).find(function(par){return claveRelacionV67(par[0])===clave});
  if(!entrada)return null;
  return resultadoRelacionV67(entrada[1].principal,entrada[1].mision,1,'especial');
}
function resolverExactaV67(valor){
  var r=elegirExactaV67(MISIONES_EXACTAS_V67.get(claveRelacionV67(valor))||[]);
  return r?resultadoRelacionV67(r.principal,r.mision,1,'exacta'):null;
}
function resolverPrincipalCanonicoV67(valor){
  var viejo=resolverEmpresaReporte(valor);
  var canon=limpiar(viejo&&viejo.nombre);
  if(!canon)return null;
  var exacta=resolverExactaV67(canon);if(exacta)return exacta;
  var principal=PRINCIPALES_V67.get(claveRelacionV67(canon));
  if(!principal)return null;
  var relaciones=RELACIONES_V67.filter(function(r){return claveRelacionV67(r.principal)===claveRelacionV67(principal)});
  var propia=relaciones.find(function(r){return r.clave===claveRelacionV67(principal)});
  var mision=propia?propia.mision:(relaciones.length===1?relaciones[0].mision:canon);
  return resultadoRelacionV67(principal,mision,Math.max(.88,Number(viejo.confianza||0)),'canon-v66');
}
function resolverAcronimoV67(valor){
  var lit=literalRelacionV67(valor);
  if(lit.length<3||lit.length>6)return null;
  var encontrados=new Map();
  RELACIONES_V67.forEach(function(r){
    var lp=literalRelacionV67(r.principal),lm=r.literal;
    if(lp.startsWith(lit)||lm.startsWith(lit))encontrados.set(claveRelacionV67(r.principal),r);
  });
  if(encontrados.size!==1)return null;
  var r=[...encontrados.values()][0];
  return resultadoRelacionV67(r.principal,r.mision,.86,'acronimo');
}
function resolverContextoV67(valor,soporteMisiones){
  if(!soporteMisiones||!soporteMisiones.size)return null;
  var clave=claveRelacionV67(valor);if(clave.length<2||clave.length>10)return null;
  var coincidencias=[];
  soporteMisiones.forEach(function(cantidad,mision){
    if(!cantidad)return;var km=claveRelacionV67(mision);
    if(km===clave||km.includes(clave)||clave.includes(km))coincidencias.push({mision:mision,cantidad:cantidad});
  });
  if(coincidencias.length!==1)return null;
  var exacta=resolverExactaV67(coincidencias[0].mision);
  return exacta?Object.assign(exacta,{confianza:.84,origen:'contexto'}):null;
}
function resolverFuzzyV67(valor){
  var info={clave:claveRelacionV67(valor),tokens:tokensRelacionV67(valor)};
  if(!info.clave||info.clave.length<4)return null;
  var porPrincipal=new Map();
  RELACIONES_V67.forEach(function(r){
    var s=puntuarReferenciaV66(info,{clave:r.clave,tokens:r.tokens});
    if(s<.55)return;
    var kp=claveRelacionV67(r.principal),actual=porPrincipal.get(kp);
    if(!actual||s>actual.score)porPrincipal.set(kp,{r:r,score:s});
  });
  var lista=[...porPrincipal.values()].sort(function(a,b){return b.score-a.score});
  var mejor=lista[0],segundo=lista[1];if(!mejor)return null;
  var gap=mejor.score-(segundo?segundo.score:0);
  if(mejor.score>=.93&&gap>=.015)return resultadoRelacionV67(mejor.r.principal,mejor.r.mision,mejor.score,'fuzzy');
  if(mejor.score>=.82&&gap>=.08)return resultadoRelacionV67(mejor.r.principal,mejor.r.mision,mejor.score,'fuzzy');
  return null;
}
function resolverRelacionV67(valor,soporteMisiones){
  var original=limpiar(valor).replace(/\s+/g,' ');if(!original)return null;
  return resolverEspecialV67(original)
    ||resolverExactaV67(original)
    ||resolverPrincipalCanonicoV67(original)
    ||resolverContextoV67(original,soporteMisiones)
    ||resolverAcronimoV67(original)
    ||resolverFuzzyV67(original)
    ||resultadoRelacionV67((resolverEmpresaReporte(original)||{}).nombre||nombreObservadoEmpresaReporte(original),nombreObservadoEmpresaReporte(original),0,'sin-relacion');
}
function gruposReporteEmpresa(){
  var filas=filtrados().filter(function(r){return limpiar(r['Empresa en misión'])});
  var preliminares=filas.map(function(r){return{r:r,res:resolverRelacionV67(r['Empresa en misión'],null)}});
  var soporteMisiones=new Map();
  preliminares.forEach(function(x){if(x.res&&x.res.confianza>=.86)soporteMisiones.set(x.res.mision,(soporteMisiones.get(x.res.mision)||0)+1)});
  var grupos=new Map();
  filas.forEach(function(r){
    var original=limpiar(r['Empresa en misión']),res=resolverRelacionV67(original,soporteMisiones);if(!res)return;
    var id=claveRelacionV67(res.principal)||textoRelacionV67(res.principal),g=grupos.get(id);
    if(!g){g={id:id,principal:res.principal,visible:res.visible,filas:[],misiones:new Map(),originales:new Set()};grupos.set(id,g)}
    g.filas.push(r);g.originales.add(original);
    var mk=res.mision||'NO REFIERE',m=g.misiones.get(mk)||{nombre:mk,cantidad:0,filas:[]};m.cantidad++;m.filas.push(r);g.misiones.set(mk,m);
    r.__reporteV67={principal:res.principal,visible:res.visible,mision:mk,original:original,origen:res.origen};
  });
  return [...grupos.values()].sort(function(a,b){return a.visible.localeCompare(b.visible,'es',{sensitivity:'base'})});
}
function detalleMisionesV67(g){
  return [...g.misiones.values()].sort(function(a,b){return b.cantidad-a.cantidad||a.nombre.localeCompare(b.nombre,'es')});
}
function nombreArchivoV67(valor){return limpiar(valor).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'EMPRESA'}
function generarReporteAcuerdoV67(g){
  if(typeof XLSX==='undefined'){toast('No se cargó la librería Excel.','err');return}
  var resumen=detalleMisionesV67(g).map(function(m){return{'Empresa / marca':g.visible,'Acuerdo comercial (legal)':g.principal,'Empresa en misión':m.nombre,'Usuarios':m.cantidad}});
  var datos=g.filas.map(function(r){var meta=r.__reporteV67||{};return{
    'Empresa / marca':g.visible,
    'Acuerdo comercial (legal)':g.principal,
    'Empresa en misión':meta.mision||limpiar(r['Empresa en misión']),
    'Empresa registrada originalmente':meta.original||limpiar(r['Empresa en misión']),
    'Nombre completo':nombre(r),
    'Tipo documento':limpiar(r['Tipo doc']),
    'Documento':doc(r),
    'Celular':limpiar(r['Celular']),
    'Fecha registro':limpiar(r['Fecha de registro']),
    'Estado BIOFILE':estado(r)||'PENDIENTE',
    'N° orden':limpiar(r['NUMERO_OS_BIOFILE']),
    'Error':limpiar(r['ERROR_BIOFILE'])
  }});
  var wb=XLSX.utils.book_new(),wsR=XLSX.utils.json_to_sheet(resumen),wsE=XLSX.utils.json_to_sheet(datos);
  wsR['!cols']=[{wch:24},{wch:58},{wch:44},{wch:10}];
  wsE['!cols']=[{wch:24},{wch:58},{wch:44},{wch:38},{wch:32},{wch:16},{wch:18},{wch:16},{wch:22},{wch:18},{wch:16},{wch:42}];
  XLSX.utils.book_append_sheet(wb,wsR,'Resumen');XLSX.utils.book_append_sheet(wb,wsE,'Empleados');
  XLSX.writeFile(wb,'Reporte_'+nombreArchivoV67(g.visible)+'_'+hoyBogota()+'.xlsx');$('modalReporte').classList.add('oculto');
}
$('btnReporte').onclick=function(){
  var grupos=gruposReporteEmpresa(),cont=$('empresasReporte');cont.innerHTML='';
  var nota=document.createElement('div');nota.className='nota';nota.style.cssText='margin:0 0 12px;line-height:1.5';
  nota.textContent='El reporte se agrupa por la empresa del Acuerdo Comercial. Debajo se conserva cada Empresa en Misión y cuántos usuarios pertenecen a ella.';cont.appendChild(nota);
  if(!grupos.length){var vacio=document.createElement('div');vacio.className='nota';vacio.textContent='No hay empresas con estos filtros.';cont.appendChild(vacio)}
  else grupos.forEach(function(g){
    var b=document.createElement('button');b.className='btn gris empresa';b.style.cssText='width:100%;margin-bottom:8px;display:block;text-align:left;padding:11px 13px';
    var ms=detalleMisionesV67(g),detalle=ms.slice(0,5).map(function(m){return esc(m.nombre)+' ('+m.cantidad+')'}).join(' · ')+(ms.length>5?' · +'+(ms.length-5)+' más':'');
    var legal=g.visible!==g.principal?'<div style="font-size:10px;font-weight:650;opacity:.72;margin-top:4px">Acuerdo: '+esc(g.principal)+'</div>':'';
    b.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><span>🏢 '+esc(g.visible)+'</span><span>'+g.filas.length+'</span></div>'+legal+'<div style="font-size:10px;font-weight:650;opacity:.78;margin-top:5px;line-height:1.45">Empresa(s) en misión: '+detalle+'</div>';
    b.onclick=function(){generarReporteAcuerdoV67(g)};cont.appendChild(b);
  });
  $('modalReporte').classList.remove('oculto');
};
`;

const finalCode = codigo
  .replace('__RELACIONES__', JSON.stringify(relaciones))
  .replace('__CORTOS__', JSON.stringify(manifest.shortNames || {}))
  .replace('__ESPECIALES__', JSON.stringify(manifest.specialAliases || {}));

html = html.slice(0, inicioGrupos) + finalCode + html.slice(finReporte);

if (!html.includes('REPORTE_ACUERDO_MISION_V67')) throw new Error('No se instaló el reporte jerárquico v6.7.');
if (!html.includes('TEXTILES 1X1') || !html.includes('MEDYSCOL') || !html.includes('COMFICA COLOMBIA S.A.S.')) {
  throw new Error('Faltan relaciones críticas del Excel V2.7 en el HTML generado.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Netlify] Reporte v6.7: Acuerdo Comercial como empresa principal y Empresas en Misión como desglose.');
