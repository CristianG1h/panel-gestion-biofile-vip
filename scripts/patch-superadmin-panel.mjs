import fs from 'node:fs';

const archivo = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(archivo, 'utf8');

const botonDashboard = '<button class="btn gris sm oculto" id="btnDashboard">📊 Dashboard</button>';
const botonSuperAdmin = '<a class="btn azul sm oculto" id="btnSuperAdmin" href="/superadmin" style="text-decoration:none">🛡️ Super Admin</a>';

if (!html.includes('id="btnSuperAdmin"')) {
  if (!html.includes(botonDashboard)) {
    throw new Error('No se encontró el botón Dashboard esperado en app-v3.html.');
  }
  html = html.replace(botonDashboard, `${botonDashboard}\n      ${botonSuperAdmin}`);
}

const inicioRegex = /async function iniciarApp\(u\)\{[^\n]*\}/;
const inicioNuevo = `async function iniciarApp(u){usuarioActual=u;cargarJobs();aplicarTema();const esAdmin=['admin','superadmin'].includes(u.rol),esSuperAdmin=u.rol==='superadmin';const etiquetaRol=esSuperAdmin?' · Super Admin':u.rol==='admin'?' · Administrador':'';$('usuarioPill').textContent=\`Hola, \${u.nombre}\${etiquetaRol}\`;$('btnDashboard').classList.toggle('oculto',!esAdmin);$('btnSuperAdmin').classList.toggle('oculto',!esSuperAdmin);$('loginScreen').classList.add('oculto');$('app').classList.remove('oculto');await cargarRegistros(false)}`;

if (!inicioRegex.test(html)) {
  throw new Error('No se encontró iniciarApp() en app-v3.html.');
}
html = html.replace(inicioRegex, inicioNuevo);

fs.writeFileSync(archivo, html, 'utf8');
console.log('[Netlify] Panel principal preparado para Admin y Super Admin.');
