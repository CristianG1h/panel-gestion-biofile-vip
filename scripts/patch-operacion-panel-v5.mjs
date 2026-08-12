import fs from 'node:fs';

const appPath=new URL('../app-v3.html',import.meta.url);
const superPath=new URL('../superadmin.html',import.meta.url);

function reemplazarEntre(texto,inicio,fin,nuevo,etiqueta){const a=texto.indexOf(inicio),b=texto.indexOf(fin,a+inicio.length);if(a<0||b<0)throw new Error(`No se encontró ${etiqueta}.`);return texto.slice(0,a)+nuevo+texto.slice(b);}

let html=fs.readFileSync(appPath,'utf8');
if(!html.includes('/* ELIMINADOS_MANUAL_V5 */')){
  html=html.replace('</style>',`
/* ELIMINADOS_MANUAL_V5 */
.manualResponsable{margin:12px 0;padding:11px;border:1px solid var(--borde);border-radius:10px;background:var(--azulClaro)}.manualResponsable label{margin:0 0 6px}.btnEliminarFicha{width:100%;margin:10px 0 0;background:var(--rojo);color:#fff}.badge.elim{background:var(--rojoc,#FBEAE8);color:var(--rojo)}html[data-theme="dark"] .manualResponsable{background:#112D44}
</style>`);

  const tabIng='<button class="tab" data-tab="ingresado">✓ Ingresados <span class="num" id="nIng">0</span></button>';
  if(!html.includes(tabIng))throw new Error('No se encontró tab Ingresados.');
  html=html.replace(tabIng,`${tabIng}\n      <button class="tab" data-tab="eliminado">🗑️ Eliminados <span class="num" id="nElim">0</span></button>`);

  const fichaTabs='<div class="fichaTabs"><button class="tab activo" id="tabAuto">🤖 Enviar a BIOFILE</button><button class="tab" id="tabManual">📝 Ingreso manual</button></div>';
  if(!html.includes(fichaTabs))throw new Error('No se encontraron tabs de ficha.');
  html=html.replace(fichaTabs,`${fichaTabs}\n      <button class="btn btnEliminarFicha" id="btnEliminarRegistro">🗑️ Enviar a Eliminados</button>`);

  const manualBoton='<button class="btn azul" id="btnManualCompleto" style="width:100%;margin-top:10px">✓ Marcar como ingresado manualmente</button>';
  if(!html.includes(manualBoton))throw new Error('No se encontró botón manual.');
  html=html.replace(manualBoton,`<div class="manualResponsable oculto" id="manualResponsableBox"><label for="manualResponsable">Registrar el ingreso a nombre de</label><select class="input" id="manualResponsable"></select><div class="nota">Solo el Super Admin puede atribuir un ingreso manual a otro usuario. Las estadísticas se sumarán al usuario seleccionado.</div></div>\n        ${manualBoton}`);

  html=html.replace(
    "let usuarioActual=null,registros=[],actual=null,tab='pendiente',seleccion=new Set(),trabajos={},pollUltimo=0,paginaLista=1;",
    "let usuarioActual=null,registros=[],actual=null,tab='pendiente',seleccion=new Set(),trabajos={},pollUltimo=0,paginaLista=1,usuariosAsignables=[];"
  );

  const catInicio='function categoria(r){';
  const catFin=html.includes('function numeroOrdenDe(r,j)')?'function numeroOrdenDe(r,j)':'function visual(r){';
  html=reemplazarEntre(html,catInicio,catFin,`function categoria(r){const e=estado(r),j=jobDe(r);if(e==='ELIMINADO')return'eliminado';if(e==='COMPLETADO'||j?.estado==='completado')return'ingresado';if(['PROCESANDO','ORDEN_CREADA','ERROR','PARCIAL'].includes(e)||['en_cola','procesando','error'].includes(j?.estado))return'proceso';return'pendiente'}\n`, 'categoria');

  const visualMarcador="  const e=estado(r),j=jobDe(r),os=numeroOrdenDe(r,j);";
  if(html.includes(visualMarcador))html=html.replace(visualMarcador,`${visualMarcador}\n  if(e==='ELIMINADO')return{p:100,t:'Enviado a Eliminados',d:r?.['MOTIVO_ELIMINADO']?('Motivo: '+r['MOTIVO_ELIMINADO']):'Este registro fue retirado de la cola de ingreso a BIOFILE.',c:'',os:''};`);

  const contInicio='function contadores(){';
  const contFin='function pintar(){';
  html=reemplazarEntre(html,contInicio,contFin,`function contadores(){const c={pendiente:0,proceso:0,ingresado:0,eliminado:0};filtrados().forEach(r=>c[categoria(r)]++);$('nPend').textContent=c.pendiente;$('nProc').textContent=c.proceso;$('nIng').textContent=c.ingresado;$('nElim').textContent=c.eliminado}\n`, 'contadores');

  const accionesViejas="${tab==='pendiente'?'<button class=\"btn azul sm enviar\">Enviar</button>':''}${tab==='proceso'&&v.c==='err'?'<button class=\"btn gris sm manual\">Ingreso manual</button>':''}";
  const accionesNuevas="${tab==='pendiente'?'<button class=\"btn azul sm enviar\">Enviar</button>':''}${tab==='proceso'&&v.c==='err'?'<button class=\"btn gris sm manual\">Ingreso manual</button>':''}${['pendiente','proceso'].includes(tab)?'<button class=\"btn rojo sm eliminar\">Eliminar</button>':''}";
  if(!html.includes(accionesViejas))throw new Error('No se encontró bloque de acciones de tarjetas.');
  html=html.replace(accionesViejas,accionesNuevas);

  const handlerManual="div.querySelector('.manual')?.addEventListener('click',e=>{e.stopPropagation();abrirFicha(r,'manual')});";
  if(!html.includes(handlerManual))throw new Error('No se encontró handler manual.');
  html=html.replace(handlerManual,`${handlerManual}div.querySelector('.eliminar')?.addEventListener('click',e=>{e.stopPropagation();eliminarRegistro(r)});`);

  const abrirFicha='function abrirFicha(r,modo=\'auto\'){';
  const helperEliminar=`async function eliminarRegistro(r){if(!r)return;const d=doc(r),j=jobDe(r);if(['en_cola','procesando'].includes(j?.estado)){toast('Este paciente está en cola o procesándose. Espere a que termine.','err');return}const motivo=prompt('Motivo para enviar este registro a Eliminados:','No requiere ingreso a BIOFILE / registro no válido');if(motivo===null)return;if(!confirm('¿Enviar a '+nombre(r)+' a la sección Eliminados? El registro NO se borrará de Google Sheets.'))return;try{await api('/api/registros/eliminar',{method:'POST',body:JSON.stringify({documento:d,motivo:motivo.trim()})});r['ESTADO_BIOFILE']='ELIMINADO';r['MOTIVO_ELIMINADO']=motivo.trim();r['ELIMINADO_POR']=usuarioActual.nombre;delete trabajos[d];guardarJobs();toast('Registro enviado a Eliminados.','ok');await cargarRegistros(true);if(actual){actual=null;$('ficha').classList.add('oculto');$('panelBusqueda').classList.remove('oculto')}activarTab('eliminado')}catch(e){toast(e.message,'err')}}\n`;
  if(!html.includes(abrirFicha))throw new Error('No se encontró abrirFicha.');
  html=html.replace(abrirFicha,helperEliminar+abrirFicha);

  html=html.replace("$('btnVolver').onclick=()=>{", "$('btnEliminarRegistro').onclick=()=>eliminarRegistro(actual);$('btnVolver').onclick=()=>{");

  const mostrarInicio='async function mostrarManual(){';
  const mostrarFin="$('tabAuto').onclick=mostrarAuto;";
  const mostrarNuevo=`async function cargarUsuariosAsignables(){if(usuarioActual?.rol!=='superadmin')return[];if(usuariosAsignables.length)return usuariosAsignables;try{const{data}=await api('/api/superadmin/usuarios');const todos=[...(data.usuariosRender||[]),...(data.usuarios||[])].filter(u=>u.activo!==false);const map=new Map();todos.forEach(u=>map.set(String(u.usuario||u.nombre||'').trim().toUpperCase(),String(u.usuario||u.nombre||'').trim()));usuariosAsignables=[...map.values()].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));return usuariosAsignables}catch(e){toast('No se pudo cargar la lista de usuarios: '+e.message,'err');return[]}}\nasync function mostrarManual(){$('autoPanel').classList.add('oculto');$('manualPanel').classList.remove('oculto');$('tabAuto').classList.remove('activo');$('tabManual').classList.add('activo');const box=$('manualResponsableBox'),sel=$('manualResponsable');if(usuarioActual?.rol==='superadmin'){box.classList.remove('oculto');const lista=await cargarUsuariosAsignables();sel.innerHTML=lista.map(u=>'<option value="'+esc(u)+'">'+esc(u)+'</option>').join('');if(lista.some(u=>u===usuarioActual.nombre))sel.value=usuarioActual.nombre}else{box.classList.add('oculto');sel.innerHTML=''}if(actual&&!limpiar(actual['Estrato'])){actual['Estrato']='1';pintarDatos(actual);try{await guardarCampo(actual,'Estrato','1',true)}catch(e){toast('No se pudo guardar el estrato por defecto: '+e.message,'err')}}}\n`;
  html=reemplazarEntre(html,mostrarInicio,mostrarFin,mostrarNuevo,'mostrarManual');

  const manualInicio="$('btnManualCompleto').onclick=async()=>{";
  const manualFin='function fechasRango(m){';
  const manualNuevo=`$('btnManualCompleto').onclick=async()=>{if(!actual)return;const responsable=usuarioActual?.rol==='superadmin'?$('manualResponsable').value:usuarioActual.nombre;if(!responsable){toast('Seleccione el usuario responsable del ingreso.','err');return}if(!confirm('Confirme que ya terminó el ingreso manual en BIOFILE. Se registrará a nombre de '+responsable+'.'))return;const b=$('btnManualCompleto');b.disabled=true;try{const{data}=await api('/api/registros/marcar-manual',{method:'POST',body:JSON.stringify({documento:doc(actual),usuarioResponsable:responsable})});actual['ESTADO_BIOFILE']='COMPLETADO';actual['USUARIO_BIOFILE']=data.atribuidoA||responsable;actual['MODO_INGRESO_BIOFILE']='MANUAL';toast('Ingreso manual guardado a nombre de '+(data.atribuidoA||responsable)+'.','ok');await cargarRegistros(true);$('btnVolver').click();activarTab('ingresado')}catch(e){toast(e.message,'err')}finally{b.disabled=false}}\n`;
  html=reemplazarEntre(html,manualInicio,manualFin,manualNuevo,'marcar manual');

  fs.writeFileSync(appPath,html,'utf8');
}

