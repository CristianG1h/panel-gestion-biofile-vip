import fs from 'node:fs';

const archivo = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(archivo, 'utf8');

/*
 * Corrección de compatibilidad entre patch-superadmin-panel.mjs y
 * patch-operacion-panel-v5.mjs.
 *
 * El primer parche agrega pintarPaginacionLista() entre contadores() y pintar().
 * El parche de operación reemplaza ese tramo para agregar "Eliminados" y podía
 * borrar accidentalmente la función, dejando la llamada activa y produciendo:
 *   ReferenceError: pintarPaginacionLista is not defined
 */
if (html.includes('pintarPaginacionLista(') && !html.includes('function pintarPaginacionLista(')) {
  const marcador = 'function pintar(){';
  if (!html.includes(marcador)) {
    throw new Error('No se encontró pintar() para restaurar la paginación del listado.');
  }

  const helper = `function pintarPaginacionLista(total,paginas){
  const c=$('paginacionLista');
  if(!c)return;
  if(total<=10){c.innerHTML='';return}
  if(paginaLista<1)paginaLista=1;
  if(paginaLista>paginas)paginaLista=paginas;
  c.innerHTML=\`<button class="btn gris sm pagBtn" id="pagAnt" \${paginaLista<=1?'disabled':''}>← Anterior</button><span class="pagInfo">Página \${paginaLista} de \${paginas} · \${total} registros</span><button class="btn gris sm pagBtn" id="pagSig" \${paginaLista>=paginas?'disabled':''}>Siguiente →</button>\`;
  const a=$('pagAnt'),s=$('pagSig');
  if(a)a.onclick=()=>{if(paginaLista>1){paginaLista--;pintar();window.scrollTo({top:0,behavior:'smooth'})}};
  if(s)s.onclick=()=>{if(paginaLista<paginas){paginaLista++;pintar();window.scrollTo({top:0,behavior:'smooth'})}};
}
`;

  html = html.replace(marcador, helper + marcador);
}

// Validación de build: si existe la llamada, la definición debe existir.
if (html.includes('pintarPaginacionLista(') && !html.includes('function pintarPaginacionLista(')) {
  throw new Error('La paginación del listado quedó incompleta después de aplicar los parches.');
}

fs.writeFileSync(archivo, html, 'utf8');
console.log('[Netlify] Paginación principal verificada y corregida.');
