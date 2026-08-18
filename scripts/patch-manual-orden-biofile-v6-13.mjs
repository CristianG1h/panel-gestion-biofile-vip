import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (html.includes('/* PANEL_MANUAL_ORDEN_BIOFILE_V613 */')) {
  console.log('[Panel] Orden manual BIOFILE v6.13 ya instalado.');
  process.exit(0);
}
if (!html.includes('/* PANEL_MANUAL_RELACION_V612 */')) {
  throw new Error('Primero debe ejecutarse patch-manual-relacion-biofile-v6-12.mjs.');
}

const css = `
/* PANEL_MANUAL_ORDEN_BIOFILE_V613 */
#manualBiofileBox{display:none!important}
.manualOrdenIntro{margin:0 0 12px;padding:12px 13px;border:1.5px solid #9FC6E7;border-radius:11px;background:#F7FBFF;color:#36566D;font-size:12px;line-height:1.45}
.manualOrdenIntro b{display:block;color:#0B4B7F;font-size:13px;margin-bottom:3px}
.manualOrdenGrupo{border:1px solid var(--borde);border-radius:11px;overflow:hidden;margin:0 0 12px;background:var(--panel)}
.manualOrdenTitulo{padding:10px 12px;background:#E7F2FF;color:#0B4B7F;font-size:12px;font-weight:900;border-bottom:1px solid #C9DDED}
.manualOrdenFila{display:grid;grid-template-columns:38px minmax(0,1fr) auto auto;gap:9px;align-items:center;padding:10px 11px;border-top:1px solid var(--borde)}
.manualOrdenFila:first-of-type{border-top:0}
.manualOrdenPaso{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#0B5FA5;color:#fff;font-weight:900;font-size:11px}
.manualOrdenDato small{display:flex;gap:6px;align-items:center;flex-wrap:wrap;color:#647787;font-size:10px;font-weight:850;margin-bottom:3px;line-height:1.3}
.manualOrdenDato strong{display:block;color:#17364F;font-size:13px;line-height:1.35;word-break:break-word}
.manualOrdenDato strong.vacio{font-style:italic;color:#7B8792;font-weight:600}
.manualTag{font-size:9px;padding:2px 6px;border-radius:99px;background:#F0E8FF;color:#57358A;border:1px solid #CFBDF0;font-weight:900}
.manualTag.verificar{background:#FFF4CF;color:#755A0A;border-color:#E3C86A}
.manualOrdenFila.relacion{background:#F7FBFF}
.manualOrdenFila.relacion .manualOrdenPaso{background:#6A4AA0}
.manualOrdenFila.default{background:#FAFCFE}
html[data-theme="dark"] .manualOrdenIntro{background:#10283A;border-color:#3E7BA8;color:#B8D0E1}html[data-theme="dark"] .manualOrdenIntro b{color:#F3FAFF}
html[data-theme="dark"] .manualOrdenGrupo{background:#0F202E;border-color:#355168}
html[data-theme="dark"] .manualOrdenTitulo{background:#173A56;color:#F3FAFF;border-color:#355168}
html[data-theme="dark"] .manualOrdenFila{border-color:#29465C}html[data-theme="dark"] .manualOrdenFila.relacion{background:#14283A}html[data-theme="dark"] .manualOrdenFila.default{background:#102330}
html[data-theme="dark"] .manualOrdenDato small{color:#9FB7C9}html[data-theme="dark"] .manualOrdenDato strong{color:#FFFFFF}html[data-theme="dark"] .manualOrdenDato strong.vacio{color:#9BA9B5}
html[data-theme="dark"] .manualTag{background:#493465;color:#FBF6FF;border-color:#76559A}html[data-theme="dark"] .manualTag.verificar{background:#4A3D18;color:#FFE7A0;border-color:#8C722A}
@media(max-width:700px){.manualOrdenFila{grid-template-columns:32px 1fr}.manualOrdenFila .btn{grid-column:2;justify-self:start}.manualOrdenFila .editar{margin-left:4px}}
`;
const styleEnd = html.indexOf('</style>');
if (styleEnd < 0) throw new Error('No se encontró </style>.');
html = html.slice(0, styleEnd) + css + html.slice(styleEnd);

const inicio = html.indexOf('function pintarDatos(r){');
const fin = html.indexOf('async function guardarCampo(', inicio);
if (inicio < 0 || fin < 0) throw new Error('No se encontró pintarDatos()/guardarCampo() para reemplazar la vista manual.');

