import { pedido } from './http';

export type EstadoNovedades = 'pendientes' | 'revisadas' | 'todas';

export interface Novedad {
  id: string;
  numero_causa: string;
  caratula: string | null;
  organismo: string | null;
  tipo: string | null;
  fecha_alta: string | null;
  fecha_notificacion: string | null;
  destinatario: string | null;
  enlace: string | null;
  expediente_id: string | null;
  revisada_en: number | null;
  tiene_texto: number;
  texto_extracto: string | null;
}

export interface NovedadDetalle {
  id: string;
  numero_causa: string;
  caratula: string | null;
  organismo: string | null;
  tipo: string | null;
  fecha_libramiento: string | null;
  fecha_alta: string | null;
  fecha_notificacion: string | null;
  destinatario: string | null;
  domicilio: string | null;
  texto: string | null;
  enlace: string | null;
  expediente_id: string | null;
  revisada_en: number | null;
}

export interface ListaNovedades {
  novedades: Novedad[];
  total: number;
  limit: number;
  offset: number;
}

export interface ResumenNovedades {
  total: number;
  pendientes: number;
  revisadas: number;
  pendiente_mas_antigua: string | null;
  ultima_alta: string | null;
  por_causa: { numero_causa: string; organismo: string | null; caratula: string | null; pendientes: number; ultima: string | null }[];
}

export interface FiltrosNovedades {
  estado?: EstadoNovedades;
  q?: string;
  expediente_id?: string;
  limit?: number;
  offset?: number;
}

/** Evento que avisa que cambió la cantidad de novedades pendientes (lo escucha el menú lateral). */
export const EVENTO_NOVEDADES = 'novedades:cambio';

export function avisarCambioNovedades() {
  window.dispatchEvent(new Event(EVENTO_NOVEDADES));
}

export const api = {
  listarNovedades: (filtros: FiltrosNovedades = {}) => {
    const params = new URLSearchParams();
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.q) params.set('q', filtros.q);
    if (filtros.expediente_id) params.set('expediente_id', filtros.expediente_id);
    if (filtros.limit !== undefined) params.set('limit', String(filtros.limit));
    if (filtros.offset !== undefined) params.set('offset', String(filtros.offset));
    const consulta = params.toString();
    return pedido<ListaNovedades>(`/novedades${consulta ? `?${consulta}` : ''}`);
  },

  obtenerNovedad: (id: string) => pedido<NovedadDetalle>(`/novedades/${id}`),

  marcarRevisada: (id: string, revisada: boolean) =>
    pedido<{ id: string; revisada: boolean; revisada_en: number | null }>(`/novedades/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ revisada }),
    }),

  marcarRevisadas: (cuerpo: { ids: string[] } | { hasta_fecha_notificacion: string } | { todas: true }) =>
    pedido<{ marcadas: number }>('/novedades/marcar-revisadas', {
      method: 'POST',
      body: JSON.stringify(cuerpo),
    }),

  obtenerResumen: () => pedido<ResumenNovedades>('/novedades/resumen'),
};

/** Plazo que el sistema propone para una novedad. Es una propuesta: el abogado la confirma. */
export interface PropuestaPlazo {
  regimen: 'cpcc' | 'cpp';
  dias: number;
  vista: boolean;
  /** 'proveido': los días los dice el texto. 'supletorio': corresponde el plazo del código y hay que verificarlo. */
  origen: 'proveido' | 'supletorio';
  cita: string | null;
  fundamento: string;
  fecha_notificacion: string;
  vencimiento: string;
  plazo_de_gracia: string | null;
  localidad: string | null;
  normas: string[];
  supuestos: string[];
  advertencias: string[];
}

export interface SugerenciaPlazo {
  propuesta: PropuestaPlazo | null;
  motivo: string | null;
}

export const apiPlazos = {
  /** Propuestas de plazo para hasta 50 novedades a la vez. */
  plazosSugeridos: (ids: string[]) =>
    pedido<{ sugerencias: Record<string, SugerenciaPlazo> }>(`/novedades/plazos-sugeridos?ids=${ids.map(encodeURIComponent).join(',')}`),
};
