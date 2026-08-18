import { ESTUDIO_ID, pedido } from './http';

export interface ReporteExpedientes {
  porEstado: { estado: string; cantidad: number }[];
  porFuero: { fuero: string; cantidad: number }[];
  porDepartamento: { departamento: string; cantidad: number }[];
  bajasUltimos90Dias: { id: string; caratula: string; baja: string; motivo_baja: string | null }[];
}

export interface ReportePresupuestos {
  porEstado: { estado: string; cantidad: number; montoTotal: number }[];
  totalFirmadoCentavos: number;
  totalPendienteCentavos: number;
  tasaConversion: number | null;
}

export const api = {
  listarReporteExpedientes: () =>
    pedido<ReporteExpedientes>(`/reportes/expedientes?estudio_id=${ESTUDIO_ID}`),

  listarReportePresupuestos: (desde?: string, hasta?: string) => {
    const query = new URLSearchParams({ estudio_id: ESTUDIO_ID });
    if (desde) query.set('desde', desde);
    if (hasta) query.set('hasta', hasta);
    return pedido<ReportePresupuestos>(`/reportes/presupuestos?${query.toString()}`);
  },
};
