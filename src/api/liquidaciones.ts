import { pedido } from './http';

export type TipoExtincion =
  | 'despido_sin_causa'
  | 'despido_con_causa'
  | 'despido_indirecto'
  | 'renuncia'
  | 'mutuo_acuerdo'
  | 'vencimiento_periodo_prueba'
  | 'fallecimiento_trabajador'
  | 'fallecimiento_empleador'
  | 'jubilacion'
  | 'incapacidad_permanente';

export interface DatosLiquidacionCasasParticulares {
  fechaIngreso: string; // ISO, ej. "2020-03-15"
  fechaEgreso: string;
  mejorRemuneracion: number;
  tipoExtincion: TipoExtincion;
  preavisoOtorgado: boolean;
  diasPreavisoOtorgados?: number;
  diasTrabajadosAnioEnCurso: number;
}

export interface ResultadoLiquidacion {
  antiguedad: { aniosCompletos: number; mesesRestantes: number; diasTotales: number };
  indemnizacionAntiguedad: number;
  indemnizacionSustitutivaPreaviso: number;
  integracionMesDespido: number;
  sacProporcional: number;
  vacacionesNoGozadas: number;
  indemnizacionEspecialMaternidadOMatrimonio: number;
  totalBruto: number;
  advertencias: string[];
}

export const api = {
  calcularCasasParticulares: (datos: DatosLiquidacionCasasParticulares) =>
    pedido<ResultadoLiquidacion>('/liquidaciones/casas-particulares', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
};
