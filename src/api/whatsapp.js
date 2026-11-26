import { pedido } from './http';
export const CATEGORIAS_DOCUMENTO = [
    { valor: 'otro', texto: 'Otro' },
    { valor: 'captura', texto: 'Captura o foto' },
    { valor: 'resolucion', texto: 'Resolución o cédula' },
    { valor: 'escrito_judicial', texto: 'Escrito judicial' },
    { valor: 'planilla', texto: 'Planilla' },
    { valor: 'factura', texto: 'Factura o recibo' },
];
const tel = (t) => encodeURIComponent(t);
export const api = {
    listar: (q = '') => pedido(`/whatsapp/conversaciones${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    abrir: (t) => pedido(`/whatsapp/conversaciones/${tel(t)}`),
    responder: (t, texto) => pedido(`/whatsapp/conversaciones/${tel(t)}/mensajes`, { method: 'POST', body: JSON.stringify({ texto }) }),
    asistente: (t, activo) => pedido(`/whatsapp/conversaciones/${tel(t)}/asistente`, { method: 'POST', body: JSON.stringify({ activo }) }),
    vincular: (t, datos) => pedido(`/whatsapp/conversaciones/${tel(t)}`, { method: 'PATCH', body: JSON.stringify(datos) }),
    crearCliente: (t, datos = {}) => pedido(`/whatsapp/conversaciones/${tel(t)}/crear-cliente`, { method: 'POST', body: JSON.stringify(datos) }),
    adjunto: (id) => pedido(`/whatsapp/mensajes/${encodeURIComponent(id)}/adjunto`),
    guardarDocumento: (id, datos) => pedido(`/whatsapp/mensajes/${encodeURIComponent(id)}/documento`, { method: 'POST', body: JSON.stringify(datos) }),
};
export const CATEGORIAS_PLANTILLA = [
    { valor: 'evaluacion', texto: 'Evaluación' },
    { valor: 'presupuesto', texto: 'Presupuesto' },
    { valor: 'documentacion', texto: 'Documentación' },
    { valor: 'reunion', texto: 'Reunión' },
    { valor: 'seguimiento', texto: 'Seguimiento' },
    { valor: 'honorarios', texto: 'Honorarios' },
    { valor: 'otra', texto: 'Otra' },
];
export const apiPlantillas = {
    listar: () => pedido('/whatsapp/plantillas'),
    crear: (d) => pedido('/whatsapp/plantillas', { method: 'POST', body: JSON.stringify(d) }),
    editar: (id, d) => pedido(`/whatsapp/plantillas/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(d) }),
    borrar: (id) => pedido(`/whatsapp/plantillas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    usar: (id) => pedido(`/whatsapp/plantillas/${encodeURIComponent(id)}/uso`, { method: 'POST' }),
};
