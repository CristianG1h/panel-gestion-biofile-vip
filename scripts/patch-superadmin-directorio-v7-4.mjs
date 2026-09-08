import fs from 'node:fs';

const path = new URL('../superadmin.html', import.meta.url);
let html = fs.readFileSync(path, 'utf8');
const MARCA = '/* SUPERADMIN_DIRECTORIO_EMPRESAS_V74 */';

if (html.includes(MARCA)) {
  console.log('[Superadmin] Directorio empresas v7.4 ya instalado.');
  process.exit(0);
}
if (!html.includes('/* SUPERADMIN_LAB_CATALOGO_V71 */')) {
  throw new Error('Primero debe ejecutarse patch-superadmin-lab-catalogo-v7-1.mjs.');
}

const css = `\n${MARCA}\n.dirGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:12px 0}\n.dirKpi{border:1px solid var(--borde);border-radius:11px;padding:12px;background:var(--panel2)}\n.dirKpi b{display:block;font-size:21px;color:var(--azul2);margin-bottom:4px}.dirKpi .muted{font-size:11px}\n.dirEstado{padding:10px 12px;border:1px solid var(--borde);border-radius:9px;background:var(--panel2);font-size:12px;line-height:1.5}\n.dirEstado.ok{border-color:var(--verde)}.dirEstado.err{border-color:var(--rojo)}.dirEstado.warn{border-color:var(--amarillo)}\n.dirRecientes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:10px}\n.dirEmpresa{padding:9px 10px;border:1px solid var(--borde);border-radius:8px;background:var(--panel2);font-size:11px;line-height:1.35;word-break:break-word}\n@media(max-width:820px){.dirGrid{grid-template-columns:1fr 1fr}.dirRecientes{grid-template-columns:1fr}}@media(max-width:520px){.dirGrid{grid-template-columns:1fr}}\n`;
html = html.replace('</style>', css + '</style>');

const cardAnchor = '  <section class="card" id="labCatalogoBiofile">';
const card = `  <section class="card" id="directorioEmpresasBiofile">\n    <div class="sectionTitle">\n      <div>\n        <h3 style="margin:0">🏢 Directorio de empresas BIOFILE</h3>\n        <div class="muted">Se sincroniza desde Informes → Clientes de BIOFILE. La primera revisión carga el histórico y luego busca novedades diariamente.</div>\n      </div>\n      <button class="btn azul sm" id="btnActualizarDirectorio">↻ Actualizar ahora</button>\n    </div>\n    <div class="dirGrid">\n      <div class="dirKpi"><b id="dirTotal">—</b><div class="muted">Empresas guardadas internamente</div></div>\n      <div class="dirKpi"><b id="dirNuevas">—</b><div class="muted">Nuevas en la última sincronización</div></div>\n      <div class="dirKpi"><b id="dirUltima">—</b><div class="muted">Última actualización correcta</div></div>\n      <div class="dirKpi"><b id="dirProxima">—</b><div class="muted">Próxima revisión automática</div></div>\n    </div>\n    <div class="dirEstado" id="dirEstado">Consultando estado del directorio…</div>\n    <div id="dirRecientes"></div>\n  </section>\n\n`;
if (!html.includes(cardAnchor)) throw new Error('No se encontró el laboratorio de paquetes para insertar el directorio.');
html = html.replace(cardAnchor, card + cardAnchor);

