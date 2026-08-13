import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (!html.includes('/* FECHA_OPERATIVA_PANEL_V63 */')) {
  const marcador = 'function pintar(){';
  if (!html.includes(marcador)) throw new Error('No se encontró pintar() en app-v3.html.');

  const helper = `/* FECHA_OPERATIVA_PANEL_V63 */
function fechaOperativaTarjeta(r){
  const c=categoria(r);
  if(c==='ingresado'){
    const v=limpiar(r?.['FECHA_BIOFILE_ISO']||r?.['FECHA_BIOFILE']||r?.['Fecha de registro']);
    return 'Ingresado: '+fmtFechaHoraColombia(v);
  }
  if(c==='eliminado'){
    const v=limpiar(r?.['FECHA_ELIMINADO_ISO']||r?.['Fecha de registro']);
    return 'Eliminado: '+fmtFechaHoraColombia(v);
  }
  return 'Registrado: '+fmtFechaHoraColombia(r?.['Fecha de registro']);
}
`;
  html = html.replace(marcador, helper + marcador);

  const fechaAnterior = "${esc(fmtFechaHoraColombia(r['Fecha de registro']))}";
  const fechaNueva = "${esc(fechaOperativaTarjeta(r))}";
  if (!html.includes(fechaAnterior)) throw new Error('No se encontró la fecha visible de las tarjetas.');
  html = html.replace(fechaAnterior, fechaNueva);
}

if (!html.includes('/* ACTUALIZAR_PACIENTES_V64 */')) {
  html = html.replace('</style>', `
/* ACTUALIZAR_PACIENTES_V64 */
.btnActualizarPacientes{white-space:nowrap}
@media(max-width:700px){.btnActualizarPacientes{width:100%}}
</style>`);

  const cssFiltros = '.filtros{display:grid;grid-template-columns:1fr auto auto;gap:9px;margin-top:10px;align-items:end}';
  if (!html.includes(cssFiltros)) throw new Error('No se encontró la grilla de filtros.');
  html = html.replace(cssFiltros, '.filtros{display:grid;grid-template-columns:1fr auto auto auto;gap:9px;margin-top:10px;align-items:end}');

  const botones = '<button class="btn gris" id="btnHoy">Hoy</button><button class="btn gris" id="btnLimpiar">Limpiar filtros</button>';
  if (!html.includes(botones)) throw new Error('No se encontraron los botones de filtros.');
  html = html.replace(botones, '<button class="btn gris" id="btnHoy">Hoy</button><button class="btn azul btnActualizarPacientes" id="btnActualizarPacientes">🔄 Actualizar pacientes</button><button class="btn gris" id="btnLimpiar">Limpiar filtros</button>');

  const visibles = 'function visiblesPend(){';
  if (!html.includes(visibles)) throw new Error('No se encontró visiblesPend().');
  const actualizar = `$('btnActualizarPacientes').onclick=async()=>{const b=$('btnActualizarPacientes'),txt=b.textContent;b.disabled=true;b.textContent='⏳ Actualizando…';try{await cargarRegistros(false);toast('Lista de pacientes actualizada.','ok')}catch(e){toast(e.message,'err')}finally{b.disabled=false;b.textContent=txt}};\n`;
  html = html.replace(visibles, actualizar + visibles);
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Netlify] Fecha operativa v6.3 y actualización manual v6.4 habilitadas.');
