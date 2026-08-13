import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

function reemplazarUna(texto, buscar, reemplazo, etiqueta) {
  if (!texto.includes(buscar)) throw new Error(`No se encontró ${etiqueta}.`);
  return texto.replace(buscar, reemplazo);
}

if (!html.includes('/* PANEL_SEGURIDAD_V61 */')) {
  html = html.replace(
    'const CLAVE_CONSULTA="vip2026";',
    '/* PANEL_SEGURIDAD_V61 */\nconst CLAVE_CONSULTA=""; // legado deshabilitado: el listado usa la API autenticada de Render.'
  );

  html = reemplazarUna(
    html,
    'const doc=r=>limpiar(r&&r["N° documento"]);const estado=r=>limpiar(r&&r["ESTADO_BIOFILE"]).toUpperCase();',
    'const doc=r=>limpiar(r&&r["N° documento"]);const filaDe=r=>Number(r?._FILA_SHEETS||r?.FILA_SHEETS||r?.fila||0);const claveRegistro=r=>`${filaDe(r)||0}:${doc(r)}`;const estado=r=>limpiar(r&&r["ESTADO_BIOFILE"]).toUpperCase();',
    'los helpers de fila y clave exacta'
  );

  html = reemplazarUna(
    html,
    "function jobDe(r){return trabajos[doc(r)]||null}",
    "function jobDe(r){return trabajos[claveRegistro(r)]||trabajos[doc(r)]||null}",
    'la asociación de trabajos por fila'
  );

  const inicioCarga = html.indexOf('async function cargarRegistros(');
  const finCarga = html.indexOf('function filtrados(){', inicioCarga);
  if (inicioCarga < 0 || finCarga < 0) throw new Error('No se encontró cargarRegistros().');
  const cargaNueva = `async function cargarRegistros(sil=false){if(!sil)$('lista').innerHTML='<div class="nota" style="padding:20px;text-align:center">Cargando registros…</div>';try{const q=$('inputBusqueda').value.trim();const{data}=await api('/api/registros/listar?busqueda='+encodeURIComponent(q));registros=Array.isArray(data.registros)?data.registros:[];for(const r of registros){const rk=claveRegistro(r),d=doc(r);if(estado(r)==='COMPLETADO'){if(trabajos[rk])delete trabajos[rk];if(trabajos[d])delete trabajos[d]}}guardarJobs();pintar()}catch(err){$('lista').innerHTML='<div class="nota" style="padding:20px;text-align:center">'+esc(err.message)+'</div>'}}\n`;
  html = html.slice(0, inicioCarga) + cargaNueva + html.slice(finCarga);

  // Cada tarjeta/selección se identifica por fila + documento, no solo por cédula.
  html = html.replace(
    "arr.forEach(r=>{const d=doc(r),v=visual(r),div=document.createElement('div');",
    "arr.forEach(r=>{const d=doc(r),rk=claveRegistro(r),v=visual(r),div=document.createElement('div');"
  );
  html = html.replace("${seleccion.has(d)?'checked':''}", "${seleccion.has(rk)?'checked':''}");
  html = html.replace(
    "e.target.checked?seleccion.add(d):seleccion.delete(d);actualizarMasivo()",
    "e.target.checked?seleccion.add(rk):seleccion.delete(rk);actualizarMasivo()"
  );
  html = html.replace(
    "function visiblesPend(){return filtrados().filter(r=>categoria(r)==='pendiente')}function actualizarMasivo(){const vs=visiblesPend().map(doc),sel=vs.filter(d=>seleccion.has(d));",
    "function visiblesPend(){return filtrados().filter(r=>categoria(r)==='pendiente')}function actualizarMasivo(){const vs=visiblesPend().map(claveRegistro),sel=vs.filter(k=>seleccion.has(k));"
  );
  html = html.replace(
    "visiblesPend().forEach(r=>this.checked?seleccion.add(doc(r)):seleccion.delete(doc(r)));",
    "visiblesPend().forEach(r=>this.checked?seleccion.add(claveRegistro(r)):seleccion.delete(claveRegistro(r)));"
  );
  html = html.replace(
    "for(const d of ds){const r=registros.find(x=>doc(x)===d);",
    "for(const rk of ds){const r=registros.find(x=>claveRegistro(x)===rk);"
  );

  const inicioEnviar = html.indexOf('async function enviarRegistro(');
  const finEnviar = html.indexOf("$('btnMasivo').onclick=", inicioEnviar);
  if (inicioEnviar < 0 || finEnviar < 0) throw new Error('No se encontró enviarRegistro().');
  const enviarNuevo = `async function enviarRegistro(r,imgs=true,sil=false){const d=doc(r),rk=claveRegistro(r);const{data,status}=await api('/api/biofile/enviar',{method:'POST',body:JSON.stringify({documento:d,fila:filaDe(r),subirImagenes:!!imgs})});if(data.job?.id&&data.job?.usuario?.id===usuarioActual.id){trabajos[rk]={...data.job,jobId:data.job.id};if(trabajos[d])delete trabajos[d];guardarJobs()}if(!sil)toast(data.mensaje||'Solicitud enviada.',status===409?'':'ok');pintar();iniciarPoll();return data}\n`;
  html = html.slice(0, inicioEnviar) + enviarNuevo + html.slice(finEnviar);

  const inicioGuardar = html.indexOf('async function guardarCampo(');
  const finGuardar = html.indexOf('async function editarCampo(', inicioGuardar);
  if (inicioGuardar < 0 || finGuardar < 0) throw new Error('No se encontró guardarCampo().');
  const guardarNuevo = `async function guardarCampo(r,campo,valor,sil=false){const documentoAntes=doc(r),claveAntes=claveRegistro(r);const{data}=await api('/api/registros/actualizar',{method:'PATCH',body:JSON.stringify({documento:documentoAntes,fila:filaDe(r),campo,valor})});r[campo]=data.valor;const claveDespues=claveRegistro(r);if(claveAntes!==claveDespues&&trabajos[claveAntes]){trabajos[claveDespues]=trabajos[claveAntes];delete trabajos[claveAntes]}if(trabajos[documentoAntes]&&claveDespues!==documentoAntes){trabajos[claveDespues]=trabajos[documentoAntes];delete trabajos[documentoAntes]}guardarJobs();if(!sil)toast(\`${campo} actualizado en Google Sheets.\`,'ok');return data}\n`;
  html = html.slice(0, inicioGuardar) + guardarNuevo + html.slice(finGuardar);

  // Ingreso manual y Eliminados respetan también la fila exacta.
  html = html.replace(
    "body:JSON.stringify({documento:doc(actual),usuarioResponsable:responsable})",
    "body:JSON.stringify({documento:doc(actual),fila:filaDe(actual),usuarioResponsable:responsable})"
  );
  html = html.replace(
    "body:JSON.stringify({documento:doc(actual)})",
    "body:JSON.stringify({documento:doc(actual),fila:filaDe(actual)})"
  );
  html = html.replace(
    "body:JSON.stringify({documento:d,motivo:motivo.trim()})",
    "body:JSON.stringify({documento:d,fila:filaDe(r),motivo:motivo.trim()})"
  );
  html = html.replace(
    "delete trabajos[d];guardarJobs();toast('Registro enviado a Eliminados.'",
    "delete trabajos[claveRegistro(r)];delete trabajos[d];guardarJobs();toast('Registro enviado a Eliminados.'"
  );

  fs.writeFileSync(appPath, html, 'utf8');
}

console.log('[Netlify] Seguridad v6.1: listado autenticado, fila exacta y claves únicas por visita habilitados.');
