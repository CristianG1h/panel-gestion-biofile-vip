import fs from 'node:fs';

const panelPath = new URL('../app-v3.html', import.meta.url);
const superPath = new URL('../superadmin.html', import.meta.url);
let panel = fs.readFileSync(panelPath, 'utf8');
let superadmin = fs.readFileSync(superPath, 'utf8');
const MARCA = 'CENTRO_CONTROL_VIP_V8';

if (!panel.includes(`<!-- ${MARCA}_PANEL -->`)) {
  const anchor = '<a class="btn azul sm oculto" id="btnSuperAdmin" href="/superadmin" style="text-decoration:none">🛡️ Super Admin</a>';
  if (!panel.includes(anchor)) throw new Error('No se encontró botón Super Admin del panel.');
  panel = panel.replace(anchor, `${anchor}\n      <!-- ${MARCA}_PANEL -->\n      <a class="btn verde sm oculto" id="btnCentroVip" href="/admin" style="text-decoration:none">🧭 Centro VIP</a>`);

  const toggleAnchor = "$('btnSuperAdmin').classList.toggle('oculto',!esSuperAdmin);";
  if (!panel.includes(toggleAnchor)) throw new Error('No se encontró control de visibilidad Super Admin.');
  panel = panel.replace(toggleAnchor, `${toggleAnchor}$('btnCentroVip').classList.toggle('oculto',!esSuperAdmin);`);
}

if (!superadmin.includes(`<!-- ${MARCA}_SUPER -->`)) {
  const anchor = '<a class="btn gris sm" href="/">← Panel BIOFILE</a>';
  if (!superadmin.includes(anchor)) throw new Error('No se encontró enlace de regreso al Panel BIOFILE.');
  superadmin = superadmin.replace(anchor, `${anchor}<!-- ${MARCA}_SUPER --><a class="btn azul sm" href="/admin">🧭 Centro VIP</a>`);
}

fs.writeFileSync(panelPath, panel, 'utf8');
fs.writeFileSync(superPath, superadmin, 'utf8');
console.log('[Netlify] v8: Centro de Control VIP enlazado desde Panel y Super Admin.');
