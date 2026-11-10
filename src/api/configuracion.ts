import { pedido } from './http';

export interface ConfiguracionEstudio {
  /** Solo el titular puede cambiar algo, y nunca en la demostración. */
  puede_editar: boolean;
  whatsapp: {
    /** El sistema (token y número emisor de VINDEX) está listo para enviar. */
    plataforma_lista: boolean;
    /** Número cargado, enmascarado (+54 9 221 •••• 3456). */
    numero: string | null;
    verificado: boolean;
    origen: 'estudio' | 'entorno' | null;
    pendiente_de_verificar: boolean;
  };
  portal: {
    cargado: boolean;
    /** true = lo cargó el propio estudio (cifrado en el sistema). */
    propio: boolean;
    /** Domicilio electrónico enmascarado. */
    etiqueta: string | null;
    actualizado_en: number | null;
    cifrado_listo: boolean;
  };
}

export const api = {
  obtener: () => pedido<ConfiguracionEstudio>('/configuracion'),

  /** Carga o cambia el número y manda un código a ese número por WhatsApp. */
  cargarWhatsApp: (numero: string) =>
    pedido<{ verificado: boolean; numero: string; vence_en_minutos?: number; sin_cambios?: boolean }>('/configuracion/whatsapp', {
      method: 'PUT',
      body: JSON.stringify({ numero }),
    }),
  verificarWhatsApp: (codigo: string) =>
    pedido<{ verificado: true }>('/configuracion/whatsapp/verificar', { method: 'POST', body: JSON.stringify({ codigo }) }),
  quitarWhatsApp: () => pedido<{ ok: true }>('/configuracion/whatsapp', { method: 'DELETE' }),

  /** Comprueba las credenciales en el portal y, solo si las acepta, las guarda cifradas. */
  cargarPortal: (domicilio: string, clave: string) =>
    pedido<{ cargado: true; etiqueta: string }>('/configuracion/portal', { method: 'PUT', body: JSON.stringify({ domicilio, clave }) }),
  quitarPortal: () => pedido<{ ok: true }>('/configuracion/portal', { method: 'DELETE' }),
};
