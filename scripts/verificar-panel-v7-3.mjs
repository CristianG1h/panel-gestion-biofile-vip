import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app-v3.html', import.meta.url), 'utf8');
const superadmin = fs.readFileSync(new URL('../superadmin.html', import.meta.url), 'utf8');

function exigir(texto, patron, etiqueta) {
  if (!texto.includes(patron)) {
    throw new Error(`Falta validación: ${etiqueta} (${patron})`);
  }
}

function prohibir(texto, patron, etiqueta) {
  if (texto.includes(patron)) {
    throw new Error(`Sigue presente patrón prohibido: ${etiqueta} (${patron})`);
  }
}

const requeridosApp = [
  ['PANEL_SEGURIDAD_V6', 'seguridad v6'],
  ['PANEL_SEGURIDAD_V61', 'seguridad v6.1'],
  ['FECHA_OPERATIVA_PANEL_V63', 'fecha operativa'],
  ['FECHA_BIOFILE_ISO', 'fecha BIOFILE ISO'],
  ['/api/registros/listar', 'listado autenticado'],
  ['fila:filaDe', 'fila exacta'],
  ['REVISAR_BIOFILE', 'estado revisión'],
  ['REPORTE_EMPRESAS_RELACIONES_EXCEL_V66', 'relaciones Excel'],
  ['REPORTE_ACUERDO_MISION_V67', 'Acuerdo/Misión v6.7'],
  ['REPORTE_CACHE_INCREMENTAL_V68', 'cache v6.8'],
  ['PANEL_ACUERDO_MISION_V69', 'panel relación v6.9'],
  ['PANEL_AUDITORIA_RELACION_V610', 'auditoría relación v6.10'],
  ['PANEL_CONTRASTE_RELACION_V611', 'contraste relación v6.11'],
  ['PANEL_MANUAL_RELACION_V612', 'manual relación v6.12'],
  ['PANEL_MANUAL_ORDEN_BIOFILE_V613', 'orden manual v6.13'],
  ['PANEL_CATALOGO_PAQUETES_V7', 'catálogo paquetes v7'],
  ['FIX_MANUAL_RACE_V72', 'carrera manual v7.2'],
  ['PANEL_RELACION_PLACEHOLDER_V73', 'placeholder relación v7.3'],
  ['Empresa en misión validada; Acuerdo PARTICULARES ignorado', 'recuperación desde misión'],
  ['Relación inconsistente', 'alerta histórica de relación'],
  ['const registroManual=actual;', 'referencia segura manual'],
  ["registroManual['ESTADO_BIOFILE']='COMPLETADO'", 'actualización manual segura'],
  ['autoEmpresaV7', 'empresa automática'],
  ['autoTipoV7', 'tipo automático'],
  ['autoPaqueteV7', 'paquete automático'],
  ['/api/catalogo/empresa', 'API catálogo'],
  ['SECUENCIA_BIOFILE_MANUAL_V613', 'secuencia manual'],
  ['Secuencia para ingreso manual en BIOFILE', 'guía manual'],
  ['Tipo de Evaluación Médica o Procedimiento', 'tipo evaluación'],
  ['Nombre del Acuerdo Comercial, Contrato o Convenio', 'campo Acuerdo'],
  ['Nombre de la Empresa en Misión', 'campo Misión'],
  ['Nombre del Paquete', 'campo paquete'],
  ['Diagnóstico CIE-10', 'diagnóstico'],
  ['Tipo de vinculación', 'tipo vinculación'],
  ['empresa-acuerdo', 'clase acuerdo'],
  ['empresa-mision', 'clase misión'],
  ['ACUERDO_COMERCIAL_BIOFILE', 'auditoría Acuerdo'],
  ['EMPRESA_MISION_BIOFILE', 'auditoría Misión'],
  ['ORIGEN_RELACION_EMPRESA', 'origen relación'],
  ['Fallback PARTICULARES', 'fallback visible'],
  ['badgesEmpresaPanelV69', 'badges relación'],
  ['VIP_REPORTE_EMPRESA_', 'reporte empresa'],
  ['ELIMINADO_POR_VISIBLE_V65', 'eliminado por'],
  ['TEXTILES 1X1', 'catálogo TEXTILES 1X1'],
  ['MEDYSCOL', 'catálogo MEDYSCOL'],
  ['GESTLAB S.A.S', 'catálogo GESTLAB'],
  ['COMFICA COLOMBIA S.A.S.', 'catálogo COMFICA']
];

for (const [patron, etiqueta] of requeridosApp) exigir(app, patron, etiqueta);

exigir(superadmin, 'SUPERADMIN_LAB_CATALOGO_V71', 'laboratorio catálogo superadmin');
exigir(superadmin, '/api/superadmin/catalogo/probar', 'API prueba catálogo superadmin');
exigir(superadmin, 'labProbarGuardar', 'botón guardar prueba catálogo');

prohibir(app, "});actual['ESTADO_BIOFILE']='COMPLETADO'", 'carrera manual antigua');
prohibir(app, 'const CLAVE_CONSULTA="vip2026"', 'clave de consulta expuesta');

console.log('[CI] Panel BIOFILE v7.3 validado correctamente.');
