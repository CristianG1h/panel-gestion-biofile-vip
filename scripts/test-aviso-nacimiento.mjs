import {chromium} from '../../biofile-render-endpoint/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 await page.route('**/*',async route=>{
  if(route.request().url()==='https://panel.test/')return route.fulfill({contentType:'text/html',body:await fs.readFile(new URL('../app-v3.html',import.meta.url),'utf8')});
  return route.abort();
 });
 await page.goto('https://panel.test/');
 await page.evaluate(()=>{
   actual={'N° documento':'123456789','Ciudad nacimiento':'CIUDAD ORIGINAL','ESTADO_BIOFILE':'COMPLETADO'};
   trabajos[claveRegistro(actual)]={estado:'completado',progreso:100,ajustesNacimiento:[{original:'CIUDAD AUSENTE <script> (VENEZUELA)',aplicado:'BOGOTÁ (BOGOTÁ D.C., COLOMBIA)',motivo:'BIOFILE no ofreció una coincidencia válida y única para el lugar solicitado.'}]};
   actualizarFicha();
 });
 const aviso=page.locator('#estadoFicha .aviso');
 assert.match(await aviso.textContent(),/Lugar de nacimiento ajustado/);
 assert.match(await aviso.textContent(),/CIUDAD AUSENTE <script>/);
 assert.match(await aviso.textContent(),/BOGOTÁ/);
 assert.equal(await aviso.locator('script').count(),0);
 assert.equal(await page.locator('#btnEnviarUno').isDisabled(),true);
 await page.evaluate(()=>{trabajos[claveRegistro(actual)].ajustesNacimiento=[];actualizarFicha();});
 assert.equal(await page.locator('#estadoFicha .aviso').count(),0);
 console.log('PASS panel: advertencia con original, Bogotá y motivo; texto escapado; sin aviso cuando no hubo cambio');
} finally {await browser.close();}