const nuevo = String.raw`
const SECUENCIA_BIOFILE_MANUAL_V613=[
  {g:'Datos Personales',c:'Tipo doc',e:'Tipo'},
  {g:'Datos Personales',c:'N° documento',e:'N°. de Identificación'},
  {g:'Datos Personales',c:'Ciudad nacimiento',e:'Ciudad de Nacimiento',a:true},
  {g:'Datos Personales',c:'Fecha nacimiento',e:'Fecha de Nacimiento'},
  {g:'Datos Personales',c:'Primer apellido',e:'Primer Apellido'},
  {g:'Datos Personales',c:'Segundo apellido',e:'Segundo Apellido'},
  {g:'Datos Personales',c:'Primer nombre',e:'Primer Nombre'},
  {g:'Datos Personales',c:'Otros nombres',e:'Otros Nombres'},
  {g:'Datos Personales',c:'Género',e:'Género'},
  {g:'Datos Personales',c:'Estado civil',e:'Estado Civil'},
  {g:'Datos Personales',c:'Nivel educativo',e:'Nivel Educativo'},
  {g:'Datos Personales',c:'Correo',e:'Correo Electrónico'},

  {g:'Datos de Ubicación',c:'Zona',e:'Zona',d:'URBANA'},
  {g:'Datos de Ubicación',c:'Dirección',e:'Dirección'},
  {g:'Datos de Ubicación',c:'Barrio',e:'Barrio'},
  {g:'Datos de Ubicación',c:'Localidad',e:'Localidad',a:true},
  {g:'Datos de Ubicación',c:'Sede',e:'Sede'},
  {g:'Datos de Ubicación',c:'Estrato',e:'Estrato',d:'1'},
  {g:'Datos de Ubicación',c:'__municipioBiofile',e:'Municipio',d:'BOGOTÁ (BOGOTÁ D.C., COLOMBIA)',v:true},
  {g:'Datos de Ubicación',c:'Celular',e:'Celulares'},
  {g:'Datos de Ubicación',c:'Teléfono fijo',e:'Teléfonos'},

  {g:'Datos de Trabajo',c:'Profesión o cargo',e:'Profesión o Cargo',d:'NO REFIERE'},
  {g:'Datos de Trabajo',c:'Funciones del cargo',e:'Funciones del Cargo',d:'__profesion'},
  {g:'Datos de Trabajo',c:'__tipoEvaluacion',e:'Tipo de Evaluación Médica o Procedimiento',d:'EVALUACIÓN MÉDICA OCUPACIONAL DE INGRESO',a:true},
  {g:'Datos de Trabajo',c:'__acuerdo',e:'Nombre del Acuerdo Comercial, Contrato o Convenio',r:true,a:true},
  {g:'Datos de Trabajo',c:'__mision',e:'Nombre de la Empresa en Misión',r:true,a:true},
  {g:'Datos de Trabajo',c:'__paquete',e:'Nombre del Paquete',d:'NO APLICA',a:true},
  {g:'Datos de Trabajo',c:'EPS',e:'Eps',d:'NO REFIERE'},
  {g:'Datos de Trabajo',c:'AFP',e:'Afp',d:'NO REFIERE'},
  {g:'Datos de Trabajo',c:'ARL',e:'Arl',d:'NO REFIERE'},
  {g:'Datos de Trabajo',c:'__diagnostico',e:'Diagnóstico CIE-10',d:'Z100'},
  {g:'Datos de Trabajo',c:'__tipoVinculacion',e:'Tipo de vinculación',d:'CONTRIBUTIVO'},
  {g:'Datos de Trabajo',c:'__tipoAfiliado',e:'Tipo Afiliado',d:'COTIZANTE'},
  {g:'Datos de Trabajo',c:'__nivel',e:'Nivel',d:'2'}
];
function primeroManualV613(r,nombres){for(var i=0;i<nombres.length;i++){var v=limpiar(r&&r[nombres[i]]);if(v)return v}return''}
function valorPasoManualV613(r,p,rel){
  if(p.c==='__acuerdo')return rel.acuerdo;
  if(p.c==='__mision')return rel.mision;
  if(p.c==='__municipioBiofile')return p.d;
  if(p.c==='__tipoEvaluacion')return primeroManualV613(r,['Tipo de Evaluación Médica o Procedimiento','Tipo evaluación','Tipo Evaluación'])||p.d;
  if(p.c==='__paquete')return primeroManualV613(r,['Nombre del Paquete','Paquete'])||p.d;
  if(p.c==='__diagnostico')return primeroManualV613(r,['Diagnóstico CIE-10','Diagnostico CIE-10'])||p.d;
  if(p.c==='__tipoVinculacion')return primeroManualV613(r,['Tipo de vinculación','Tipo vinculación'])||p.d;
  if(p.c==='__tipoAfiliado')return primeroManualV613(r,['Tipo Afiliado','Tipo afiliado'])||p.d;
  if(p.c==='__nivel')return primeroManualV613(r,['Nivel'])||p.d;
  if(p.c==='Funciones del cargo')return primeroManualV613(r,['Funciones del cargo'])||primeroManualV613(r,['Profesión o cargo'])||'NO REFIERE';
  var v=valorCampo(r,p.c);
  if(v)return v;
  if(p.d==='__profesion')return primeroManualV613(r,['Profesión o cargo'])||'NO REFIERE';
  return p.d||''
}
function esEditableManualV613(p){return !!p.c&&!p.c.startsWith('__')&&!["Localidad","Sede"].includes(p.c)}
function pintarDatos(r){
  const cont=$('tablaDatos');cont.innerHTML='';
  const rel=datosRelacionManualV612(r);
  const intro=document.createElement('div');intro.className='manualOrdenIntro';
  intro.innerHTML='<b>📋 Secuencia para ingreso manual en BIOFILE</b>Siga esta lista <b style="display:inline;color:inherit">de arriba hacia abajo</b>, igual que el formulario de BIOFILE. En los campos marcados como <b style="display:inline;color:inherit">AUTOCOMPLETADO</b>, pegue/escriba el valor y luego seleccione la opción que aparezca.';
  cont.appendChild(intro);

  let grupo='';let box=null;let paso=0;const copia=[];
  SECUENCIA_BIOFILE_MANUAL_V613.forEach(function(p){
    if(p.g!==grupo){grupo=p.g;box=document.createElement('div');box.className='manualOrdenGrupo';box.innerHTML='<div class="manualOrdenTitulo">'+esc(grupo)+'</div>';cont.appendChild(box)}
    paso++;
    const valor=valorPasoManualV613(r,p,rel);
    copia.push(grupo+' | '+p.e+': '+(valor||'No indicado'));
    const fila=document.createElement('div');fila.className='manualOrdenFila'+(p.r?' relacion':'')+(p.c.startsWith('__')&&!p.r?' default':'');
    const tags=(p.a?'<span class="manualTag">AUTOCOMPLETADO</span>':'')+(p.v?'<span class="manualTag verificar">SOLO VERIFICAR</span>':'');
    fila.innerHTML='<div class="manualOrdenPaso">'+paso+'</div><div class="manualOrdenDato"><small>'+esc(p.e)+tags+'</small><strong class="'+(valor?'':'vacio')+'">'+esc(valor||'No indicado')+'</strong></div><button class="btn gris sm copiar">Copiar</button>'+(esEditableManualV613(p)?'<button class="btn azul sm editar" title="Editar y guardar en Google Sheets">✏️</button>':'<span></span>');
    fila.querySelector('.copiar').onclick=async()=>{try{await navigator.clipboard.writeText(valor||'');toast(p.e+' copiado.','ok')}catch{toast('No se pudo copiar.','err')}};
    const editar=fila.querySelector('.editar');if(editar)editar.onclick=()=>editarCampo(r,p.c,p.e,valor);
    box.appendChild(fila)
  });
  const btn=$('btnCopiarTodo');if(btn){btn.textContent='📋 Copiar guía completa';btn.onclick=async()=>{try{await navigator.clipboard.writeText(copia.join('\n'));toast('Guía BIOFILE copiada en el orden correcto.','ok')}catch{toast('No se pudo copiar.','err')}}}
}
`;

html = html.slice(0, inicio) + nuevo + html.slice(fin);

if (!html.includes('PANEL_MANUAL_ORDEN_BIOFILE_V613') ||
    !html.includes('SECUENCIA_BIOFILE_MANUAL_V613') ||
    !html.includes('Nombre del Acuerdo Comercial, Contrato o Convenio') ||
    !html.includes('Nombre de la Empresa en Misión') ||
    !html.includes('Diagnóstico CIE-10') ||
    !html.includes('Tipo de vinculación') ||
    !html.includes('Siga esta lista')) {
  throw new Error('La secuencia manual BIOFILE v6.13 quedó incompleta.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Panel] v6.13: ingreso manual ordenado exactamente de arriba hacia abajo como el formulario de BIOFILE.');
