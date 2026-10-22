import { pedido } from './http';

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
}

export interface ResultadoLectura {
  leidas: number;
  nuevas: number;
  descartadas: number;
  paginas: number;
  primera: boolean;
}

export const api = {
  obtenerEstado: () => pedido<EstadoPortal>('/portal/estado'),

  /** Lee el portal ahora. La API informa el motivo si no se puede (falta configuración, sin causas, rechazo del portal). */
  sincronizar: () => pedido<ResultadoLectura>('/portal/sincronizar', { method: 'POST' }),
};