let superHtml=fs.readFileSync(superPath,'utf8');
if(!superHtml.includes('/* PERFIL_ELIMINADOS_V5 */')){
  superHtml=superHtml.replace('</style>',`/* PERFIL_ELIMINADOS_V5 */\n</style>`);
  superHtml=superHtml.replace("function fechaActividad(r){return r?.['FECHA_BIOFILE_ISO']||r?.['FECHA_BIOFILE']||r?.['Fecha de registro']||''}","function fechaActividad(r){return r?.['FECHA_ELIMINADO_ISO']||r?.['FECHA_BIOFILE_ISO']||r?.['FECHA_BIOFILE']||r?.['Fecha de registro']||''}");
  superHtml=superHtml.replace(
    "const comp=datosPerfil.filter(r=>norm(r['ESTADO_BIOFILE'])==='COMPLETADO').length,err=datosPerfil.filter(r=>['ERROR','PARCIAL'].includes(norm(r['ESTADO_BIOFILE']))).length,aut=datosPerfil.filter(r=>norm(r['MODO_INGRESO_BIOFILE'])==='AUTOMATICO').length,man=datosPerfil.filter(r=>norm(r['MODO_INGRESO_BIOFILE'])==='MANUAL').length;",
    "const comp=datosPerfil.filter(r=>norm(r['ESTADO_BIOFILE'])==='COMPLETADO').length,err=datosPerfil.filter(r=>['ERROR','PARCIAL'].includes(norm(r['ESTADO_BIOFILE']))).length,aut=datosPerfil.filter(r=>norm(r['MODO_INGRESO_BIOFILE'])==='AUTOMATICO').length,man=datosPerfil.filter(r=>norm(r['MODO_INGRESO_BIOFILE'])==='MANUAL').length,elim=datosPerfil.filter(r=>norm(r['ESTADO_BIOFILE'])==='ELIMINADO').length;"
  );
  superHtml=superHtml.replace(
    "<div class=\"kpi\"><b>${err}</b><div class=\"muted\">Errores / parciales</div></div>`;",
    "<div class=\"kpi\"><b>${err}</b><div class=\"muted\">Errores / parciales</div></div><div class=\"kpi\"><b>${elim}</b><div class=\"muted\">Eliminados</div></div>`;"
  );
  superHtml=superHtml.replace(
    "datosPerfil=todos.filter(r=>norm(r['USUARIO_BIOFILE'])===norm(perfilUsuario.usuario)).sort",
    "datosPerfil=todos.filter(r=>norm(r['USUARIO_BIOFILE'])===norm(perfilUsuario.usuario)||norm(r['ELIMINADO_POR'])===norm(perfilUsuario.usuario)).sort"
  );
  superHtml=superHtml.replace(
    "${error?`<div class=\"actividadDetalle\">${esc(error)}</div>`:''}</td></tr>",
    "${error?`<div class=\"actividadDetalle\">${esc(error)}</div>`:''}${norm(estado)==='ELIMINADO'&&r['MOTIVO_ELIMINADO']?`<div class=\"actividadDetalle\">Motivo: ${esc(r['MOTIVO_ELIMINADO'])}</div>`:''}</td></tr>"
  );
  fs.writeFileSync(superPath,superHtml,'utf8');
}

console.log('[Netlify] Eliminados y atribución manual v5 habilitados.');
