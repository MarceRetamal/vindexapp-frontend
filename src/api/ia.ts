import { pedido } from './http';

/** Análisis de un proveído hecho por la IA (ya con los nombres restituidos). */
export interface AnalisisProveido {
  resumen: string;
  que_dispone: string;
  accion: string;
  plazo: { dias: number | null; tipo: 'habiles' | 'corridos' | 'no_indica'; fundamento: string };
  urgencia: 'alta' | 'media' | 'baja';
  normas: { cita: string; contenido: string; verificada: boolean }[];
  advertencias: string[];
}

export interface EstadoIa {
  habilitada: boolean;
  modelo: string;
  consumo_mes_usd: number;
  tope_mes_usd: number;
}

export interface RespuestaTexto {
  id: string;
  texto: string;
  /** Cuántos datos personales se reemplazaron antes de enviar. */
  anonimizados: number;
}

export interface MensajeConsulta {
  rol: 'abogado' | 'ia';
  texto: string;
}

export const api = {
  estado: () => pedido<EstadoIa>('/ia/estado'),
  /** Último análisis guardado de una novedad (no consume). 404 si no tiene. */
  analisisGuardado: (novedadId: string) =>
    pedido<{ id: string; analisis: AnalisisProveido; creado_en: number }>(`/ia/proveido/${encodeURIComponent(novedadId)}`),
  analizarProveido: (novedadId: string, rehacer = false) =>
    pedido<{ id: string; analisis: AnalisisProveido; creado_en: number; guardado: boolean }>(`/ia/proveido/${encodeURIComponent(novedadId)}`, {
      method: 'POST',
      body: JSON.stringify({ rehacer }),
    }),
  estrategia: (expediente_id: string, pregunta?: string) =>
    pedido<RespuestaTexto>('/ia/estrategia', { method: 'POST', body: JSON.stringify({ expediente_id, pregunta }) }),
  escrito: (expediente_id: string, tipo: string, instrucciones?: string) =>
    pedido<RespuestaTexto>('/ia/escrito', { method: 'POST', body: JSON.stringify({ expediente_id, tipo, instrucciones }) }),
  consulta: (mensajes: MensajeConsulta[], expediente_id?: string) =>
    pedido<RespuestaTexto>('/ia/consulta', { method: 'POST', body: JSON.stringify({ mensajes, expediente_id }) }),
};

export const AVISO_IA =
  'Generado por inteligencia artificial sobre datos anonimizados. Es una propuesta: verificá normas, plazos y hechos antes de usarla.';
