import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
const catalogDir = new URL('../data/empresas-mision-v27/', import.meta.url);

let html = fs.readFileSync(appPath, 'utf8');
const archivosCatalogo = fs.readdirSync(catalogDir).filter((n) => /^parte-\d+\.json$/i.test(n)).sort();
const empresas = Object.assign({}, ...archivosCatalogo.map((n) => JSON.parse(fs.readFileSync(new URL(n, catalogDir), 'utf8'))));
if (archivosCatalogo.length !== 8 || Object.keys(empresas).length !== 1104) {
  throw new Error('El catálogo V2.7 está incompleto. Se esperaban 8 partes y 1104 empresas normalizadas.');
}

function limpiarBase(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/&/g, ' Y ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function claveEmpresa(valor) {
  const tokens = limpiarBase(valor).split(' ').filter(Boolean);
  if (tokens.length >= 2 && tokens.slice(-2).join(' ') === 'SAS BIC') tokens.splice(-2);
  else if (tokens.length >= 4 && tokens.slice(-4).join(' ') === 'S A S BIC') tokens.splice(-4);
  if (tokens.length && tokens.at(-1) === 'SAS') tokens.pop();
  else if (tokens.length >= 3 && tokens.slice(-3).join(' ') === 'S A S') tokens.splice(-3);
  return tokens.join('');
}

const pruebaBase = claveEmpresa('Alimentos Gamar');
const pruebaSas = claveEmpresa('  ALIMENTOS   GÁMAR S.A.S. ');
if (!pruebaBase || pruebaBase !== pruebaSas) {
  throw new Error('La normalización de empresa no unifica mayúsculas, tildes, espacios y S.A.S.');
}
if (!empresas[pruebaBase] || !/ALIMENTOS\s+GAMAR/i.test(empresas[pruebaBase])) {
  throw new Error('El catálogo V2.7 no contiene la referencia esperada de ALIMENTOS GAMAR.');
}

