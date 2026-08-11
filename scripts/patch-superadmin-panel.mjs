import fs from 'node:fs';

const archivo = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(archivo, 'utf8');

function reemplazarUnaVez(buscar, reemplazo, etiqueta) {
  if (html.includes(reemplazo)) return;
  if (!html.includes(buscar)) throw new Error(`No se encontró ${etiqueta} en app-v3.html.`);
  html = html.replace(buscar, reemplazo);
}

// 1) Permisos visibles para admin / superadmin en el panel normal.
const botonDashboard = '<button class="btn gris sm oculto" id="btnDashboard">📊 Dashboard</button>';
const botonSuperAdmin = '<a class="btn azul sm oculto" id="btnSuperAdmin" href="/superadmin" style="text-decoration:none">🛡️ Super Admin</a>';
if (!html.includes('id="btnSuperAdmin"')) {
  reemplazarUnaVez(botonDashboard, `${botonDashboard}\n      ${botonSuperAdmin}`, 'el botón Dashboard');
}

const inicioRegex = /async function iniciarApp\(u\)\{[^\n]*\}/;
const inicioNuevo = `async function iniciarApp(u){usuarioActual=u;cargarJobs();aplicarTema();const esAdmin=['admin','superadmin'].includes(u.rol),esSuperAdmin=u.rol==='superadmin';const etiquetaRol=esSuperAdmin?' · Super Admin':u.rol==='admin'?' · Administrador':'';$('usuarioPill').textContent=\`Hola, \${u.nombre}\${etiquetaRol}\`;$('btnDashboard').classList.toggle('oculto',!esAdmin);$('btnSuperAdmin').classList.toggle('oculto',!esSuperAdmin);$('loginScreen').classList.add('oculto');$('app').classList.remove('oculto');paginaLista=1;await cargarRegistros(false)}`;
if (!inicioRegex.test(html)) throw new Error('No se encontró iniciarApp() en app-v3.html.');
html = html.replace(inicioRegex, inicioNuevo);

// 2) Mejor contraste y jerarquía visual en tema oscuro + paginación.
if (!html.includes('/* VIP_DARK_V4 */')) {
  const css = `\n/* VIP_DARK_V4 */\nhtml[data-theme="dark"]{--fondo:#07111C;--panel:#101D2A;--texto:#F2F7FC;--muted:#AFC1D2;--borde:#2B4053;--azulClaro:#112D44;--verdeClaro:#103626;--rojoClaro:#3B1F22;--amarilloClaro:#382F12;--sombra:0 10px 30px rgba(0,0,0,.32)}\nhtml[data-theme="dark"] .card,html[data-theme="dark"] .item,html[data-theme="dark"] .seccion,html[data-theme="dark"] .modalBox{background:#101D2A;border-color:#2B4053}\nhtml[data-theme="dark"] .input{background:#0C1824;border-color:#31485C;color:#F3F8FC}html[data-theme="dark"] .input::placeholder{color:#7F96AA}\nhtml[data-theme="dark"] .gris{background:#162534;border-color:#365064;color:#F2F7FC}html[data-theme="dark"] .gris:hover{background:#1D3041}\nhtml[data-theme="dark"] .tab{background:#122130;border-color:#31485C;color:#C1D0DD}html[data-theme="dark"] .tab.activo{background:#0B6FC2;border-color:#1687E3;color:#fff}\nhtml[data-theme="dark"] .masivo{background:#102B40;border-color:#3A6D91}html[data-theme="dark"] .item:hover{background:#142536;border-color:#3D7BA8}\nhtml[data-theme="dark"] .estadoBox{background:#0C1824;border-color:#2B4053}html[data-theme="dark"] .usuarioPill{background:#12314A;color:#D8EEFF}\n.paginacion{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;padding:12px 4px 2px}.pagInfo{font-size:12px;color:var(--muted);font-weight:700}.pagBtn{min-width:38px}\n`;
  html = html.replace('</style>', `${css}</style>`);
}

// 3) Agregar control de páginas al listado principal.
if (!html.includes('id="paginacionLista"')) {
  reemplazarUnaVez('<div class="lista" id="lista"></div>', '<div class="lista" id="lista"></div><div class="paginacion" id="paginacionLista"></div>', 'la lista principal');
}

// 4) Estado de página.
html = html.replace(
  "let usuarioActual=null,registros=[],actual=null,tab='pendiente',seleccion=new Set(),trabajos={},pollUltimo=0;",
  "let usuarioActual=null,registros=[],actual=null,tab='pendiente',seleccion=new Set(),trabajos={},pollUltimo=0,paginaLista=1;"
);

