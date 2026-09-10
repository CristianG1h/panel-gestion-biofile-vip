import fs from 'node:fs';

const adminPath = new URL('../admin.html', import.meta.url);
const panelPath = new URL('../app-v3.html', import.meta.url);
const superPath = new URL('../superadmin.html', import.meta.url);

let admin = fs.readFileSync(adminPath, 'utf8');
let panel = fs.readFileSync(panelPath, 'utf8');
let superadmin = fs.readFileSync(superPath, 'utf8');

function reemplazar(texto, buscar, reemplazo, etiqueta) {
  if (texto.includes(reemplazo)) return texto;
  if (!texto.includes(buscar)) throw new Error(`No se encontró ${etiqueta}.`);
  return texto.replace(buscar, reemplazo);
}

// 1) Evitar que el Centro de Control pueda cargarse dentro de sí mismo.
// Si por cualquier navegación interna /admin termina dentro de un iframe del propio panel,
// el navegador recupera la ventana superior y elimina el bucle de paneles anidados.
if (!admin.includes('CENTRO_CONTROL_FRAME_GUARD_V81')) {
  admin = reemplazar(
    admin,
    '<body>',
    `<body>\n<script>/* CENTRO_CONTROL_FRAME_GUARD_V81 */if(window.self!==window.top){try{window.top.location.replace(window.location.href)}catch(_e){}}</script>`,
    'la apertura de <body> en admin.html'
  );
}

// 2) Los módulos BIOFILE internos se cargan por el archivo real, no por rutas reescritas.
// Esto evita que el hash del Centro (/admin#superadmin) o una navegación interna termine
// resolviendo nuevamente al Centro de Control.
admin = reemplazar(
  admin,
  "biofile:{title:'Panel de gestión BIOFILE',subtitle:'Pacientes, ingresos, órdenes y operación BIOFILE',icon:'🏥',url:()=>location.origin+'/',host:'panel.vipocupacional.com'}",
  "biofile:{title:'Panel de gestión BIOFILE',subtitle:'Pacientes, ingresos, órdenes y operación BIOFILE',icon:'🏥',url:()=>location.origin+'/app-v3.html?embedded=1',host:'panel.vipocupacional.com'}",
  'la URL interna del Panel BIOFILE'
);
admin = reemplazar(
  admin,
  "superadmin:{title:'Super Admin BIOFILE',subtitle:'Usuarios, auditoría, empresas y paquetes',icon:'🛡️',url:()=>location.origin+'/superadmin',host:'panel.vipocupacional.com/superadmin'}",
  "superadmin:{title:'Super Admin BIOFILE',subtitle:'Usuarios, auditoría, empresas y paquetes',icon:'🛡️',url:()=>location.origin+'/superadmin.html?embedded=1',host:'panel.vipocupacional.com/superadmin'}",
  'la URL interna del Super Admin BIOFILE'
);

// 3) Nuevo dashboard de alimentos.
admin = admin.replaceAll('https://alimentos.vipocupacional.com/login', 'https://dashboard-alimentos.vipocupacional.com/');
admin = admin.replaceAll("host:'alimentos.vipocupacional.com'", "host:'dashboard-alimentos.vipocupacional.com'");
admin = admin.replaceAll("title:'Manipulación de alimentos'", "title:'Dashboard de alimentos'");
admin = admin.replaceAll('<span class="nav-label">Manipulación de alimentos</span>', '<span class="nav-label">Dashboard alimentos</span>');

// 4) El botón Centro VIP de las pantallas internas debe salir al nivel superior.
// Así, aunque se pulse desde un iframe, no puede crear Centro > Centro > Centro.
panel = panel.replace(
  '<a class="btn verde sm oculto" id="btnCentroVip" href="/admin" style="text-decoration:none">🧭 Centro VIP</a>',
  '<a class="btn verde sm oculto" id="btnCentroVip" href="/admin" target="_top" style="text-decoration:none">🧭 Centro VIP</a>'
);
superadmin = superadmin.replace(
  '<a class="btn azul sm" href="/admin">🧭 Centro VIP</a>',
  '<a class="btn azul sm" href="/admin" target="_top">🧭 Centro VIP</a>'
);

// 5) Si las pantallas internas detectan ?embedded=1, el botón Centro VIP se oculta porque
// el usuario ya está dentro del Centro. Esto evita confusión visual y otra vía de bucle.
const embeddedStyle = `<style id="vipEmbeddedV81">\nhtml.vip-embedded #btnCentroVip{display:none!important}\n</style>\n<script>if(new URLSearchParams(location.search).get('embedded')==='1'){document.documentElement.classList.add('vip-embedded')}</script>`;
if (!panel.includes('id="vipEmbeddedV81"')) panel = panel.replace('</head>', `${embeddedStyle}\n</head>`);
if (!superadmin.includes('id="vipEmbeddedV81"')) superadmin = superadmin.replace('</head>', `${embeddedStyle}\n</head>`);

fs.writeFileSync(adminPath, admin, 'utf8');
fs.writeFileSync(panelPath, panel, 'utf8');
fs.writeFileSync(superPath, superadmin, 'utf8');

console.log('[Netlify] v8.1: bucle eliminado, rutas internas directas y dashboard de alimentos actualizado.');
