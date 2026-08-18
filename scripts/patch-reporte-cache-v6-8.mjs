import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

const marcadorV67 = '/* REPORTE_ACUERDO_MISION_V67 */';
const inicioV67 = html.indexOf(marcadorV67);
const inicioGrupos = html.indexOf('function gruposReporteEmpresa(){', inicioV67);
const finGrupos = html.indexOf('function detalleMisionesV67(g){', inicioGrupos);
if (inicioV67 < 0 || inicioGrupos < 0 || finGrupos < 0) {
  throw new Error('Primero debe ejecutarse patch-reporte-acuerdo-mision-v6-7.mjs.');
}

const codigo = String.raw`/* REPORTE_CACHE_INCREMENTAL_V68 */
const REPORTE_CACHE_V68_VERSION='V68-R1093-20260818';
const REPORTE_CACHE_V68_KEY='VIP_REPORTE_EMPRESA_'+REPORTE_CACHE_V68_VERSION;
let REPORTE_CACHE_V68=null;
let REPORTE_CACHE_V68_DIRTY=false;
let REPORTE_CACHE_V68_STATS={reutilizadas:0,nuevas:0,contextuales:0};

function cargarCacheReporteV68(){
  if(REPORTE_CACHE_V68)return REPORTE_CACHE_V68;
  REPORTE_CACHE_V68=new Map();
  try{
    var raw=localStorage.getItem(REPORTE_CACHE_V68_KEY);
    if(!raw)return REPORTE_CACHE_V68;
    var data=JSON.parse(raw);
    if(!data||data.version!==REPORTE_CACHE_V68_VERSION||!data.items)return REPORTE_CACHE_V68;
    Object.entries(data.items).forEach(function(par){
      var x=par[1];
      if(x&&x.principal&&x.mision)REPORTE_CACHE_V68.set(par[0],x);
    });
  }catch(e){}
  return REPORTE_CACHE_V68;
}
function guardarCacheReporteV68(){
  if(!REPORTE_CACHE_V68_DIRTY||!REPORTE_CACHE_V68)return;
  try{
    var entradas=[...REPORTE_CACHE_V68.entries()];
    if(entradas.length>2000)entradas=entradas.slice(entradas.length-2000);
    localStorage.setItem(REPORTE_CACHE_V68_KEY,JSON.stringify({version:REPORTE_CACHE_V68_VERSION,guardado:new Date().toISOString(),items:Object.fromEntries(entradas)}));
    REPORTE_CACHE_V68_DIRTY=false;
  }catch(e){}
}
function claveCacheReporteV68(valor){
  return claveRelacionV67(valor)||literalRelacionV67(valor)||textoRelacionV67(valor);
}
function copiaResultadoReporteV68(x,origen){
  if(!x)return null;
  return{principal:x.principal,visible:x.visible,mision:x.mision,confianza:Number(x.confianza||0),origen:origen||x.origen||'cache'};
}
function resolverBaseCacheV68(valor){
  var key=claveCacheReporteV68(valor),cache=cargarCacheReporteV68();
  if(key&&cache.has(key)){
    REPORTE_CACHE_V68_STATS.reutilizadas++;
    return copiaResultadoReporteV68(cache.get(key),'cache');
  }
  var res=resolverRelacionV67(valor,null);
  REPORTE_CACHE_V68_STATS.nuevas++;
  if(key&&res){
    cache.set(key,copiaResultadoReporteV68(res,res.origen));
    REPORTE_CACHE_V68_DIRTY=true;
  }
  return res;
}
function resolverFinalCacheV68(valor,base,soporteMisiones){
  if(!base)return resolverRelacionV67(valor,soporteMisiones);
  var origen=String(base.origen||'');
  if(origen==='acronimo'||origen==='fuzzy'||origen==='sin-relacion'||origen==='cache'){
    var contextual=resolverContextoV67(valor,soporteMisiones);
    if(contextual){REPORTE_CACHE_V68_STATS.contextuales++;return contextual}
  }
  return base;
}
function gruposReporteEmpresa(){
  REPORTE_CACHE_V68_STATS={reutilizadas:0,nuevas:0,contextuales:0};
  var filas=filtrados().filter(function(r){return limpiar(r['Empresa en misión'])});
  var observados=new Map();
  filas.forEach(function(r){
    var original=limpiar(r['Empresa en misión']),key=claveCacheReporteV68(original);
    var x=observados.get(key);
    if(!x){x={key:key,original:original,cantidad:0};observados.set(key,x)}
    x.cantidad++;
  });

  var bases=new Map(),soporteMisiones=new Map();
  observados.forEach(function(x){
    var base=resolverBaseCacheV68(x.original);bases.set(x.key,base);
    if(base&&base.confianza>=.86){
      soporteMisiones.set(base.mision,(soporteMisiones.get(base.mision)||0)+x.cantidad);
    }
  });

  var finales=new Map();
  observados.forEach(function(x){
    finales.set(x.key,resolverFinalCacheV68(x.original,bases.get(x.key),soporteMisiones));
  });
  guardarCacheReporteV68();

  var grupos=new Map();
  filas.forEach(function(r){
    var original=limpiar(r['Empresa en misión']),key=claveCacheReporteV68(original),res=finales.get(key);if(!res)return;
    var id=claveRelacionV67(res.principal)||textoRelacionV67(res.principal),g=grupos.get(id);
    if(!g){g={id:id,principal:res.principal,visible:res.visible,filas:[],misiones:new Map(),originales:new Set()};grupos.set(id,g)}
    g.filas.push(r);g.originales.add(original);
    var mk=res.mision||'NO REFIERE',m=g.misiones.get(mk)||{nombre:mk,cantidad:0,filas:[]};m.cantidad++;m.filas.push(r);g.misiones.set(mk,m);
    r.__reporteV67={principal:res.principal,visible:res.visible,mision:mk,original:original,origen:res.origen};
  });
  return [...grupos.values()].sort(function(a,b){return a.visible.localeCompare(b.visible,'es',{sensitivity:'base'})});
}
`;

html = html.slice(0, inicioGrupos) + codigo + html.slice(finGrupos);

if (!html.includes('REPORTE_CACHE_INCREMENTAL_V68')) {
  throw new Error('No se instaló la caché incremental v6.8.');
}
if (!html.includes("REPORTE_CACHE_V68_KEY='VIP_REPORTE_EMPRESA_'")) {
  throw new Error('No se instaló la persistencia local del reporte v6.8.');
}
if (!html.includes('observados.forEach(function(x)')) {
  throw new Error('El reporte v6.8 no quedó optimizado por nombres únicos.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Netlify] Reporte v6.8: cache persistente e incremental habilitada; solo se analizan empresas nuevas.');
