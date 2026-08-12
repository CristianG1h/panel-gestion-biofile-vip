import fs from 'node:fs';

const archivo = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(archivo, 'utf8');

if (!html.includes('/* INGRESADO_POR_V6 */')) {
  const css = `
/* INGRESADO_POR_V6 */
.badge.ingresoPor{background:#E8F3FC;color:#083E6E;border:1px solid #B9D9F2}
.badge.registradoPor{background:#F2ECFB;color:#593C83;border:1px solid #D8C8EF}
html[data-theme="dark"] .badge.ingresoPor{background:#12314A;color:#D8EEFF;border-color:#315B79}
html[data-theme="dark"] .badge.registradoPor{background:#2A2140;color:#E7DAFF;border-color:#5A477C}
`;
  html = html.replace('</style>', `${css}</style>`);

  const marcador = 'function pintar(){';
  if (!html.includes(marcador)) {
    throw new Error('No se encontró pintar() para agregar la identificación del usuario que ingresó el paciente.');
  }

  const helper = `function badgesIngreso(r){
  if(categoria(r)!=='ingresado')return '';
  const atribuido=limpiar(r?.['USUARIO_BIOFILE']);
  const registrado=limpiar(r?.['REGISTRADO_POR_BIOFILE']);
  const responsable=atribuido||registrado;
  let salida='<span class="badge ok">✓ Ingresado</span>';
  salida+='<span class="badge ingresoPor">👤 Ingresado por: '+esc(responsable||'No registrado')+'</span>';
  if(registrado&&responsable&&registrado.toUpperCase()!==responsable.toUpperCase()){
    salida+='<span class="badge registradoPor">✍ Registrado por: '+esc(registrado)+'</span>';
  }
  return salida;
}
`;
  html = html.replace(marcador, helper + marcador);

  const badgeAnterior = "${categoria(r)==='ingresado'?'<span class=\"badge ok\">✓ Ingresado</span>':''}";
  if (!html.includes(badgeAnterior)) {
    throw new Error('No se encontró la insignia actual de Ingresado en las tarjetas.');
  }
  html = html.replace(badgeAnterior, '${badgesIngreso(r)}');

  fs.writeFileSync(archivo, html, 'utf8');
}

if (!html.includes('function badgesIngreso(')) {
  throw new Error('No quedó instalada la identificación de usuario en Ingresados.');
}

console.log('[Netlify] Tarjetas de Ingresados: responsable de ingreso visible.');
