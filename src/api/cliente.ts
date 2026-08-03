const BASE_URL = 'http://localhost:8787/api';

// Temporal: hasta que el flujo de login determine el estudio activo,
// se usa el ID del estudio ya dado de alta en las pruebas.
export const ESTUDIO_ID = 'f5b149e2-810a-4ca4-a606-747c35602cb6';

async function pedido<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE_URL}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(opciones?.headers ?? {}) },
  });

  if (!resp.ok) {
    const cuerpo = await resp.json().catch(() => ({}));
    throw new Error(cuerpo.error ?? `Error ${resp.status} al llamar a ${ruta}`);
  }

  return resp.json();
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  whatsapp: string | null;
  email: string | null;
  estado: 'Activo' | 'Potencial' | 'Inactivo';
  creado_en: number;
}

export const api = {
  listarClientes: () => pedido<Cliente[]>(`/clientes?estudio_id=${ESTUDIO_ID}`),

  crearCliente: (datos: {
    nombre: string;
    apellido: string;
    dni?: string;
    whatsapp?: string;
    email?: string;
  }) =>
    pedido<{ id: string }>('/clientes', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
};
