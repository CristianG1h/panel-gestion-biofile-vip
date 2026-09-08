import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');
const MARCA = '/* PANEL_RELACION_PLACEHOLDER_V73 */';

if (html.includes(MARCA)) {
  console.log('[Panel] Relación empresarial v7.3 ya instalada.');
  process.exit(0);
}
if (!html.includes('/* PANEL_AUDITORIA_RELACION_V610 */') ||
    !html.includes('/* PANEL_MANUAL_RELACION_V612 */') ||
    !html.includes('/* PANEL_CATALOGO_PAQUETES_V7 */')) {
  throw new Error('Primero deben aplicarse relación v6.10, manual v6.12 y catálogo v7.');
}

function reemplazarEntre(texto, inicio, fin, nuevo, etiqueta) {
  const a = texto.indexOf(inicio);
  const b = texto.indexOf(fin, a + inicio.length);
  if (a < 0 || b < 0) throw new Error('No se encontró ' + etiqueta + '.');
  return texto.slice(0, a) + nuevo + texto.slice(b);
}

const datosNuevo = String.raw`${MARCA}
function esPlaceholderRelacionV73(valor){
  var k=claveRelacionV67(valor);
  return k===claveRelacionV67('PARTICULARES')||k===claveRelacionV67('PARTICULAR')
}
function recuperarDesdeMisionV73(mision,fuente){
  if(!mision||esPlaceholderRelacionV73(mision))return null;
  var exacta=resolverExactaV67(mision);
  if(!exacta||!exacta.principal||!exacta.mision)return null;
  return resultadoManualV612(exacta.principal,exacta.mision,fuente||'Empresa en misión recuperada por catálogo',false)
}
function datosRelacionManualV612(r){
  if(!r)return resultadoManualV612('PARTICULARES','PARTICULARES','Sin registro',true);

  var acuerdoFila=limpiar(r['Acuerdo comercial']||r['Acuerdo Comercial']||r['Nombre del Acuerdo Comercial, Contrato o Convenio']);
  var misionFila=limpiar(r['Empresa en misión']||r['Empresa en Misión']||r['Nombre de la Empresa en Misión']);
  var original=limpiar(r['Empresa registrada (original)'])||misionFila;

  var acuerdoAplicado=limpiar(r['ACUERDO_COMERCIAL_BIOFILE']);
  var misionAplicada=limpiar(r['EMPRESA_MISION_BIOFILE']);
  var origenAplicado=limpiar(r['ORIGEN_RELACION_EMPRESA']);

  if(acuerdoAplicado||misionAplicada){
    var aPart=esPlaceholderRelacionV73(acuerdoAplicado);
    var mPart=esPlaceholderRelacionV73(misionAplicada);
    var recuperada=null;

    if(aPart&&!mPart) recuperada=recuperarDesdeMisionV73(misionAplicada,'Relación esperada por catálogo');
    if(!recuperada&&aPart&&mPart&&misionFila&&!esPlaceholderRelacionV73(misionFila)) {
      recuperada=recuperarDesdeMisionV73(misionFila,'Relación esperada desde la empresa original');
    }
    if(!recuperada&&!aPart&&mPart){
      recuperada=desdeAcuerdoManualV612(acuerdoAplicado);
      if(recuperada) recuperada.fuente='Relación esperada desde el Acuerdo aplicado';
    }

    if(recuperada){
      recuperada.inconsistente=true;
      recuperada.aplicada=true;
      recuperada.acuerdoAplicado=acuerdoAplicado||'—';
      recuperada.misionAplicada=misionAplicada||'—';
      return recuperada
    }

    var aplicada=resultadoManualV612(
      acuerdoAplicado||misionAplicada,
      misionAplicada||acuerdoAplicado,
      /FALLBACK/i.test(origenAplicado)?'Fallback confirmado por BIOFILE':'Confirmado por BIOFILE',
      /FALLBACK/i.test(origenAplicado)
    );
    aplicada.aplicada=true;
    return aplicada
  }

  var acuerdo=acuerdoFila;
  var mision=misionFila;

  if(acuerdo&&mision){
    var acuerdoPart=esPlaceholderRelacionV73(acuerdo);
    var misionPart=esPlaceholderRelacionV73(mision);

    if(acuerdoPart&&!misionPart){
      var porMision=recuperarDesdeMisionV73(mision,'Empresa en misión validada; Acuerdo PARTICULARES ignorado');
      if(porMision)return porMision
    }
    if(!acuerdoPart&&misionPart){
      var porAcuerdo=desdeAcuerdoManualV612(acuerdo);
      if(porAcuerdo){porAcuerdo.fuente='Acuerdo validado; Misión PARTICULARES ignorada';return porAcuerdo}
    }

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
`;
html = reemplazarEntre(
  html,
  'function datosRelacionManualV612(r){',
  'function pintarRelacionManualV612(r){',
  datosNuevo,
  'datosRelacionManualV612'
);

