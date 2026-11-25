import { pedido } from './http';

export interface ConversacionResumen {
  telefono: string;
  nombre_perfil: string | null;
  nombre_completo: string | null;
  ultimo_texto: string | null;
  ultimo_ts: number | null;
  ultima_entrante_ts: number | null;
  no_leidos: number;
  /** null o 'inicio'… = lo atiende el asistente; 'derivado' = terminó la entrevista; 'humano' = lo atiende el abogado. */
  estado: string | null;
  tipo_contacto: string | null;
  area: string | null;
  urgente: number;
  es_propio: number;
  cliente_id: string | null;
  expediente_id: string | null;
  cliente_nombre: string | null;
  cliente_apellido: string | null;
  expediente_caratula: string | null;
}

export interface Conversacion extends ConversacionResumen {
  ficha: string;
  subtema: string | null;
  relato: string | null;
  ventana_abierta: boolean;
}

export interface MensajeWhatsApp {
  id: string;
  direccion: 'in' | 'out';
  tipo: string | null;
  texto: string | null;
  ts: number;
  estado: string | null;
  media_mime: string | null;
  media_nombre: string | null;
  tamano_bytes: number | null;
  documento_id: string | null;
  tiene_adjunto: number;
  adjunto_guardado: number;
}

export const CATEGORIAS_DOCUMENTO = [
  { valor: 'otro', texto: 'Otro' },
  { valor: 'captura', texto: 'Captura o foto' },
  { valor: 'resolucion', texto: 'Resolución o cédula' },
  { valor: 'escrito_judicial', texto: 'Escrito judicial' },
  { valor: 'planilla', texto: 'Planilla' },
  { valor: 'factura', texto: 'Factura o recibo' },
] as const;

const tel = (t: string) => encodeURIComponent(t);

export const api = {
  resumen: () => pedido<{ conversaciones: number; sin_leer: number }>('/whatsapp/resumen'),
  listar: (q = '') => pedido<{ conversaciones: ConversacionResumen[] }>(`/whatsapp/conversaciones${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  abrir: (t: string) => pedido<{ conversacion: Conversacion; mensajes: MensajeWhatsApp[] }>(`/whatsapp/conversaciones/${tel(t)}`),
  responder: (t: string, texto: string) => pedido<{ ok: true }>(`/whatsapp/conversaciones/${tel(t)}/mensajes`, { method: 'POST', body: JSON.stringify({ texto }) }),
  asistente: (t: string, activo: boolean) => pedido<{ ok: true }>(`/whatsapp/conversaciones/${tel(t)}/asistente`, { method: 'POST', body: JSON.stringify({ activo }) }),
  vincular: (t: string, datos: { cliente_id?: string | null; expediente_id?: string | null }) =>
    pedido<{ ok: true; cliente_id: string | null; expediente_id: string | null }>(`/whatsapp/conversaciones/${tel(t)}`, { method: 'PATCH', body: JSON.stringify(datos) }),
  crearCliente: (t: string, datos: { nombre?: string; apellido?: string } = {}) =>
    pedido<{ ok: true; cliente_id: string }>(`/whatsapp/conversaciones/${tel(t)}/crear-cliente`, { method: 'POST', body: JSON.stringify(datos) }),
  adjunto: (id: string) => pedido<{ url_descarga: string; nombre: string; tipo: string }>(`/whatsapp/mensajes/${encodeURIComponent(id)}/adjunto`),
  guardarDocumento: (id: string, datos: { cliente_id?: string; expediente_id?: string; categoria: string }) =>
    pedido<{ ok: true; documento_id: string }>(`/whatsapp/mensajes/${encodeURIComponent(id)}/documento`, { method: 'POST', body: JSON.stringify(datos) }),
};

export type CategoriaPlantilla = 'presupuesto' | 'evaluacion' | 'documentacion' | 'reunion' | 'seguimiento' | 'honorarios' | 'otra';

export const CATEGORIAS_PLANTILLA: { valor: CategoriaPlantilla; texto: string }[] = [
  { valor: 'evaluacion', texto: 'Evaluación' },
  { valor: 'presupuesto', texto: 'Presupuesto' },
  { valor: 'documentacion', texto: 'Documentación' },
  { valor: 'reunion', texto: 'Reunión' },
  { valor: 'seguimiento', texto: 'Seguimiento' },
  { valor: 'honorarios', texto: 'Honorarios' },
  { valor: 'otra', texto: 'Otra' },
];

export interface Plantilla {
  id: string;
  titulo: string;
  categoria: CategoriaPlantilla;
  texto: string;
  orden: number;
  usos: number;
}

export interface DatosPlantilla {
  titulo: string;
  categoria: CategoriaPlantilla;
  texto: string;
}

export const apiPlantillas = {
  listar: () => pedido<{ plantillas: Plantilla[] }>('/whatsapp/plantillas'),
  crear: (d: DatosPlantilla) => pedido<{ id: string }>('/whatsapp/plantillas', { method: 'POST', body: JSON.stringify(d) }),
  editar: (id: string, d: Partial<DatosPlantilla>) => pedido<{ ok: true }>(`/whatsapp/plantillas/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(d) }),
  borrar: (id: string) => pedido<{ ok: true }>(`/whatsapp/plantillas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  usar: (id: string) => pedido<{ ok: true }>(`/whatsapp/plantillas/${encodeURIComponent(id)}/uso`, { method: 'POST' }),
};
