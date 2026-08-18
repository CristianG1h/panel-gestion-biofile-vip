import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (html.includes('/* PANEL_MANUAL_RELACION_V612 */')) {
  console.log('[Panel] Datos Acuerdo/Misión para ingreso manual v6.12 ya instalados.');
  process.exit(0);
}
if (!html.includes('/* PANEL_CONTRASTE_RELACION_V611 */')) {
  throw new Error('Primero debe ejecutarse patch-contraste-relacion-v6-11.mjs.');
}
if (!html.includes('/* REPORTE_ACUERDO_MISION_V67 */')) {
  throw new Error('No está disponible el catálogo Acuerdo/Misión v6.7.');
}

const css = `
/* PANEL_MANUAL_RELACION_V612 */
.manualBiofileBox{margin:0 0 14px;border:1.5px solid #9FC6E7;border-radius:11px;overflow:hidden;background:#F7FBFF}
.manualBiofileHead{padding:11px 12px;background:#E7F2FF;border-bottom:1px solid #BFD9EE;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.manualBiofileHead b{display:block;color:#0B4B7F;font-size:13px}.manualBiofileHead span{display:block;color:#5C7183;font-size:11px;margin-top:3px;line-height:1.4}
.manualBiofileFila{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;padding:11px 12px;border-top:1px solid #D7E6F2}.manualBiofileFila:first-of-type{border-top:0}
.manualBiofilePaso{width:28px;height:28px;border-radius:50%;background:#0B5FA5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900}
.manualBiofileDato small{display:block;color:#667887;font-size:10px;font-weight:800;margin-bottom:4px}.manualBiofileDato strong{display:block;color:#17364F;font-size:13px;line-height:1.35;word-break:break-word}
.manualBiofileNota{padding:9px 12px;background:#F0F7FC;border-top:1px solid #D7E6F2;color:#607482;font-size:11px;line-height:1.45}
.manualBiofileBox.fallback{border-color:#E0B74F;background:#FFF9E9}.manualBiofileBox.fallback .manualBiofileHead{background:#FFF3CA;border-color:#E7C96E}.manualBiofileBox.fallback .manualBiofileHead b{color:#705612}.manualBiofileBox.fallback .manualBiofileNota{background:#FFF8E1;color:#705612}
html[data-theme="dark"] .manualBiofileBox{background:#0E2232;border-color:#3E7BA8}
html[data-theme="dark"] .manualBiofileHead{background:#173A56;border-color:#315E7E}html[data-theme="dark"] .manualBiofileHead b{color:#F3FAFF}html[data-theme="dark"] .manualBiofileHead span{color:#B6CDDF}
html[data-theme="dark"] .manualBiofileFila{border-color:#2B4D66}html[data-theme="dark"] .manualBiofileDato small{color:#9FB7C9}html[data-theme="dark"] .manualBiofileDato strong{color:#FFFFFF}
html[data-theme="dark"] .manualBiofileNota{background:#122A3D;border-color:#2B4D66;color:#B7CEDF}
html[data-theme="dark"] .manualBiofileBox.fallback{background:#342D17;border-color:#9B7A2C}html[data-theme="dark"] .manualBiofileBox.fallback .manualBiofileHead{background:#403719;border-color:#866B27}html[data-theme="dark"] .manualBiofileBox.fallback .manualBiofileHead b,html[data-theme="dark"] .manualBiofileBox.fallback .manualBiofileNota{color:#FFE7A0}html[data-theme="dark"] .manualBiofileBox.fallback .manualBiofileNota{background:#332C16;border-color:#715B24}
@media(max-width:700px){.manualBiofileFila{grid-template-columns:30px 1fr}.manualBiofileFila .btn{grid-column:2;justify-self:start}}
`;
const styleEnd = html.indexOf('</style>');
if (styleEnd < 0) throw new Error('No se encontró </style>.');
html = html.slice(0, styleEnd) + css + html.slice(styleEnd);