if (!html.includes('/* REPORTE_EMPRESAS_CANONICAS_V65 */')) {
  const inicio = html.indexOf("$('btnReporte').onclick=()=>{");
  const fin = html.indexOf("$('cerrarReporte').onclick=", inicio);
  if (inicio < 0 || fin < 0) throw new Error('No se encontró el bloque del reporte por empresa.');

  const codigoReporte = String.raw`/* REPORTE_EMPRESAS_CANONICAS_V65 */
const CATALOGO_EMPRESAS_MISION_V27=__CATALOGO__;
const CATALOGO_EMPRESAS_MISION_ENTRADAS=Object.entries(CATALOGO_EMPRESAS_MISION_V27).map(function(par){return{clave:par[0],nombre:par[1]}});

function claveEmpresaReporte(valor){
  var base=limpiar(valor).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/&/g,' Y ').replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  var tokens=base.split(' ').filter(Boolean);
  if(tokens.length>=2&&tokens.slice(-2).join(' ')==='SAS BIC')tokens.splice(-2);
  else if(tokens.length>=4&&tokens.slice(-4).join(' ')==='S A S BIC')tokens.splice(-4);
  if(tokens.length&&tokens[tokens.length-1]==='SAS')tokens.pop();
  else if(tokens.length>=3&&tokens.slice(-3).join(' ')==='S A S')tokens.splice(-3);
  return tokens.join('');
}
function distanciaEmpresaReporte(a,b){
  if(a===b)return 0;
  if(!a.length)return b.length;
  if(!b.length)return a.length;
  var anterior=Array.from({length:b.length+1},function(_,i){return i});
  for(var i=1;i<=a.length;i++){
    var actual=[i];
    for(var j=1;j<=b.length;j++){
      var costo=a[i-1]===b[j-1]?0:1;
      actual[j]=Math.min(actual[j-1]+1,anterior[j]+1,anterior[j-1]+costo);
    }
    anterior=actual;
  }
  return anterior[b.length];
}
function nombreObservadoEmpresaReporte(valor){
  return limpiar(valor).replace(/\s+/g,' ').toUpperCase();
}
function prioridadNombreEmpresaReporte(valor){
  var v=nombreObservadoEmpresaReporte(valor);
  var legal=/(^|[\s.])S[\s.]*A[\s.]*S[\s.]*\.?$/i.test(v)||/\bSAS\b$/i.test(v);
  return (legal?100000:0)+v.length;
}
function resolverEmpresaReporte(valor){
  var original=limpiar(valor).replace(/\s+/g,' ');
  var clave=claveEmpresaReporte(original);
  if(!clave)return{clave:'',nombre:original,catalogo:false,confianza:0};
  if(CATALOGO_EMPRESAS_MISION_V27[clave])return{clave:clave,nombre:CATALOGO_EMPRESAS_MISION_V27[clave],catalogo:true,confianza:1};
  if(clave.length<7)return{clave:clave,nombre:nombreObservadoEmpresaReporte(original),catalogo:false,confianza:0};
  var mejor=null,segundo=null;
  for(var i=0;i<CATALOGO_EMPRESAS_MISION_ENTRADAS.length;i++){
    var c=CATALOGO_EMPRESAS_MISION_ENTRADAS[i];
    var largo=Math.max(clave.length,c.clave.length);
    if(!largo)continue;
    var diferencia=Math.abs(clave.length-c.clave.length);
    if(diferencia>Math.max(3,Math.floor(largo*0.16)))continue;
    var score=1-(distanciaEmpresaReporte(clave,c.clave)/largo);
    var candidato={clave:c.clave,nombre:c.nombre,score:score};
    if(!mejor||score>mejor.score){segundo=mejor;mejor=candidato}
    else if(!segundo||score>segundo.score)segundo=candidato;
  }
  var margen=mejor?mejor.score-(segundo?segundo.score:0):0;
  if(mejor&&mejor.score>=0.94&&(mejor.score>=0.975||margen>=0.05)){
    return{clave:mejor.clave,nombre:mejor.nombre,catalogo:true,confianza:mejor.score};
  }
  return{clave:clave,nombre:nombreObservadoEmpresaReporte(original),catalogo:false,confianza:0};
}
function gruposReporteEmpresa(){
  var grupos=new Map();
  filtrados().forEach(function(r){
    var original=limpiar(r['Empresa en misión']);
    if(!original)return;
    var res=resolverEmpresaReporte(original);
    if(!res.clave)return;
    var id=(res.catalogo?'CAT:':'RAW:')+res.clave;
    var g=grupos.get(id);
    if(!g){
      g={id:id,nombre:res.nombre,filas:[],variantes:new Set(),catalogo:res.catalogo,confianza:res.confianza||0};
      grupos.set(id,g);
    }
    g.filas.push(r);
    g.variantes.add(original);
    if(!g.catalogo&&prioridadNombreEmpresaReporte(original)>prioridadNombreEmpresaReporte(g.nombre))g.nombre=nombreObservadoEmpresaReporte(original);
  });
  return Array.from(grupos.values()).sort(function(a,b){return a.nombre.localeCompare(b.nombre,'es',{sensitivity:'base'})});
}
$('btnReporte').onclick=function(){
  var grupos=gruposReporteEmpresa(),cont=$('empresasReporte');
  cont.innerHTML='';
  var nota=document.createElement('div');
  nota.className='nota';
  nota.style.cssText='margin:0 0 12px;line-height:1.45';
  nota.textContent='Se unifican automáticamente mayúsculas/minúsculas, tildes, puntuación, espacios y S.A.S. El catálogo V2.7 también corrige coincidencias muy parecidas solo cuando la confianza es alta.';
  cont.appendChild(nota);
  if(!grupos.length){
    var vacio=document.createElement('div');
    vacio.className='nota';
    vacio.textContent='No hay empresas con estos filtros.';
    cont.appendChild(vacio);
  }else{
    grupos.forEach(function(g){
      var b=document.createElement('button');
      b.className='btn gris empresa';
      b.style.cssText='width:100%;margin-bottom:7px;justify-content:space-between';
      b.innerHTML='<span>🏢 '+esc(g.nombre)+'</span><span>'+g.filas.length+'</span>';
      if(g.variantes.size>1)b.title='Nombres unificados: '+Array.from(g.variantes).join(' | ');
      b.onclick=function(){generarReporte(g.nombre,g.filas)};
      cont.appendChild(b);
    });
  }
  $('modalReporte').classList.remove('oculto');
};
`;
  const reporteFinal = codigoReporte.replace('__CATALOGO__', JSON.stringify(empresas));
  html = html.slice(0, inicio) + reporteFinal + html.slice(fin);
}

if (!html.includes('/* ELIMINADO_POR_VISIBLE_V65 */')) {
  const eliminadoAnterior = "if(e==='ELIMINADO')return{p:100,t:'Enviado a Eliminados',d:r?.['MOTIVO_ELIMINADO']?('Motivo: '+r['MOTIVO_ELIMINADO']):'Este registro fue retirado de la cola de ingreso a BIOFILE.',c:'',os:''};";
  if (!html.includes(eliminadoAnterior)) {
    throw new Error('No se encontró el estado visual de Eliminados.');
  }
  const eliminadoNuevo = "/* ELIMINADO_POR_VISIBLE_V65 */if(e==='ELIMINADO'){const motivo=limpiar(r?.['MOTIVO_ELIMINADO'])?('Motivo: '+limpiar(r['MOTIVO_ELIMINADO'])):'Motivo no registrado';const actor=limpiar(r?.['ELIMINADO_POR'])||'No registrado';return{p:100,t:'Enviado a Eliminados',d:motivo+' · Eliminado por: '+actor,c:'',os:''};}";
  html = html.replace(eliminadoAnterior, eliminadoNuevo);
}

if (!html.includes('REPORTE_EMPRESAS_CANONICAS_V65') || !html.includes('ELIMINADO_POR_VISIBLE_V65')) {
  throw new Error('No se instalaron correctamente las mejoras v6.5.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Netlify] Reporte de empresas normalizado y responsable de Eliminados v6.5 habilitados.');
