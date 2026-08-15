const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8787'}/api`;

// Se completa en el arranque de la app, después de resolver /api/whoami.
// No debería usarse antes de eso.
export let ESTUDIO_ID = '';

export function setEstudioId(id: string) {
  ESTUDIO_ID = id;
}

export async function pedido<T>(ruta: string, opciones?: RequestInit): Promise<T> {
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