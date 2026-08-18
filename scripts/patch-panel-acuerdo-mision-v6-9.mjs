import fs from 'node:fs';

const appPath=new URL('../app-v3.html',import.meta.url);
let html=fs.readFileSync(appPath,'utf8');

if(html.includes('/* PANEL_ACUERDO_MISION_V69 */')){
  console.log('[Panel] Acuerdo/Empresa en Misión v6.9 ya instalado.');
  process.exit(0);
}
if(!html.includes('/* REPORTE_ACUERDO_MISION_V67 */')||!html.includes('/* REPORTE_CACHE_INCREMENTAL_V68 */')){
  throw new Error('Primero deben aplicarse las relaciones v6.7 y la caché v6.8.');
}

const marcador='function pintar(){';
const idx=html.indexOf(marcador);
if(idx<0)throw new Error('No se encontró function pintar().');

const helper=String.raw`/* PANEL_ACUERDO_MISION_V69 */
const EMPRESA_META_PANEL_V69=new Map();
function claveEmpresaPanelV69(valor){
  try{return claveRelacionV67(valor)||textoRelacionV67(valor)}catch(_){return limpiar(valor).toUpperCase()}
}
function metaEmpresaPanelV69(r){
  var original=limpiar(r&&r['Empresa en misión']);
  if(!original)return{acuerdo:'',mision:'',original:'',relacion:false};
  var key=claveEmpresaPanelV69(original);
  if(EMPRESA_META_PANEL_V69.has(key))return EMPRESA_META_PANEL_V69.get(key);
  var meta={acuerdo:original,mision:'',original:original,relacion:false};
  try{
    var res=typeof resolverBaseCacheV68==='function'?resolverBaseCacheV68(original):resolverRelacionV67(original,null);
    if(res&&res.principal&&Number(res.confianza||0)>=.82){
      var principal=limpiar(res.principal),mision=limpiar(res.mision||original);
      var originalEsPrincipal=claveEmpresaPanelV69(original)===claveEmpresaPanelV69(principal);
      meta.acuerdo=principal;
      meta.mision=!originalEsPrincipal&&mision&&claveEmpresaPanelV69(mision)!==claveEmpresaPanelV69(principal)?mision:'';
      meta.relacion=true;
    }
  }catch(_){ }
  EMPRESA_META_PANEL_V69.set(key,meta);
  return meta;
}
function badgesEmpresaPanelV69(r){
  var m=metaEmpresaPanelV69(r);if(!m.acuerdo)return'';
  var out='<span class="badge">🏢 Acuerdo: '+esc(m.acuerdo)+'</span>';
  if(m.mision)out+='<span class="badge">👥 Misión: '+esc(m.mision)+'</span>';
  return out;
}
function filaRelacionPanelV69(etiqueta,valor){
  var fila=document.createElement('div');fila.className='dato';
  fila.innerHTML='<div class="et">'+esc(etiqueta)+'</div><div class="val">'+esc(valor)+'</div><button class="btn gris sm copiar">Copiar</button><span></span>';
  fila.querySelector('.copiar').onclick=async()=>{try{await navigator.clipboard.writeText(valor);toast('Dato copiado.','ok')}catch{toast('No se pudo copiar.','err')}};
  return fila;
}
`;
html=html.slice(0,idx)+helper+html.slice(idx);

const badgeViejo="${limpiar(r['Empresa en misión'])?`<span class=\"badge\">🏢 ${esc(r['Empresa en misión'])}</span>`:''}";
const badgeNuevo='${badgesEmpresaPanelV69(r)}';
if(!html.includes(badgeViejo))throw new Error('No se encontró el badge original de empresa.');
html=html.replace(badgeViejo,badgeNuevo);

const campoViejo='["Empresa en misión","Nombre de la empresa","Trabajo y afiliaciones"]';
const campoNuevo='["Empresa en misión","Empresa en misión","Trabajo y afiliaciones"]';
if(html.includes(campoViejo))html=html.replace(campoViejo,campoNuevo);

const pintarDatosViejo="function pintarDatos(r){const cont=$('tablaDatos');cont.innerHTML='';let g='';let box;CAMPOS.forEach(";
const pintarDatosNuevo=`function pintarDatos(r){const cont=$('tablaDatos');cont.innerHTML='';
  const rel=metaEmpresaPanelV69(r);
  if(rel.acuerdo){
    const relBox=document.createElement('div');relBox.className='grupo';relBox.innerHTML='<div class="grupoTitulo">Relación empresarial</div>';
    relBox.appendChild(filaRelacionPanelV69('Acuerdo comercial',rel.acuerdo));
    if(rel.mision)relBox.appendChild(filaRelacionPanelV69('Empresa en misión',rel.mision));
    cont.appendChild(relBox);
  }
  let g='';let box;CAMPOS.forEach(`;
if(!html.includes(pintarDatosViejo))throw new Error('No se encontró pintarDatos para agregar la relación empresarial.');
html=html.replace(pintarDatosViejo,pintarDatosNuevo);

if(!html.includes('PANEL_ACUERDO_MISION_V69')||!html.includes('badgesEmpresaPanelV69')||!html.includes('Relación empresarial')){
  throw new Error('Panel Acuerdo/Empresa en Misión v6.9 incompleto.');
}

fs.writeFileSync(appPath,html,'utf8');
console.log('[Panel] v6.9: cada paciente muestra Acuerdo Comercial y, cuando corresponde, Empresa en Misión derivada del catálogo V2.7.');