const aviso = '<div class="aviso">✏️ Puede corregir cualquier dato con el botón del lápiz. El cambio se guarda directamente en Google Sheets. Si el estrato está vacío, el sistema propone <b>1</b>.</div>';
if (!html.includes(aviso)) throw new Error('No se encontró el aviso del ingreso manual.');
const bloque = `${aviso}
        <div class="manualBiofileBox" id="manualBiofileBox">
          <div class="manualBiofileHead">
            <div><b>🏢 Datos de empresa para ingresar en BIOFILE</b><span>Cópielos en este orden y seleccione la opción que aparezca en el autocompletado de BIOFILE.</span></div>
            <button class="btn verde sm" id="btnCopiarRelacionManual">📋 Copiar ambos</button>
          </div>
          <div class="manualBiofileFila">
            <div class="manualBiofilePaso">1</div>
            <div class="manualBiofileDato"><small>Nombre del Acuerdo Comercial, Contrato o Convenio</small><strong id="manualAcuerdoBiofile">—</strong></div>
            <button class="btn gris sm" id="btnCopiarAcuerdoManual">Copiar acuerdo</button>
          </div>
          <div class="manualBiofileFila">
            <div class="manualBiofilePaso">2</div>
            <div class="manualBiofileDato"><small>Nombre de la Empresa en Misión</small><strong id="manualMisionBiofile">—</strong></div>
            <button class="btn gris sm" id="btnCopiarMisionManual">Copiar misión</button>
          </div>
          <div class="manualBiofileNota" id="manualRelacionNota">Verificando relación empresarial…</div>
        </div>`;
html = html.replace(aviso, bloque);

const marcador = 'function pintar(){';
const idx = html.indexOf(marcador);
if (idx < 0) throw new Error('No se encontró function pintar().');

