import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (!html.includes('/* HISTORICO_INGRESADOS_PANEL_V75 */')) {
  html = html.replace('</style>', `
/* HISTORICO_INGRESADOS_PANEL_V75 */
.badge.historico{background:var(--amarilloClaro);color:var(--texto);border:1px solid var(--amarillo)}
html[data-theme="dark"] .badge.historico{background:#382F12;color:#FFF0B0;border-color:#6A5A20}
</style>`);

  const categoriaAnterior = "if(e==='COMPLETADO'||j?.estado==='completado')return'ingresado';";
  const categoriaNueva = "if(['COMPLETADO','HISTORICO'].includes(e)||j?.estado==='completado')return'ingresado';";
  if (!html.includes(categoriaAnterior) && !html.includes(categoriaNueva)) {
    throw new Error('No se encontró la clasificación de registros completados.');
  }
  html = html.replace(categoriaAnterior, categoriaNueva);

  const visualAnterior = "  if(j?.estado==='completado'||e==='COMPLETADO')return{p:100,t:'Completado en BIOFILE',d:j?.detalle||(os?('Proceso finalizado correctamente. La orden quedó registrada con N°. O.S. '+os+'.'):'Proceso finalizado correctamente en BIOFILE.'),c:'ok',os};";
  const visualHistorico = "  if(e==='HISTORICO')return{p:100,t:'Ingresado histórico',d:'Registro anterior a la activación del control automático. Se conserva en el histórico y no se volverá a enviar a BIOFILE.',c:'ok',os};\n" + visualAnterior;
  if (!html.includes("if(e==='HISTORICO')return{p:100,t:'Ingresado histórico'")) {
    if (!html.includes(visualAnterior)) throw new Error('No se encontró el estado visual de completados.');
    html = html.replace(visualAnterior, visualHistorico);
  }

  const badgeAnterior = "  let salida='<span class=\"badge ok\">✓ Ingresado</span>';";
  const badgeNuevo = "  if(estado(r)==='HISTORICO')return '<span class=\"badge ok\">✓ Ingresado histórico</span><span class=\"badge historico\">🗂️ Anterior al control automático</span>';\n  let salida='<span class=\"badge ok\">✓ Ingresado</span>';";
  if (!html.includes("Anterior al control automático</span>")) {
    if (!html.includes(badgeAnterior)) throw new Error('No se encontró badgesIngreso().');
    html = html.replace(badgeAnterior, badgeNuevo);
  }

  const fechaAnterior = "function fechaOperativaTarjeta(r){\n  const c=categoria(r);\n  if(c==='ingresado'){";
  const fechaNueva = "function fechaOperativaTarjeta(r){\n  const c=categoria(r);\n  if(estado(r)==='HISTORICO')return 'Histórico: '+fmtFechaHoraColombia(r?.['Fecha de registro']);\n  if(c==='ingresado'){";
  if (!html.includes("if(estado(r)==='HISTORICO')return 'Histórico: '")) {
    if (!html.includes(fechaAnterior)) throw new Error('No se encontró fechaOperativaTarjeta().');
    html = html.replace(fechaAnterior, fechaNueva);
  }

  fs.writeFileSync(appPath, html, 'utf8');
}

if (!html.includes("['COMPLETADO','HISTORICO'].includes(e)")) {
  throw new Error('HISTORICO no quedó clasificado dentro de Ingresados.');
}

console.log('[Netlify] Históricos anteriores al control automático restaurados dentro de Ingresados.');
