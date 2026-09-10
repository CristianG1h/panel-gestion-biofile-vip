import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (!html.includes('/* HISTORICO_FUENTE_LEGACY_V76 */')) {
  const inicioCarga = html.indexOf('async function cargarRegistros(');
  const finCarga = html.indexOf('function filtrados(){', inicioCarga);
  if (inicioCarga < 0 || finCarga < 0) throw new Error('No se encontró cargarRegistros() para instalar la recuperación histórica v7.6.');

  const helpers = `/* HISTORICO_FUENTE_LEGACY_V76 */
const LEGACY_MANUALES_KEYS=['vip_biofile_ingresados_manuales_v2','documentos_ingresados','documentos_confirmados_robot'];
function normalizarDocumentoLegacy(v){return limpiar(v).replace(/\\.0$/,'').replace(/[^A-Za-z0-9]/g,'').toUpperCase()}
function documentosIngresadosLegacy(){
  const salida=new Set();
  for(const key of LEGACY_MANUALES_KEYS){
    try{
      const raw=localStorage.getItem(key);if(!raw)continue;
      const data=JSON.parse(raw);
      const valores=Array.isArray(data)?data:(data&&typeof data==='object'?Object.keys(data).filter(k=>data[k]):[]);
      valores.forEach(v=>{const d=normalizarDocumentoLegacy(v);if(d)salida.add(d)});
    }catch(_e){}
  }
  return salida;
}
function huellaRegistroLegacy(r){
  return [normalizarDocumentoLegacy(r?.['N° documento']),fechaRegIso(r?.['Fecha de registro'])||limpiar(r?.['Fecha de registro']),limpiar(r?.['Primer nombre']).toUpperCase(),limpiar(r?.['Primer apellido']).toUpperCase()].join('|');
}
async function cargarIngresadosLegacy(busqueda,actuales=[]){
  const manuales=documentosIngresadosLegacy();
  try{
    const u=URL_APPS_SCRIPT+'?accion=listar&clave='+encodeURIComponent(CLAVE_CONSULTA)+'&busqueda='+encodeURIComponent(busqueda||'')+'&_='+Date.now();
    const resp=await fetch(u,{cache:'no-store',redirect:'follow'});
    const data=await resp.json();
    if(!resp.ok||data?.ok===false||!Array.isArray(data?.registros))return[];
    const existentes=new Set(actuales.map(huellaRegistroLegacy));
    const historicos=[];
    for(const original of data.registros){
      const d=normalizarDocumentoLegacy(original?.['N° documento']);
      if(!d)continue;
      const e=limpiar(original?.['ESTADO_BIOFILE']).toUpperCase();
      const confirmadoManual=manuales.has(d);
      const confirmadoSistema=e==='COMPLETADO';
      if(!confirmadoManual&&!confirmadoSistema)continue;
      const r={...original};
      const h=huellaRegistroLegacy(r);
      if(existentes.has(h))continue;
      existentes.add(h);
      r['ESTADO_BIOFILE']='HISTORICO';
      if(!limpiar(r['MODO_INGRESO_BIOFILE']))r['MODO_INGRESO_BIOFILE']=confirmadoManual?'MANUAL_HISTORICO':'HISTORICO';
      r['_HISTORICO_BIOFILE']=true;
      r['_FUENTE_HISTORICO']='LEGACY_APPS_SCRIPT';
      r['_FILA_SHEETS']=0;
      historicos.push(r);
    }
    return historicos;
  }catch(error){
    console.warn('No se pudo recuperar el histórico anterior:',error);
    return[];
  }
}
`;

  const cargaNueva = `async function cargarRegistros(sil=false){
  if(!sil)$('lista').innerHTML='<div class="nota" style="padding:20px;text-align:center">Cargando registros…</div>';
  try{
    const q=$('inputBusqueda').value.trim();
    const{data}=await api('/api/registros/listar?busqueda='+encodeURIComponent(q));
    const actuales=Array.isArray(data.registros)?data.registros:[];
    const historicos=await cargarIngresadosLegacy(q,actuales);
    registros=[...actuales,...historicos];
    for(const r of registros){
      const rk=claveRegistro(r),d=doc(r);
      if(['COMPLETADO','HISTORICO'].includes(estado(r))){if(trabajos[rk])delete trabajos[rk];if(trabajos[d])delete trabajos[d]}
    }
    guardarJobs();pintar();
  }catch(err){
    $('lista').innerHTML='<div class="nota" style="padding:20px;text-align:center">'+esc(err.message)+'</div>';
  }
}\n`;

  html = html.slice(0, inicioCarga) + helpers + cargaNueva + html.slice(finCarga);
  fs.writeFileSync(appPath, html, 'utf8');
}

if (!html.includes('cargarIngresadosLegacy(') || !html.includes("r['ESTADO_BIOFILE']='HISTORICO'")) {
  throw new Error('La recuperación histórica v7.6 no quedó instalada.');
}

console.log('[Netlify] Recuperación de ingresados históricos desde la fuente anterior habilitada v7.6.');
