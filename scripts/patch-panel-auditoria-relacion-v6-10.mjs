import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (html.includes('/* PANEL_AUDITORIA_RELACION_V610 */')) {
  console.log('[Panel] Auditoría de relación empresarial v6.10 ya instalada.');
  process.exit(0);
}
if (!html.includes('/* PANEL_ACUERDO_MISION_V69 */')) {
  throw new Error('Primero debe ejecutarse patch-panel-acuerdo-mision-v6-9.mjs.');
}

const inicio = html.indexOf('function metaEmpresaPanelV69(r){');
const fin = html.indexOf('function badgesEmpresaPanelV69(r){', inicio);
if (inicio < 0 || fin < 0) throw new Error('No se encontró metaEmpresaPanelV69().');

const metaNuevo = String.raw`/* PANEL_AUDITORIA_RELACION_V610 */
function metaEmpresaPanelV69(r){
  // Prioridad 1: lo que el backend confirmó que realmente quedó aplicado en BIOFILE.
  // Estas columnas son escritas por biofile-render-endpoint después de crear la orden.
  var acuerdoAplicado=limpiar(r&&r['ACUERDO_COMERCIAL_BIOFILE']);
  var misionAplicada=limpiar(r&&r['EMPRESA_MISION_BIOFILE']);
  var origenAplicado=limpiar(r&&r['ORIGEN_RELACION_EMPRESA']);
  if(acuerdoAplicado||misionAplicada){
    return{
      acuerdo:acuerdoAplicado||misionAplicada,
      mision:misionAplicada||'',
      original:limpiar(r&&r['Empresa en misión']),
      relacion:true,
      aplicada:true,
      fallback:/FALLBACK/i.test(origenAplicado),
      origen:origenAplicado||'BIOFILE'
    };
  }

  // Prioridad 2: para registros antiguos o todavía pendientes, se conserva la
  // resolución por catálogo V2.7 que ya usaba el panel.
  var original=limpiar(r&&r['Empresa en misión']);
  if(!original)return{acuerdo:'',mision:'',original:'',relacion:false,aplicada:false,fallback:false,origen:''};
  var key=claveEmpresaPanelV69(original);
  if(EMPRESA_META_PANEL_V69.has(key))return EMPRESA_META_PANEL_V69.get(key);
  var meta={acuerdo:original,mision:'',original:original,relacion:false,aplicada:false,fallback:false,origen:'CATALOGO_V27'};
  try{
    var res=typeof resolverBaseCacheV68==='function'?resolverBaseCacheV68(original):resolverRelacionV67(original,null);
    if(res&&res.principal&&Number(res.confianza||0)>=.82){
      var principal=limpiar(res.principal),mision=limpiar(res.mision||original);
      var originalEsPrincipal=claveEmpresaPanelV69(original)===claveEmpresaPanelV69(principal);
      meta.acuerdo=principal;
      meta.mision=!originalEsPrincipal&&mision&&claveEmpresaPanelV69(mision)!==claveEmpresaPanelV69(principal)?mision:'';
      meta.relacion=true;
    }
  }catch(_){ }
  EMPRESA_META_PANEL_V69.set(key,meta);
  return meta;
}
`;

html = html.slice(0, inicio) + metaNuevo + html.slice(fin);

const badgesViejo = `function badgesEmpresaPanelV69(r){
  var m=metaEmpresaPanelV69(r);if(!m.acuerdo)return'';
  var out='<span class="badge">🏢 Acuerdo: '+esc(m.acuerdo)+'</span>';
  if(m.mision)out+='<span class="badge">👥 Misión: '+esc(m.mision)+'</span>';
  return out;
}`;
const badgesNuevo = `function badgesEmpresaPanelV69(r){
  var m=metaEmpresaPanelV69(r);if(!m.acuerdo)return'';
  var out='<span class="badge">🏢 Acuerdo: '+esc(m.acuerdo)+'</span>';
  if(m.mision)out+='<span class="badge">👥 Misión: '+esc(m.mision)+'</span>';
  if(m.aplicada&&m.fallback)out+='<span class="badge err">⚠ Fallback PARTICULARES</span>';
  else if(m.aplicada)out+='<span class="badge ok">✓ Relación aplicada</span>';
  return out;
}`;
if (!html.includes(badgesViejo)) throw new Error('No se encontró badgesEmpresaPanelV69().');
html = html.replace(badgesViejo, badgesNuevo);

const fichaVieja = `    relBox.appendChild(filaRelacionPanelV69('Acuerdo comercial',rel.acuerdo));
    if(rel.mision)relBox.appendChild(filaRelacionPanelV69('Empresa en misión',rel.mision));
    cont.appendChild(relBox);`;
const fichaNueva = `    relBox.appendChild(filaRelacionPanelV69('Acuerdo comercial',rel.acuerdo));
    if(rel.mision)relBox.appendChild(filaRelacionPanelV69('Empresa en misión',rel.mision));
    if(rel.aplicada)relBox.appendChild(filaRelacionPanelV69('Estado de la relación',rel.fallback?'Fallback aplicado: PARTICULARES':'Aplicada y confirmada por BIOFILE'));
    cont.appendChild(relBox);`;
if (!html.includes(fichaVieja)) throw new Error('No se encontró la sección Relación empresarial de la ficha.');
html = html.replace(fichaVieja, fichaNueva);

if (!html.includes('PANEL_AUDITORIA_RELACION_V610') ||
    !html.includes('ACUERDO_COMERCIAL_BIOFILE') ||
    !html.includes('EMPRESA_MISION_BIOFILE') ||
    !html.includes('ORIGEN_RELACION_EMPRESA') ||
    !html.includes('Fallback PARTICULARES')) {
  throw new Error('La auditoría de relación empresarial v6.10 quedó incompleta.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Panel] v6.10: el panel prioriza y muestra la relación Acuerdo/Misión realmente aplicada en BIOFILE, con indicador de fallback.');
