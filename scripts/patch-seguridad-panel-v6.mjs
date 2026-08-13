import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

function reemplazarEntre(texto, inicio, fin, nuevo, etiqueta) {
  const a = texto.indexOf(inicio);
  const b = texto.indexOf(fin, a + inicio.length);
  if (a < 0 || b < 0) throw new Error(`No se encontró ${etiqueta}.`);
  return texto.slice(0, a) + nuevo + texto.slice(b);
}

if (!html.includes('/* PANEL_SEGURIDAD_V6 */')) {
  html = html.replace('</style>', `
/* PANEL_SEGURIDAD_V6 */
.avisoRevisionBiofile{background:#FFF1D6;border:1px solid #E6A700;color:#6A4700;padding:10px 12px;border-radius:9px;font-size:12px;font-weight:750;margin-top:8px}
html[data-theme="dark"] .avisoRevisionBiofile{background:#3B2D10;border-color:#8D6B17;color:#FFE5A1}
</style>`);

  const finCategoria = html.includes('function numeroOrdenDe(r,j)') ? 'function numeroOrdenDe(r,j)' : 'function visual(r){';
  html = reemplazarEntre(
    html,
    'function categoria(r){',
    finCategoria,
    `function categoria(r){const e=estado(r),j=jobDe(r);if(e==='ELIMINADO')return'eliminado';if(e==='COMPLETADO'||j?.estado==='completado')return'ingresado';if(['PROCESANDO','GUARDANDO','ORDEN_CREADA','ERROR','PARCIAL','REVISAR_BIOFILE'].includes(e)||['en_cola','procesando','error'].includes(j?.estado))return'proceso';return'pendiente'}\n`,
    'categoria()'
  );

  const visualMarca = "  const e=estado(r),j=jobDe(r),os=numeroOrdenDe(r,j);";
  if (!html.includes(visualMarca)) throw new Error('No se encontró visual() con detalle de progreso.');
  html = html.replace(
    visualMarca,
    `${visualMarca}\n  if(e==='REVISAR_BIOFILE')return{p:100,t:'Revisión obligatoria en BIOFILE',d:'El robot alcanzó la etapa de Guardar y el resultado final no es seguro. NO reenvíe este paciente automáticamente; verifique primero en BIOFILE si la persona u orden ya fue creada.',c:'err',os};\n  if(e==='GUARDANDO')return{p:80,t:'Guardado enviado a BIOFILE',d:'BIOFILE está procesando el guardado. Este registro queda bloqueado contra reenvíos para evitar duplicados.',c:'',os};`
  );

  const bloqueBoton = `  const terminado=v.c==='ok'||estado(actual)==='COMPLETADO'||jobDe(actual)?.estado==='completado';\n  const activo=['en_cola','procesando'].includes(jobDe(actual)?.estado);\n  $('btnEnviarUno').disabled=activo||terminado;\n  $('btnEnviarUno').textContent=terminado?'✓ Proceso completado':activo?'⏳ Proceso activo':'🤖 Enviar este paciente';`;
  if (!html.includes(bloqueBoton)) throw new Error('No se encontró el control de reenvío individual.');
  html = html.replace(
    bloqueBoton,
    `  const terminado=v.c==='ok'||estado(actual)==='COMPLETADO'||jobDe(actual)?.estado==='completado';\n  const activo=['en_cola','procesando'].includes(jobDe(actual)?.estado);\n  const eActual=estado(actual);\n  const guardarIntentado=limpiar(actual?.['GUARDADO_INTENTADO_BIOFILE']).toUpperCase();\n  const revision=['GUARDANDO','ORDEN_CREADA','PARCIAL','REVISAR_BIOFILE'].includes(eActual)||(eActual==='ERROR'&&guardarIntentado!=='NO');\n  $('btnEnviarUno').disabled=activo||terminado||revision;\n  $('btnEnviarUno').textContent=terminado?'✓ Proceso completado':activo?'⏳ Proceso activo':revision?'🔒 Verificar en BIOFILE antes de reenviar':'🤖 Enviar este paciente';\n  if(revision&&box&&!box.querySelector('.avisoRevisionBiofile')){box.insertAdjacentHTML('beforeend','<div class="avisoRevisionBiofile">⚠️ Protección anti-duplicados activa. Verifique este documento directamente en BIOFILE antes de intentar otro ingreso automático.</div>')}`
  );

  fs.writeFileSync(appPath, html, 'utf8');
}

console.log('[Netlify] Seguridad v6: estados inciertos bloqueados contra reenvío automático.');
