import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (html.includes('/* PANEL_CONTRASTE_RELACION_V611 */')) {
  console.log('[Panel] Contraste de Acuerdo/Misión v6.11 ya instalado.');
  process.exit(0);
}
if (!html.includes('/* PANEL_AUDITORIA_RELACION_V610 */')) {
  throw new Error('Primero debe ejecutarse patch-panel-auditoria-relacion-v6-10.mjs.');
}

const css = `
/* PANEL_CONTRASTE_RELACION_V611 */
.badge.empresa-acuerdo,
.badge.empresa-mision{
  border:1px solid transparent;
  font-weight:850;
  line-height:1.25;
  padding:4px 9px;
  box-shadow:0 1px 0 rgba(0,0,0,.04);
}
.badge.empresa-acuerdo{
  background:#E7F2FF;
  color:#0B4B7F;
  border-color:#A9CCEC;
}
.badge.empresa-mision{
  background:#F0E8FF;
  color:#57358A;
  border-color:#CFBDF0;
}
html[data-theme="dark"] .badge.empresa-acuerdo{
  background:#174C75;
  color:#F3FAFF;
  border-color:#3E7BA8;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);
}
html[data-theme="dark"] .badge.empresa-mision{
  background:#493465;
  color:#FBF6FF;
  border-color:#76559A;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);
}
html[data-theme="dark"] .badge.ok{
  background:#194F35;
  color:#E6FAEF;
  border:1px solid #2F7B58;
}
html[data-theme="dark"] .badge.err{
  background:#5B2C28;
  color:#FFE9E6;
  border:1px solid #965047;
}
`;

const styleEnd = html.indexOf('</style>');
if (styleEnd < 0) throw new Error('No se encontró </style> para instalar el contraste.');
html = html.slice(0, styleEnd) + css + html.slice(styleEnd);

const anterior = `function badgesEmpresaPanelV69(r){
  var m=metaEmpresaPanelV69(r);if(!m.acuerdo)return'';
  var out='<span class="badge">🏢 Acuerdo: '+esc(m.acuerdo)+'</span>';
  if(m.mision)out+='<span class="badge">👥 Misión: '+esc(m.mision)+'</span>';
  if(m.aplicada&&m.fallback)out+='<span class="badge err">⚠ Fallback PARTICULARES</span>';
  else if(m.aplicada)out+='<span class="badge ok">✓ Relación aplicada</span>';
  return out;
}`;

const nuevo = `function badgesEmpresaPanelV69(r){
  var m=metaEmpresaPanelV69(r);if(!m.acuerdo)return'';
  var out='<span class="badge empresa-acuerdo">🏢 Acuerdo: '+esc(m.acuerdo)+'</span>';
  if(m.mision)out+='<span class="badge empresa-mision">👥 Misión: '+esc(m.mision)+'</span>';
  if(m.aplicada&&m.fallback)out+='<span class="badge err">⚠ Fallback PARTICULARES</span>';
  else if(m.aplicada)out+='<span class="badge ok">✓ Relación aplicada</span>';
  return out;
}`;

if (!html.includes(anterior)) throw new Error('No se encontró badgesEmpresaPanelV69() después de v6.10.');
html = html.replace(anterior, nuevo);

if (!html.includes('PANEL_CONTRASTE_RELACION_V611') ||
    !html.includes('badge empresa-acuerdo') ||
    !html.includes('badge empresa-mision')) {
  throw new Error('El contraste de relación empresarial v6.11 quedó incompleto.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Panel] v6.11: Acuerdo y Empresa en Misión tienen contraste alto y colores diferenciados en modo claro y oscuro.');