const helper = String.raw`
function distanciaManualV612(a,b){
  a=String(a||'');b=String(b||'');if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;
  var ant=Array.from({length:b.length+1},function(_,i){return i});
  for(var i=1;i<=a.length;i++){var act=[i];for(var j=1;j<=b.length;j++){var c=a[i-1]===b[j-1]?0:1;act[j]=Math.min(act[j-1]+1,ant[j]+1,ant[j-1]+c)}ant=act}return ant[b.length]
}
function mismoNombreManualV612(a,b){
  var x=literalRelacionV67(a),y=literalRelacionV67(b);if(!x||!y)return false;if(x===y)return true;
  var max=Math.max(x.length,y.length);if(max<8)return false;var lim=Math.max(1,Math.min(2,Math.floor(max*.08)));return distanciaManualV612(x,y)<=lim
}
function resultadoManualV612(acuerdo,mision,fuente,fallback){
  acuerdo=limpiar(acuerdo)||'PARTICULARES';mision=limpiar(mision)||acuerdo||'PARTICULARES';
  return{acuerdo:acuerdo,mision:mision,fuente:fuente||'',fallback:!!fallback}
}
function desdeAcuerdoManualV612(acuerdo){
  acuerdo=limpiar(acuerdo);if(!acuerdo)return null;var kp=claveRelacionV67(acuerdo),principal=PRINCIPALES_V67.get(kp);if(!principal)return null;
  var rels=RELACIONES_V67.filter(function(r){return claveRelacionV67(r.principal)===claveRelacionV67(principal)});
  var propia=rels.find(function(r){return r.clave===claveRelacionV67(principal)});
  if(propia)return resultadoManualV612(principal,propia.mision,'Catálogo Acuerdo/Misión',false);
  if(rels.length===1){var m=rels[0].mision;if(mismoNombreManualV612(principal,m))m=principal;return resultadoManualV612(principal,m,'Catálogo Acuerdo/Misión',false)}
  return null
}
function datosRelacionManualV612(r){
  if(!r)return resultadoManualV612('PARTICULARES','PARTICULARES','Sin registro',true);
  var acuerdoAplicado=limpiar(r['ACUERDO_COMERCIAL_BIOFILE']),misionAplicada=limpiar(r['EMPRESA_MISION_BIOFILE']),origenAplicado=limpiar(r['ORIGEN_RELACION_EMPRESA']);
  if(acuerdoAplicado||misionAplicada){
    var fb=/FALLBACK/i.test(origenAplicado);return resultadoManualV612(acuerdoAplicado||misionAplicada,misionAplicada||acuerdoAplicado,fb?'Fallback confirmado por BIOFILE':'Confirmado por BIOFILE',fb)
  }

  var acuerdo=limpiar(r['Acuerdo comercial']||r['Acuerdo Comercial']||r['Nombre del Acuerdo Comercial, Contrato o Convenio']);
  var mision=limpiar(r['Empresa en misión']||r['Empresa en Misión']);
  var original=limpiar(r['Empresa registrada (original)']);

  if(acuerdo&&mision){
    var principal=PRINCIPALES_V67.get(claveRelacionV67(acuerdo))||acuerdo;
    if(claveRelacionV67(acuerdo)===claveRelacionV67(mision))return resultadoManualV612(principal,principal,'Selección confirmada del formulario',false);
    var exacta=resolverExactaV67(mision);
    if(exacta&&claveRelacionV67(exacta.principal)===claveRelacionV67(principal))return resultadoManualV612(exacta.principal,exacta.mision,'Selección confirmada del formulario',false);
    return resultadoManualV612('PARTICULARES','PARTICULARES','La pareja Acuerdo/Misión no pudo validarse de forma segura',true)
  }

  if(mision){
    var em=resolverExactaV67(mision);if(em)return resultadoManualV612(em.principal,em.mision,'Catálogo Acuerdo/Misión',false);
    var comoAcuerdo=desdeAcuerdoManualV612(mision);if(comoAcuerdo)return comoAcuerdo
  }
  if(acuerdo){var ea=desdeAcuerdoManualV612(acuerdo);if(ea)return ea}

  if(original){
    var esp=resolverEspecialV67(original);if(esp&&esp.confianza>=1&&esp.principal&&esp.mision)return resultadoManualV612(esp.principal,esp.mision,'Alias validado del catálogo',false);
    var ex=resolverExactaV67(original);if(ex)return resultadoManualV612(ex.principal,ex.mision,'Catálogo Acuerdo/Misión',false);
    var ac=desdeAcuerdoManualV612(original);if(ac)return ac
  }

  return resultadoManualV612('PARTICULARES','PARTICULARES','No se encontró una relación empresarial segura',true)
}
function pintarRelacionManualV612(r){
  var box=$('manualBiofileBox');if(!box)return;var d=datosRelacionManualV612(r);
  $('manualAcuerdoBiofile').textContent=d.acuerdo;$('manualMisionBiofile').textContent=d.mision;box.classList.toggle('fallback',d.fallback);
  $('manualRelacionNota').textContent=d.fallback
    ?'⚠ No se identificó una relación segura. Para este ingreso manual use PARTICULARES en los dos campos de BIOFILE.'
    :'✓ Relación lista para copiar. Origen: '+d.fuente+'. Escriba cada nombre y seleccione la sugerencia de BIOFILE.';
  var copiar=async function(valor,mensaje){try{await navigator.clipboard.writeText(valor);toast(mensaje,'ok')}catch{toast('No se pudo copiar.','err')}};
  $('btnCopiarAcuerdoManual').onclick=function(){copiar(d.acuerdo,'Acuerdo Comercial copiado.')};
  $('btnCopiarMisionManual').onclick=function(){copiar(d.mision,'Empresa en Misión copiada.')};
  $('btnCopiarRelacionManual').onclick=function(){copiar('Nombre del Acuerdo Comercial, Contrato o Convenio: '+d.acuerdo+'\nNombre de la Empresa en Misión: '+d.mision,'Acuerdo y Empresa en Misión copiados.')}
}
`;
html = html.slice(0, idx) + helper + html.slice(idx);

const mostrar = 'async function mostrarManual(){';
if (!html.includes(mostrar)) throw new Error('No se encontró mostrarManual().');
html = html.replace(mostrar, "async function mostrarManual(){pintarRelacionManualV612(actual);");

if (!html.includes('PANEL_MANUAL_RELACION_V612') ||
    !html.includes('manualAcuerdoBiofile') ||
    !html.includes('manualMisionBiofile') ||
    !html.includes('pintarRelacionManualV612(actual)') ||
    !html.includes('No se identificó una relación segura')) {
  throw new Error('La ayuda de Acuerdo/Misión para ingreso manual v6.12 quedó incompleta.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Panel] v6.12: el ingreso manual muestra primero Acuerdo Comercial y después Empresa en Misión, con botones de copia y fallback PARTICULARES.');
