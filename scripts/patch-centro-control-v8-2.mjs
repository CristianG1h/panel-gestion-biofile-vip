import fs from 'node:fs';

const adminPath = new URL('../admin.html', import.meta.url);
let admin = fs.readFileSync(adminPath, 'utf8');
const MARCA = 'CENTRO_CONTROL_ALIMENTOS_SEPARADO_V82';

if (!admin.includes(MARCA)) {
  const navActual = '<button class="nav-item" data-app="alimentos"><span class="nav-icon">🍎</span><span class="nav-label">Dashboard alimentos</span></button>';
  const navNuevo = '<!-- CENTRO_CONTROL_ALIMENTOS_SEPARADO_V82 -->\n      <button class="nav-item" data-app="alimentos"><span class="nav-icon">🍎</span><span class="nav-label">Manipulación de alimentos</span></button>\n      <button class="nav-item" data-app="dashboardAlimentos"><span class="nav-icon">📊</span><span class="nav-label">Dashboard alimentos</span></button>';
  if (!admin.includes(navActual)) throw new Error('No se encontró el botón de alimentos transformado por v8.1.');
  admin = admin.replace(navActual, navNuevo);

  const appActual = "alimentos:{title:'Dashboard de alimentos',subtitle:'Cursos, usuarios, certificados y administración',icon:'🍎',url:()=> 'https://dashboard-alimentos.vipocupacional.com/',host:'dashboard-alimentos.vipocupacional.com'},";
  const appNuevo = "alimentos:{title:'Manipulación de alimentos',subtitle:'Cursos, usuarios, certificados y administración',icon:'🍎',url:()=> 'https://alimentos.vipocupacional.com/login',host:'alimentos.vipocupacional.com'},\n  dashboardAlimentos:{title:'Dashboard de alimentos',subtitle:'Estadísticas y métricas del proyecto de manipulación de alimentos',icon:'📊',url:()=> 'https://dashboard-alimentos.vipocupacional.com/',host:'dashboard-alimentos.vipocupacional.com'},";
  if (!admin.includes(appActual)) throw new Error('No se encontró la configuración actual de alimentos.');
  admin = admin.replace(appActual, appNuevo);
}

fs.writeFileSync(adminPath, admin, 'utf8');
console.log('[Netlify] v8.2: Manipulación de alimentos y Dashboard alimentos separados correctamente.');
