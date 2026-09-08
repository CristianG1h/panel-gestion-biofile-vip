import fs from 'node:fs';

const appPath = new URL('../app-v3.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

const MARCADOR = '/* FIX_MANUAL_RACE_V72 */';
if (html.includes(MARCADOR)) {
  console.log('[Panel] Protección de carrera del ingreso manual v7.2 ya instalada.');
  process.exit(0);
}

const inicio = html.indexOf("$('btnManualCompleto').onclick=async()=>{");
const fin = html.indexOf('function fechasRango(m){', inicio);

if (inicio < 0 || fin < 0) {
  throw new Error('No se encontró el controlador de ingreso manual para aplicar la protección v7.2.');
}

const seguro = `${MARCADOR}
$('btnManualCompleto').onclick=async()=>{
  if(!actual)return;

  // Captura el registro antes del await. El usuario puede pulsar “Volver”
  // mientras Render/Google Sheets termina de guardar el ingreso manual; en ese
  // caso la variable global actual pasa a null y no debe usarse después.
  const registroManual=actual;
  const documentoManual=doc(registroManual);
  const responsable=usuarioActual?.rol==='superadmin'?$('manualResponsable').value:usuarioActual.nombre;

  if(!responsable){
    toast('Seleccione el usuario responsable del ingreso.','err');
    return;
  }
  if(!confirm('Confirme que ya terminó el ingreso manual en BIOFILE. Se registrará a nombre de '+responsable+'.'))return;

  const b=$('btnManualCompleto');
  b.disabled=true;

  try{
    const{data}=await api('/api/registros/marcar-manual',{
      method:'POST',
      body:JSON.stringify({documento:documentoManual,usuarioResponsable:responsable})
    });

    // Se actualiza la referencia capturada, nunca la variable global `actual`,
    // porque puede ser null o corresponder a otro paciente cuando llega la respuesta.
    registroManual['ESTADO_BIOFILE']='COMPLETADO';
    registroManual['USUARIO_BIOFILE']=data.atribuidoA||responsable;
    registroManual['MODO_INGRESO_BIOFILE']='MANUAL';

    toast('Ingreso manual guardado a nombre de '+(data.atribuidoA||responsable)+'.','ok');
    await cargarRegistros(true);

    const fichaVisible=!$('ficha').classList.contains('oculto');
    const sigueMismoPaciente=Boolean(actual)&&doc(actual)===documentoManual;

    // Si el usuario sigue en la misma ficha, regresamos al listado.
    // Si ya volvió al panel principal, solo abrimos Ingresados.
    // Si abrió otro paciente, no alteramos su navegación.
    if(fichaVisible&&sigueMismoPaciente){
      $('btnVolver').click();
      activarTab('ingresado');
    }else if(!fichaVisible){
      activarTab('ingresado');
    }
  }catch(e){
    toast(e.message,'err');
  }finally{
    b.disabled=false;
  }
}
`;

html = html.slice(0, inicio) + seguro + html.slice(fin);

if (!html.includes(MARCADOR) ||
    !html.includes('const registroManual=actual;') ||
    !html.includes("registroManual['ESTADO_BIOFILE']='COMPLETADO'") ||
    html.includes("});actual['ESTADO_BIOFILE']='COMPLETADO'")) {
  throw new Error('La protección v7.2 del ingreso manual quedó incompleta.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Panel] v7.2: cerrar o cambiar de ficha durante un ingreso manual ya no provoca ESTADO_BIOFILE sobre null.');
