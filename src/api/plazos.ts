import { pedido } from './http';

export type Regimen = 'cpcc' | 'cpp';
export type TipoInicio = 'notificacion' | 'ministerio_legis' | 'correo_electronico';
export type TipoInhabil = 'feriado' | 'feria' | 'asueto' | 'suspension';

export interface PedidoPlazo {
  regimen: Regimen;
  inicio: { tipo: TipoInicio; fecha: string };
  dias: number;
  localidad?: string | null;
  distancia_km?: number;
  vista?: boolean;
  suspende_en_feria?: boolean;
  flagrancia?: boolean;
  recurso?: boolean;
}

export interface ResultadoPlazo {
  fecha_notificacion: string;
  vencimiento: string;
  plazo_de_gracia: string | null;
  dias_totales: number;
  localidad: string | null;
  calendario_verificado_hasta: string;
  detalle: { fecha: string; numero: number | null; motivo: string }[];
  normas: string[];
  supuestos: string[];
  advertencias: string[];
}

export interface DiaInhabil {
  id: string;
  fecha: string;
  alcance: string;
  tipo: TipoInhabil;
  motivo: string;
  fuente: string | null;
}

export interface CalendarioJudicial {
  verificado_hasta: string | null;
  fuente: string | null;
  actualizado_en: number | null;
  localidades: string[];
  dias: DiaInhabil[];
}

export const api = {
  calcular: (datos: PedidoPlazo) => pedido<ResultadoPlazo>('/plazos/calcular', { method: 'POST', body: JSON.stringify(datos) }),

  calendario: (desde?: string, hasta?: string) => {
    const q = new URLSearchParams();
    if (desde) q.set('desde', desde);
    if (hasta) q.set('hasta', hasta);
    const s = q.toString();
    return pedido<CalendarioJudicial>(`/plazos/calendario${s ? `?${s}` : ''}`);
  },

  agregarDia: (datos: { fecha: string; alcance?: string; tipo: TipoInhabil; motivo: string; fuente?: string }) =>
    pedido<{ id: string }>('/plazos/calendario/dias', { method: 'POST', body: JSON.stringify(datos) }),

  eliminarDia: (id: string) => pedido<{ id: string }>(`/plazos/calendario/dias/${id}`, { method: 'DELETE' }),

  fijarVerificacion: (verificado_hasta: string, fuente?: string) =>
    pedido<{ verificado_hasta: string }>('/plazos/calendario/verificacion', { method: 'PUT', body: JSON.stringify({ verificado_hasta, fuente }) }),
};