const jsAnchor = 'function labEmpresaValor(){';
const js = `let timerDirectorioV74=null;\nfunction fmtDirectorioV74(iso){return iso?fmtCO(iso):'Pendiente'}\nfunction estadoClaseDirectorioV74(d){if(d.sincronizando)return'warn';if(String(d.estado||'').toUpperCase()==='ERROR')return'err';if(String(d.estado||'').toUpperCase()==='OK')return'ok';return''}\nfunction pintarDirectorioV74(d){\n  d=d||{};\n  $('dirTotal').textContent=Number(d.totalEmpresas||0).toLocaleString('es-CO');\n  $('dirNuevas').textContent=Number(d.nuevasUltima||0).toLocaleString('es-CO');\n  $('dirUltima').textContent=d.ultimoExitoIso?fmtDirectorioV74(d.ultimoExitoIso):'Pendiente';\n  $('dirProxima').textContent=d.proximaRevisionIso?fmtDirectorioV74(d.proximaRevisionIso):'Pendiente';\n  const estado=$('dirEstado');estado.className='dirEstado '+estadoClaseDirectorioV74(d);\n  if(d.sincronizando)estado.textContent='⏳ BIOFILE está revisando el listado de empresas. Puede seguir usando el panel mientras termina.';\n  else if(String(d.estado||'').toUpperCase()==='ERROR')estado.textContent='⚠ Última actualización con error: '+(d.error||'sin detalle');\n  else if(d.ultimoExitoIso)estado.textContent='✓ Directorio actualizado. Último rango revisado: '+(d.fechaDesde||'—')+' a '+(d.fechaHasta||'—')+'.';\n  else estado.textContent='El directorio todavía no tiene una sincronización completa. Render la iniciará automáticamente.';\n  const recientes=Array.isArray(d.recientes)?d.recientes:[];\n  $('dirRecientes').innerHTML=recientes.length?'<div class="muted" style="margin-top:11px"><b>Empresas detectadas recientemente</b></div><div class="dirRecientes">'+recientes.slice(0,8).map(x=>'<div class="dirEmpresa"><b>'+esc(x.acuerdo||'—')+'</b>'+(x.cliente&&x.cliente!==x.acuerdo?'<div class="muted">Cliente: '+esc(x.cliente)+'</div>':'')+'</div>').join('')+'</div>':'';\n  $('btnActualizarDirectorio').disabled=!!d.sincronizando;\n}\nasync function cargarDirectorioEmpresasV74(){\n  try{const r=await api('/api/superadmin/directorio/estado');pintarDirectorioV74(r.directorio||{});return r.directorio||{}}\n  catch(e){$('dirEstado').className='dirEstado err';$('dirEstado').textContent=e.message;throw e}\n}\nasync function esperarDirectorioV74(){\n  clearInterval(timerDirectorioV74);let intentos=0;\n  timerDirectorioV74=setInterval(async()=>{\n    intentos++;try{const d=await cargarDirectorioEmpresasV74();if(!d.sincronizando||intentos>=80){clearInterval(timerDirectorioV74);timerDirectorioV74=null}}catch(_){clearInterval(timerDirectorioV74);timerDirectorioV74=null}\n  },3000);\n}\n$('btnActualizarDirectorio').onclick=async()=>{\n  const b=$('btnActualizarDirectorio');b.disabled=true;\n  try{await api('/api/superadmin/directorio/sincronizar',{method:'POST',body:JSON.stringify({completo:false})});toast('Actualización de empresas iniciada.','ok');await cargarDirectorioEmpresasV74();esperarDirectorioV74()}\n  catch(e){toast(e.message,'err');b.disabled=false}\n};\n\n`;
if (!html.includes(jsAnchor)) throw new Error('No se encontró el ancla JavaScript del laboratorio.');
html = html.replace(jsAnchor, js + jsAnchor);

const cargarViejo = "async function cargarTodo(){try{await Promise.all([cargarUsuarios(),cargarAuditoria(),cargarDash('hoy')])}catch(err){toast(err.message,'err')}}";
const cargarNuevo = "async function cargarTodo(){try{await Promise.all([cargarUsuarios(),cargarAuditoria(),cargarDash('hoy'),cargarDirectorioEmpresasV74()])}catch(err){toast(err.message,'err')}}";
if (!html.includes(cargarViejo)) throw new Error('No se encontró cargarTodo().');
html = html.replace(cargarViejo, cargarNuevo);

if (!html.includes('SUPERADMIN_DIRECTORIO_EMPRESAS_V74') ||
    !html.includes('/api/superadmin/directorio/estado') ||
    !html.includes('/api/superadmin/directorio/sincronizar') ||
    !html.includes('Empresas guardadas internamente')) {
  throw new Error('Superadmin directorio v7.4 quedó incompleto.');
}

fs.writeFileSync(path, html, 'utf8');
console.log('[Superadmin] v7.4: total de empresas, estado diario y actualización manual habilitados.');
