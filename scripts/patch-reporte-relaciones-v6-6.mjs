import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
const catalogDir = new URL('../data/empresas-mision-v27/', import.meta.url);
const aliasPath = new URL('../data/empresas-mision-v27/aliases-acuerdos-v66.json', import.meta.url);

let html = fs.readFileSync(appPath, 'utf8');
const archivosCatalogo = fs.readdirSync(catalogDir).filter((n) => /^parte-\d+\.json$/i.test(n)).sort();
const empresas = Object.assign({}, ...archivosCatalogo.map((n) => JSON.parse(fs.readFileSync(new URL(n, catalogDir), 'utf8'))));
const aliases = JSON.parse(fs.readFileSync(aliasPath, 'utf8'));

if (archivosCatalogo.length !== 8 || Object.keys(empresas).length !== 1104) {
  throw new Error('El catálogo V2.7 está incompleto. Se esperaban 8 partes y 1104 referencias.');
}
if (Object.keys(aliases).length !== 279) {
  throw new Error('La guía de alias del Excel V2.7 está incompleta. Se esperaban 279 alias útiles.');
}
if (aliases.AVANZADOS !== 'TEMPORALES AVANZADOS SAS') {
  throw new Error('La guía V2.7 no relaciona AVANZADOS con TEMPORALES AVANZADOS SAS.');
}
if (aliases.CENCARDIO !== 'CENTRO CARDIOVASCULAR COLOMBIANO S.A.S.') {
  throw new Error('La guía V2.7 no relaciona CENCARDIO con CENTRO CARDIOVASCULAR COLOMBIANO S.A.S.');
}

const inicio = html.indexOf('/* REPORTE_EMPRESAS_CANONICAS_V65 */');
const fin = html.indexOf("$('cerrarReporte').onclick=", inicio);
if (inicio < 0 || fin < 0) {
  throw new Error('Primero debe ejecutarse patch-reporte-empresas-v6-5.mjs.');
}

