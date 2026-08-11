import fs from 'node:fs';

const archivo = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(archivo, 'utf8');

if (!html.includes('/* VIP_PROGRESS_DETAIL_V1 */')) {
  const css = `
/* VIP_PROGRESS_DETAIL_V1 */
.progresoCabecera{display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:850}.progresoPorcentaje{font-size:13px;padding:3px 8px;border-radius:99px;background:var(--panel);border:1px solid var(--borde);white-space:nowrap}.progresoDetalle{font-size:12px;line-height:1.45;color:var(--muted);margin-top:7px}.ordenBox{display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:6px 9px;border-radius:8px;background:var(--verdeClaro);border:1px solid color-mix(in srgb,var(--verde) 35%,var(--borde));color:var(--texto);font-size:12px}.etapaMini{font-size:11px;line-height:1.4;color:var(--muted);margin-top:6px}.ordenMini{display:inline-block;margin-top:5px;padding:3px 7px;border-radius:7px;background:var(--verdeClaro);color:var(--texto);font-size:11px;font-weight:800}
html[data-theme="dark"] .progresoPorcentaje{background:#0C1824;border-color:#365064;color:#DFF1FF}html[data-theme="dark"] .ordenBox,html[data-theme="dark"] .ordenMini{background:#103626;border-color:#286B48;color:#DDF8E8}
`;
  html = html.replace('</style>', `${css}</style>`);

  const inicioVisual = html.indexOf('function visual(r){');
  const finVisual = html.indexOf('function coincideFecha(r){', inicioVisual);
  if (inicioVisual < 0 || finVisual < 0) throw new Error('No se encontró visual() en app-v3.html.');

  const visualNuevo = `function numeroOrdenDe(r,j){return limpiar(j?.numeroOrden||j?.resultado?.numeroOrden||j?.error?.numeroOrden||r?.['NUMERO_OS_BIOFILE'])}
function visual(r){
  const e=estado(r),j=jobDe(r),os=numeroOrdenDe(r,j);
  if(j?.estado==='en_cola')return{p:Math.max(1,Number(j.progreso||5)),t:j.etapa||'En cola',d:j.detalle||('Esperando turno en la cola personal de '+usuarioActual.nombre+'.'),c:'',os};
  if(j?.estado==='procesando')return{p:Math.max(1,Math.min(99,Number(j.progreso||10))),t:j.etapa||'Procesando en BIOFILE',d:j.detalle||'El robot está ejecutando el ingreso con su usuario BIOFILE.',c:'',os};
  if(j?.estado==='completado'||e==='COMPLETADO')return{p:100,t:'Completado en BIOFILE',d:j?.detalle||(os?('Proceso finalizado correctamente. La orden quedó registrada con N°. O.S. '+os+'.'):'Proceso finalizado correctamente en BIOFILE.'),c:'ok',os};
  if(j?.estado==='error'||['ERROR','PARCIAL'].includes(e))return{p:100,t:'Proceso terminado con error',d:j?.detalle||j?.error?.mensaje||r?.['ERROR_BIOFILE']||'BIOFILE devolvió un error durante el proceso.',c:'err',os};
  if(e==='ORDEN_CREADA')return{p:86,t:'Orden creada en BIOFILE',d:os?('BIOFILE ya asignó la N°. O.S. '+os+'. Se están finalizando los archivos y el cierre de la orden.'):'La orden fue creada. Se está consultando el número de orden y finalizando el proceso.',c:'',os};
  if(e==='PROCESANDO')return{p:72,t:'Validando y guardando información',d:'Los datos principales ya fueron diligenciados y BIOFILE está validando el formulario antes de crear la orden.',c:'',os};
  return{p:0,t:'Pendiente',d:'El paciente todavía no ha sido enviado a la cola de BIOFILE.',c:'',os};
}
`;
  html = html.slice(0, inicioVisual) + visualNuevo + html.slice(finVisual);

  const miniBuscar = '<div class="estadoTop"><span>${esc(v.t)}</span><span>${v.p}%</span></div><div class="barra">';
  const miniReemplazo = '<div class="estadoTop"><span>${esc(v.t)}</span><span>${v.p}%</span></div>${v.d?`<div class="etapaMini">${esc(v.d)}</div>`:""}${v.os?`<div class="ordenMini">N°. O.S.: ${esc(v.os)}</div>`:""}<div class="barra">';
  if (html.includes(miniBuscar)) html = html.replace(miniBuscar, miniReemplazo);

  const inicioFicha = html.indexOf('function actualizarFicha(){');
  const finFicha = html.indexOf("$('btnEnviarUno').onclick=", inicioFicha);
  if (inicioFicha < 0 || finFicha < 0) throw new Error('No se encontró actualizarFicha() en app-v3.html.');

  const fichaNueva = `function actualizarFicha(){
  if(!actual)return;
  const v=visual(actual),box=$('estadoFicha');
  if(v.p||v.c){
    box.classList.remove('oculto');
    box.className='progreso '+(v.c||'');
    const detalle=v.d?('<div class="progresoDetalle">'+esc(v.d)+'</div>'):'';
    const orden=v.os?('<div class="ordenBox">📄 <span>N°. O.S.: <b>'+esc(v.os)+'</b></span></div>'):'';
    const error=v.c==='err'?('<div class="progresoDetalle" style="color:var(--rojo)"><b>Motivo:</b> '+esc(jobDe(actual)?.error?.mensaje||actual['ERROR_BIOFILE']||v.d||'Error no especificado')+'</div>'):'';
    box.innerHTML='<div class="progresoCabecera"><span>'+esc(v.t)+'</span><span class="progresoPorcentaje">'+v.p+'%</span></div>'+detalle+orden+'<div class="barra" style="margin-top:9px"><div class="relleno '+(v.c||'')+'" style="width:'+v.p+'%"></div></div>'+error;
  }else box.classList.add('oculto');
  const terminado=v.c==='ok'||estado(actual)==='COMPLETADO'||jobDe(actual)?.estado==='completado';
  const activo=['en_cola','procesando'].includes(jobDe(actual)?.estado);
  $('btnEnviarUno').disabled=activo||terminado;
  $('btnEnviarUno').textContent=terminado?'✓ Proceso completado':activo?'⏳ Proceso activo':'🤖 Enviar este paciente';
}
`;
  html = html.slice(0, inicioFicha) + fichaNueva + html.slice(finFicha);

  fs.writeFileSync(archivo, html, 'utf8');
}

console.log('[Netlify] Detalle de progreso, porcentaje y N°. O.S. habilitados.');
