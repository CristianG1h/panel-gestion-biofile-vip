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

  fs.writeFileSync(appPath, html, 'utf8');
}

console.log('[Netlify] Fecha operativa v6.3: Ingresados muestra hora real BIOFILE.');