const codigo = String.raw`/* REPORTE_EMPRESAS_RELACIONES_EXCEL_V66 */
const CATALOGO_EMPRESAS_MISION_V27=__CATALOGO__;
const ALIAS_ACUERDOS_EXCEL_V66=__ALIASES__;
const STOP_EMPRESA_V66=new Set(['DE','DEL','LA','EL','LOS','LAS','Y','E','EN','PARA','POR']);
const LEGAL_EMPRESA_V66=new Set(['SAS','SA','LTDA','LIMITADA','EU','SCA','BIC']);

function textoEmpresaV66(valor){
  return limpiar(valor).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/&/g,' Y ').replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function tokensEmpresaV66(valor){
  var tokens=textoEmpresaV66(valor).split(' ').filter(Boolean);
  var cambio=true;
  while(tokens.length&&cambio){
    cambio=false;
    if(LEGAL_EMPRESA_V66.has(tokens[tokens.length-1])){tokens.pop();cambio=true;continue}
    var patrones=[['S','A','S'],['S','A'],['E','U'],['S','C','A']];
    for(var p=0;p<patrones.length;p++){
      var patron=patrones[p];
      if(tokens.length>=patron.length&&tokens.slice(-patron.length).join('|')===patron.join('|')){
        tokens.splice(tokens.length-patron.length,patron.length);cambio=true;break;
      }
    }
  }
  return tokens.filter(function(t){return !STOP_EMPRESA_V66.has(t)&&!LEGAL_EMPRESA_V66.has(t)&&t!=='S'&&t!=='A'});
}
function claveEmpresaReporte(valor){return tokensEmpresaV66(valor).join('')}
function nombreObservadoEmpresaReporte(valor){return limpiar(valor).replace(/\s+/g,' ').toUpperCase()}
function prioridadNombreEmpresaReporte(valor){
  var v=nombreObservadoEmpresaReporte(valor);
  var legal=/(^|[\s.])S[\s.]*A[\s.]*S[\s.]*\.?$/i.test(v)||/\bSAS\b$/i.test(v)||/\bLTDA\.?$/i.test(v)||/\bLIMITADA$/i.test(v);
  return (legal?100000:0)+v.length;
}
function distanciaEmpresaReporte(a,b){
  if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;
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
function similitudCompactaV66(a,b){
  a=String(a||'');b=String(b||'');var largo=Math.max(a.length,b.length);if(!largo)return 1;
  return 1-(distanciaEmpresaReporte(a,b)/largo);
}
function similitudTokenV66(a,b){if(a===b)return 1;var aa=String(a||''),bb=String(b||'');if(aa.length>=4&&aa.length===bb.length&&aa.split('').sort().join('')===bb.split('').sort().join(''))return .95;return similitudCompactaV66(aa,bb)}

const REFERENCIAS_EMPRESA_V66=[];
const vistosReferenciaV66=new Set();
Object.values(CATALOGO_EMPRESAS_MISION_V27).forEach(function(nombre){
  var limpio=limpiar(nombre);if(!limpio)return;
  var id=textoEmpresaV66(limpio);if(vistosReferenciaV66.has(id))return;
  vistosReferenciaV66.add(id);
  REFERENCIAS_EMPRESA_V66.push({nombre:limpio,clave:claveEmpresaReporte(limpio),tokens:tokensEmpresaV66(limpio)});
});
Object.values(ALIAS_ACUERDOS_EXCEL_V66).forEach(function(nombre){
  var limpio=limpiar(nombre);if(!limpio)return;
  var id=textoEmpresaV66(limpio);if(vistosReferenciaV66.has(id))return;
  vistosReferenciaV66.add(id);
  REFERENCIAS_EMPRESA_V66.push({nombre:limpio,clave:claveEmpresaReporte(limpio),tokens:tokensEmpresaV66(limpio)});
});
const ALIAS_ENTRADAS_V66=Object.entries(ALIAS_ACUERDOS_EXCEL_V66);
const INDICE_EXACTO_V66={};
REFERENCIAS_EMPRESA_V66.forEach(function(r){if(r.clave&&!INDICE_EXACTO_V66[r.clave])INDICE_EXACTO_V66[r.clave]=r.nombre});
Object.values(ALIAS_ACUERDOS_EXCEL_V66).forEach(function(nombre){var k=claveEmpresaReporte(nombre);if(k)INDICE_EXACTO_V66[k]=nombre});
Object.entries(ALIAS_ACUERDOS_EXCEL_V66).forEach(function(par){INDICE_EXACTO_V66[par[0]]=par[1]});

function puntuarReferenciaV66(info,ref){
  if(!info.clave||!ref.clave)return 0;
  if(info.clave===ref.clave)return 1;
  var charScore=similitudCompactaV66(info.clave,ref.clave);
  var a=info.tokens,b=ref.tokens;
  if(!a.length||!b.length)return charScore;
  var setA=new Set(a),setB=new Set(b),inter=0;
  setA.forEach(function(t){if(setB.has(t))inter++});
  var exactCov=inter/Math.min(setA.size,setB.size);
  var corta=a.length<=b.length?a:b,larga=a.length<=b.length?b:a;
  var suma=0;
  corta.forEach(function(t){var mejor=0;larga.forEach(function(u){mejor=Math.max(mejor,similitudTokenV66(t,u))});suma+=mejor});
  var fuzzyCov=suma/Math.max(1,corta.length);
  var subset=0;
  if(exactCov===1){
    if(Math.min(setA.size,setB.size)>=2)subset=.93+.04*(Math.min(setA.size,setB.size)/Math.max(setA.size,setB.size));
    else{
      var comun='';setA.forEach(function(t){if(setB.has(t))comun=t});
      if(comun.length>=6)subset=.83+Math.min(.04,comun.length/250);
    }
  }
  var blended=.58*fuzzyCov+.27*charScore+.15*exactCov;
  var menor=info.clave.length<=ref.clave.length?info.clave:ref.clave;
  var mayor=info.clave.length<=ref.clave.length?ref.clave:info.clave;
  var contiene=menor.length>=7&&mayor.includes(menor)?.84+.06*(menor.length/mayor.length):0;
  return Math.max(charScore,subset,blended,contiene);
}
function candidatosEmpresaV66(valor,soporte){
  var original=limpiar(valor).replace(/\s+/g,' '),clave=claveEmpresaReporte(original),tokens=tokensEmpresaV66(original);
  var info={original:original,clave:clave,tokens:tokens};
  if(!clave)return[];
  var directo=INDICE_EXACTO_V66[clave];
  if(directo)return[{nombre:directo,score:1,final:1.2,soporte:(soporte&&soporte.get(directo))||0,directo:true}];
  var porNombre=new Map();
  function agregar(nombre,score,origen){
    if(!nombre||score<=0)return;var actual=porNombre.get(nombre);
    if(!actual||score>actual.score)porNombre.set(nombre,{nombre:nombre,score:score,origen:origen||'catalogo'});
  }
  REFERENCIAS_EMPRESA_V66.forEach(function(ref){var s=puntuarReferenciaV66(info,ref);if(s>=.48)agregar(ref.nombre,s,'referencia')});
  ALIAS_ENTRADAS_V66.forEach(function(par){
    var s=similitudCompactaV66(clave,par[0]);
    if(s>=.72)agregar(par[1],Math.min(.995,s+.02),'alias-excel');
  });
  var salida=Array.from(porNombre.values()).map(function(c){
    var n=(soporte&&soporte.get(c.nombre))||0;
    var bonus=n?Math.min(.14,.08*(Math.log(1+n)/Math.log(2))):0;
    return Object.assign(c,{soporte:n,final:c.score+bonus});
  });
  salida.sort(function(a,b){return b.final-a.final||b.score-a.score||a.nombre.localeCompare(b.nombre,'es')});
  return salida;
}
function resolverEmpresaReporte(valor,soporte){
  var original=limpiar(valor).replace(/\s+/g,' '),clave=claveEmpresaReporte(original);
  if(!clave)return{clave:'',nombre:original,catalogo:false,confianza:0};
  var cs=candidatosEmpresaV66(original,soporte),mejor=cs[0],segundo=cs[1];
  if(!mejor)return{clave:clave,nombre:nombreObservadoEmpresaReporte(original),catalogo:false,confianza:0};
  if(mejor.directo||mejor.score>=.985)return{clave:claveEmpresaReporte(mejor.nombre),nombre:mejor.nombre,catalogo:true,confianza:mejor.score};
  var gapFinal=mejor.final-(segundo?segundo.final:0),gapRaw=mejor.score-(segundo?segundo.score:0);
  var acepta=false;
  if(mejor.score>=.92&&gapRaw>=.015)acepta=true;
  else if(mejor.soporte>0&&mejor.final>=.86&&gapFinal>=.008)acepta=true;
  else if(mejor.score>=.80&&gapRaw>=.09)acepta=true;
  else if(tokensEmpresaV66(original).length>=2&&mejor.score>=.74&&gapRaw>=.12)acepta=true;
  if(acepta)return{clave:claveEmpresaReporte(mejor.nombre),nombre:mejor.nombre,catalogo:true,confianza:mejor.score};
  return{clave:clave,nombre:nombreObservadoEmpresaReporte(original),catalogo:false,confianza:mejor.score};
}
function gruposReporteEmpresa(){
  var observados=new Map();
  filtrados().forEach(function(r){var original=limpiar(r['Empresa en misión']);if(!original)return;observados.set(original,(observados.get(original)||0)+1)});
  var soporte=new Map();
  observados.forEach(function(cantidad,nombre){
    var clave=claveEmpresaReporte(nombre),directo=INDICE_EXACTO_V66[clave];
    if(directo)soporte.set(directo,(soporte.get(directo)||0)+cantidad);
  });
  var grupos=new Map();
  filtrados().forEach(function(r){
    var original=limpiar(r['Empresa en misión']);if(!original)return;
    var res=resolverEmpresaReporte(original,soporte);if(!res.clave)return;
    var id=(res.catalogo?'CAT:':'RAW:')+res.clave,g=grupos.get(id);
    if(!g){g={id:id,nombre:res.nombre,filas:[],variantes:new Set(),catalogo:res.catalogo,confianza:res.confianza||0};grupos.set(id,g)}
    g.filas.push(r);g.variantes.add(original);
    if(!g.catalogo&&prioridadNombreEmpresaReporte(original)>prioridadNombreEmpresaReporte(g.nombre))g.nombre=nombreObservadoEmpresaReporte(original);
  });
  return Array.from(grupos.values()).sort(function(a,b){return a.nombre.localeCompare(b.nombre,'es',{sensitivity:'base'})});
}
$('btnReporte').onclick=function(){
  var grupos=gruposReporteEmpresa(),cont=$('empresasReporte');cont.innerHTML='';
  var nota=document.createElement('div');nota.className='nota';nota.style.cssText='margin:0 0 12px;line-height:1.45';
  nota.textContent='Se usa como guía el Excel V2.7: nombre del acuerdo comercial, nombre del cliente, empresas en misión y alias empresariales detectados. También se unifican tildes, espacios, S.A.S./LTDA y errores pequeños de escritura.';
  cont.appendChild(nota);
  if(!grupos.length){var vacio=document.createElement('div');vacio.className='nota';vacio.textContent='No hay empresas con estos filtros.';cont.appendChild(vacio)}
  else grupos.forEach(function(g){
    var b=document.createElement('button');b.className='btn gris empresa';b.style.cssText='width:100%;margin-bottom:7px;justify-content:space-between';
    b.innerHTML='<span>🏢 '+esc(g.nombre)+'</span><span>'+g.filas.length+'</span>';
    if(g.variantes.size>1)b.title='Nombres unificados: '+Array.from(g.variantes).join(' | ');
    b.onclick=function(){generarReporte(g.nombre,g.filas)};cont.appendChild(b);
  });
  $('modalReporte').classList.remove('oculto');
};
`;

const finalCode = codigo
  .replace('__CATALOGO__', JSON.stringify(empresas))
  .replace('__ALIASES__', JSON.stringify(aliases));
html = html.slice(0, inicio) + finalCode + html.slice(fin);

if (!html.includes('REPORTE_EMPRESAS_RELACIONES_EXCEL_V66')) {
  throw new Error('No se instaló la lógica de relaciones del Excel V2.7.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Netlify] Reporte de empresas v6.6: relaciones del Excel, alias y similitud contextual habilitados.');
