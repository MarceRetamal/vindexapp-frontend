import { pedido } from './http';

/** Qué vio la última lectura del portal (cantidades y fechas; nunca datos de causas). */
export interface DetalleLectura {
  paginas_leidas: number;
  paginas_del_portal: number;
  vistas: number;
  nuevas: number;
  de_causas_importadas: number;
  de_otras_causas: number;
  /** Filtro "Procesada" que se usó, y las opciones que ofrece el portal. */
  filtro_procesada: string | null;
  opciones_procesada: string[];
  /** AAAA-MM-DDTHH:MM:SS */
  alta_mas_reciente: string | null;
  alta_mas_antigua: string | null;
  linea_de_base: boolean;
}

export interface EstadoPortal {
  configurado: boolean;
  faltan: string[];
  estudio_correcto: boolean;
  causas_importadas: number;
  ultimo_intento: number | null;
  ultimo_ok: number | null;
  errores_consecutivos: number;
  ultimo_error: string | null;
  pausada: boolean;
  ultimas_nuevas: number;
  ultimas_vistas: number;
  detalle: DetalleLectura | null;
}

export interface ResultadoLectura {
  leidas: number;
  nuevas: number;
  de_causas_importadas: number;
  de_otras_causas: number;
  paginas: number;
  primera: boolean;
  detalle: DetalleLectura;
}

export interface CausaPortal {
  id: string;
  numero_causa: string;
  caratula: string | null;
  organismo: string | null;
  fecha_inicio: string | null;
  expediente_id: string | null;
  expediente_caratula: string | null;
}

export type CausaVinculada = Omit<CausaPortal, 'expediente_id' | 'expediente_caratula'>;

export const api = {
  /** Causas importadas del portal, con el expediente al que están vinculadas (si alguno). */
  listarCausas: () => pedido<CausaPortal[]>('/portal/causas'),

  /** Causas sin vincular con el mismo número que el expediente (ej. cargado con los datos de una designación). */
  sugeridasDeExpediente: (expedienteId: string) =>
    pedido<(CausaVinculada & { certeza: 'alta' | 'posible'; motivo: string })[]>(`/expedientes/${expedienteId}/causas-sugeridas`),

  causasDeExpediente: (expedienteId: string) => pedido<CausaVinculada[]>(`/expedientes/${expedienteId}/causas-portal`),

  vincularCausa: (expedienteId: string, causaId: string) =>
    pedido<{ causa_portal_id: string; expediente_id: string; novedades_vinculadas: number }>(`/expedientes/${expedienteId}/causas-portal`, {
      method: 'POST',
      body: JSON.stringify({ causa_portal_id: causaId }),
    }),

  desvincularCausa: (expedienteId: string, causaId: string) =>
    pedido<{ causa_portal_id: string; novedades_desvinculadas: number }>(`/expedientes/${expedienteId}/causas-portal/${causaId}`, {
      method: 'DELETE',
    }),

  obtenerEstado: () => pedido<EstadoPortal>('/portal/estado'),

  /** Lee el portal ahora. La API informa el motivo si no se puede (falta configuración, sin causas, rechazo del portal). */
  sincronizar: () => pedido<ResultadoLectura>('/portal/sincronizar', { method: 'POST' }),
};