// 5) Fecha/hora colombiana en formato 12 horas.
if (!html.includes('function fmtFechaHoraColombia')) {
  const marcador = "function fechaRegIso(v){";
  const helper = `function parseFechaColombia(v){const s=limpiar(v);if(!s)return null;let d=new Date(s);if(!isNaN(d))return d;let m=s.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})[, ]+([01]?\\d|2[0-3]):(\\d{2})(?::(\\d{2}))?/);if(m)return new Date(\`${'${m[3]}'}-${'${m[2].padStart(2,\'0\')}'}-${'${m[1].padStart(2,\'0\')}'}T${'${m[4].padStart(2,\'0\')}'}:${'${m[5]}'}:${'${m[6]||\'00\'}'}-05:00\`);return null}\nfunction fmtFechaHoraColombia(v){const d=parseFechaColombia(v);if(!d)return limpiar(v)||'—';return new Intl.DateTimeFormat('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'2-digit',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).format(d).replace(/a\\.\\s*m\\./gi,'AM').replace(/p\\.\\s*m\\./gi,'PM')}\n`;
  if (!html.includes(marcador)) throw new Error('No se encontró fechaRegIso() para insertar el formateador colombiano.');
  html = html.replace(marcador, helper + marcador);
}

// 6) Paginación de 10 elementos en Pendientes / En proceso / Ingresados.
if (!html.includes('function pintarPaginacionLista')) {
  const marcador = "function pintar(){contadores();";
  const helper = `function pintarPaginacionLista(total,paginas){const c=$('paginacionLista');if(!c)return;if(total<=10){c.innerHTML='';return}c.innerHTML=\`<button class="btn gris sm pagBtn" id="pagAnt" ${'${paginaLista<=1?\'disabled\':\'\'}'}>←</button><span class="pagInfo">Página ${'${paginaLista}'} de ${'${paginas}'} · ${'${total}'} registros</span><button class="btn gris sm pagBtn" id="pagSig" ${'${paginaLista>=paginas?\'disabled\':\'\'}'}>→</button>\`;const a=$('pagAnt'),s=$('pagSig');if(a)a.onclick=()=>{if(paginaLista>1){paginaLista--;pintar();window.scrollTo({top:0,behavior:'smooth'})}};if(s)s.onclick=()=>{if(paginaLista<paginas){paginaLista++;pintar();window.scrollTo({top:0,behavior:'smooth'})}}}\n`;
  if (!html.includes(marcador)) throw new Error('No se encontró pintar() para insertar paginación.');
  html = html.replace(marcador, helper + marcador);
}

const listadoViejo = "const arr=filtrados().filter(r=>categoria(r)===tab);$('lista').innerHTML='';if(!arr.length){$('lista').innerHTML='<div class=\"nota\" style=\"padding:20px;text-align:center\">No hay registros en esta sección.</div>';actualizarMasivo();return}arr.sort((a,b)=>limpiar(b['Fecha de registro']).localeCompare(limpiar(a['Fecha de registro']))).forEach(r=>";
const listadoNuevo = "const todos=filtrados().filter(r=>categoria(r)===tab).sort((a,b)=>limpiar(b['Fecha de registro']).localeCompare(limpiar(a['Fecha de registro']))),paginas=Math.max(1,Math.ceil(todos.length/10));if(paginaLista>paginas)paginaLista=paginas;const arr=todos.slice((paginaLista-1)*10,paginaLista*10);$('lista').innerHTML='';pintarPaginacionLista(todos.length,paginas);if(!todos.length){$('lista').innerHTML='<div class=\"nota\" style=\"padding:20px;text-align:center\">No hay registros en esta sección.</div>';actualizarMasivo();return}arr.forEach(r=>";
if (html.includes(listadoViejo)) html = html.replace(listadoViejo, listadoNuevo);

// 7) Mostrar fechas legibles de Colombia en las tarjetas.
html = html.replace("${esc(r['Fecha de registro']||'')}", "${esc(fmtFechaHoraColombia(r['Fecha de registro']))}");

// 8) Reiniciar a página 1 al cambiar de pestaña o filtro/búsqueda.
html = html.replace("function activarTab(t){tab=t;", "function activarTab(t){tab=t;paginaLista=1;");
html = html.replace("$('btnBuscar').onclick=()=>cargarRegistros(false);", "$('btnBuscar').onclick=()=>{paginaLista=1;cargarRegistros(false)};");
html = html.replace("$('inputBusqueda').addEventListener('keydown',e=>{if(e.key==='Enter')cargarRegistros(false)});", "$('inputBusqueda').addEventListener('keydown',e=>{if(e.key==='Enter'){paginaLista=1;cargarRegistros(false)}});");
html = html.replace("$('filtroFecha').onchange=pintar;", "$('filtroFecha').onchange=()=>{paginaLista=1;pintar()};");
html = html.replace("$('btnHoy').onclick=()=>{$('filtroFecha').value=hoyBogota();pintar()};", "$('btnHoy').onclick=()=>{$('filtroFecha').value=hoyBogota();paginaLista=1;pintar()};");
html = html.replace("$('btnLimpiar').onclick=()=>{$('inputBusqueda').value='';$('filtroFecha').value='';cargarRegistros(false)}", "$('btnLimpiar').onclick=()=>{$('inputBusqueda').value='';$('filtroFecha').value='';paginaLista=1;cargarRegistros(false)}");

fs.writeFileSync(archivo, html, 'utf8');
console.log('[Netlify] Panel principal: roles, modo oscuro, hora Colombia y paginación v4 listos.');
