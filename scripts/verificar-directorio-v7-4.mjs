import fs from 'node:fs';
const html=fs.readFileSync(new URL('../superadmin.html',import.meta.url),'utf8');
const checks=[
 ['marca','SUPERADMIN_DIRECTORIO_EMPRESAS_V74'],
 ['total','Empresas guardadas internamente'],
 ['boton','btnActualizarDirectorio'],
 ['estado','/api/superadmin/directorio/estado'],
 ['sync','/api/superadmin/directorio/sincronizar'],
 ['carga','cargarDirectorioEmpresasV74']
];
for(const [n,p] of checks){if(!html.includes(p))throw new Error(`Falta ${n}: ${p}`)}
console.log('[Panel] Directorio empresas v7.4 verificado.');