const pintarNuevo = String.raw`function pintarRelacionManualV612(r){
  var box=$('manualBiofileBox');if(!box)return;var d=datosRelacionManualV612(r);
  $('manualAcuerdoBiofile').textContent=d.acuerdo;$('manualMisionBiofile').textContent=d.mision;box.classList.toggle('fallback',d.fallback||d.inconsistente);
  if(d.inconsistente){
    $('manualRelacionNota').textContent='⚠ El registro histórico quedó con una relación empresarial inconsistente (Acuerdo: '+(d.acuerdoAplicado||'—')+' / Misión: '+(d.misionAplicada||'—')+'). El catálogo indica '+d.acuerdo+' / '+d.mision+'. Revise esa O.S. en BIOFILE antes de usarla como referencia.';
  }else{
    $('manualRelacionNota').textContent=d.fallback
      ?'⚠ No se identificó una relación segura. Para este ingreso manual use PARTICULARES en los dos campos de BIOFILE.'
      :'✓ Relación lista para copiar. Origen: '+d.fuente+'. Escriba cada nombre y seleccione la sugerencia de BIOFILE.';
  }
  var copiar=async function(valor,mensaje){try{await navigator.clipboard.writeText(valor);toast(mensaje,'ok')}catch{toast('No se pudo copiar.','err')}};
  $('btnCopiarAcuerdoManual').onclick=function(){copiar(d.acuerdo,'Acuerdo Comercial copiado.')};
  $('btnCopiarMisionManual').onclick=function(){copiar(d.mision,'Empresa en Misión copiada.')};
  $('btnCopiarRelacionManual').onclick=function(){copiar('Nombre del Acuerdo Comercial, Contrato o Convenio: '+d.acuerdo+'\nNombre de la Empresa en Misión: '+d.mision,'Acuerdo y Empresa en Misión copiados.')}
}
`;
html = reemplazarEntre(
  html,
  'function pintarRelacionManualV612(r){',
  'function pintar(){',
  pintarNuevo,
  'pintarRelacionManualV612'
);

const metaNuevo = String.raw`function metaEmpresaPanelV69(r){
  var acuerdoAplicado=limpiar(r&&r['ACUERDO_COMERCIAL_BIOFILE']);
  var misionAplicada=limpiar(r&&r['EMPRESA_MISION_BIOFILE']);
  var origenAplicado=limpiar(r&&r['ORIGEN_RELACION_EMPRESA']);
  var original=limpiar(r&&r['Empresa en misión']);
  if(acuerdoAplicado||misionAplicada){
    var aPart=esPlaceholderRelacionV73(acuerdoAplicado),mPart=esPlaceholderRelacionV73(misionAplicada);
    var originalReal=original&&!esPlaceholderRelacionV73(original)&&!!resolverExactaV67(original);
    return{
      acuerdo:acuerdoAplicado||misionAplicada,
      mision:misionAplicada||'',
      original:original,
      relacion:true,
      aplicada:true,
      fallback:/FALLBACK/i.test(origenAplicado),
      inconsistente:(!!acuerdoAplicado&&!!misionAplicada&&aPart!==mPart)||(aPart&&mPart&&originalReal),
      origen:origenAplicado||'BIOFILE'
    };
  }

  if(!original)return{acuerdo:'',mision:'',original:'',relacion:false,aplicada:false,fallback:false,inconsistente:false,origen:''};
  var key=claveEmpresaPanelV69(original);
  if(EMPRESA_META_PANEL_V69.has(key))return EMPRESA_META_PANEL_V69.get(key);
  var meta={acuerdo:original,mision:'',original:original,relacion:false,aplicada:false,fallback:false,inconsistente:false,origen:'CATALOGO_V27'};
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
html = reemplazarEntre(
  html,
  'function metaEmpresaPanelV69(r){',
  'function badgesEmpresaPanelV69(r){',
  metaNuevo,
  'metaEmpresaPanelV69'
);

const badgesNuevo = String.raw`function badgesEmpresaPanelV69(r){
  var m=metaEmpresaPanelV69(r);if(!m.acuerdo)return'';
  var out='<span class="badge">🏢 Acuerdo: '+esc(m.acuerdo)+'</span>';
  if(m.mision)out+='<span class="badge">👥 Misión: '+esc(m.mision)+'</span>';
  if(m.aplicada&&m.inconsistente)out+='<span class="badge err">⚠ Relación inconsistente</span>';
  else if(m.aplicada&&m.fallback)out+='<span class="badge err">⚠ Fallback PARTICULARES</span>';
  else if(m.aplicada)out+='<span class="badge ok">✓ Relación aplicada</span>';
  return out;
}
`;
html = reemplazarEntre(
  html,
  'function badgesEmpresaPanelV69(r){',
  'function filaRelacionPanelV69(',
  badgesNuevo,
  'badgesEmpresaPanelV69'
);

if (!html.includes('PANEL_RELACION_PLACEHOLDER_V73') ||
    !html.includes('Empresa en misión validada; Acuerdo PARTICULARES ignorado') ||
    !html.includes('Relación inconsistente')) {
  throw new Error('La corrección v7.3 quedó incompleta.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Panel] v7.3: PARTICULARES ya no oculta una Empresa en misión válida y los históricos inconsistentes quedan señalados.');
