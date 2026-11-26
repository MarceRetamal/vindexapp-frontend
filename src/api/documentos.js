import { pedido, ESTUDIO_ID } from './http';
export const CATEGORIAS = [
    { valor: 'escrito_judicial', etiqueta: 'Escrito judicial' },
    { valor: 'resolucion', etiqueta: 'Resolución' },
    { valor: 'presupuesto', etiqueta: 'Presupuesto' },
    { valor: 'estrategia', etiqueta: 'Estrategia' },
    { valor: 'planilla', etiqueta: 'Planilla' },
    { valor: 'template', etiqueta: 'Template' },
    { valor: 'factura', etiqueta: 'Factura' },
    { valor: 'captura', etiqueta: 'Captura' },
    { valor: 'otro', etiqueta: 'Otro' },
];
export const CODIGOS = {
    escrito_judicial: 'ESC',
    resolucion: 'RES',
    presupuesto: 'PRE',
    estrategia: 'EST',
    planilla: 'PLA',
    template: 'TPL',
    factura: 'FAC',
    captura: 'CAP',
    otro: 'OTR',
};
export function listarDocumentos(params) {
    const query = new URLSearchParams({ estudio_id: ESTUDIO_ID });
    if (params.expediente_id)
        query.set('expediente_id', params.expediente_id);
    if (params.cliente_id)
        query.set('cliente_id', params.cliente_id);
    return pedido(`/documentos?${query.toString()}`);
}
export async function subirDocumento(opciones) {
    const { archivo, categoria, expedienteId, clienteId, notas, onProgreso } = opciones;
    // Paso 1: pedir URL firmada de subida.
    const solicitud = await pedido('/documentos/solicitar-subida', {
        method: 'POST',
        body: JSON.stringify({
            estudio_id: ESTUDIO_ID,
            categoria,
            nombre_archivo: archivo.name,
            content_type: archivo.type || 'application/octet-stream',
        }),
    });
    // Paso 2: PUT directo a R2. Va por fuera de `pedido` porque es otro origen,
    // no lleva Content-Type: application/json, y acá sí queremos progreso real.
    await subirConProgreso(solicitud.url_subida, archivo, onProgreso);
    // Paso 3: confirmar subida y dar de alta el registro en D1.
    const confirmado = await pedido('/documentos/confirmar-subida', {
        method: 'POST',
        body: JSON.stringify({
            id: solicitud.id,
            estudio_id: ESTUDIO_ID,
            categoria,
            nombre_archivo: archivo.name,
            ruta_r2: solicitud.ruta_r2,
            cliente_id: clienteId,
            expediente_id: expedienteId,
            notas,
        }),
    });
    // El backend no devuelve extension/notas/creado_en en la confirmación:
    // se completan acá para reflejar la ficha de inmediato sin refetch.
    return {
        ...confirmado,
        extension: archivo.name.includes('.')
            ? archivo.name.split('.').pop().toLowerCase()
            : 'sin_extension',
        notas: notas ?? null,
        creado_en: Date.now(),
    };
}
function subirConProgreso(url, archivo, onProgreso) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', archivo.type || 'application/octet-stream');
        xhr.upload.onprogress = (evento) => {
            if (evento.lengthComputable && onProgreso)
                onProgreso(evento.loaded / evento.total);
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300)
                resolve();
            else
                reject(new Error(`Error ${xhr.status} al subir el archivo a almacenamiento.`));
        };
        xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'));
        xhr.send(archivo);
    });
}
export function eliminarDocumento(id) {
    const query = new URLSearchParams({ estudio_id: ESTUDIO_ID });
    return pedido(`/documentos/${id}?${query.toString()}`, {
        method: 'DELETE',
    });
}
export function pedirDescarga(id) {
    const query = new URLSearchParams({ estudio_id: ESTUDIO_ID });
    return pedido(`/documentos/${id}/descargar?${query.toString()}`);
}
