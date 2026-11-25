/**
 * Completa una respuesta predeterminada: las variables entre llaves ({nombre}, {tema}, {abogado}) salen de la
 * conversación y de la sesión; los datos entre corchetes ([monto], [fecha]) los completa el abogado. Una variable sin
 * dato pasa a corchetes, así no sale un "{nombre}" literal ni queda vacía sin que se note.
 */
export interface DatosVariables {
  nombre: string | null;
  tema: string | null;
  abogado: string | null;
}

export function completarPlantilla(texto: string, datos: DatosVariables): string {
  return texto.replace(/\{(nombre|tema|abogado)\}/g, (_, clave: keyof DatosVariables) => {
    const v = datos[clave]?.trim();
    return v ? v : `[${clave}]`;
  });
}

/** Datos entre corchetes que faltan completar, sin repetir. */
export function pendientes(texto: string): string[] {
  return [...new Set([...texto.matchAll(/\[([^\[\]\n]{1,60})\]/g)].map((m) => m[0]))];
}

/** Primer nombre a partir del nombre completo o del perfil de WhatsApp ("Juana María Pérez" pasa a "Juana"). */
export function nombreDePila(...candidatos: (string | null | undefined)[]): string | null {
  for (const c of candidatos) {
    const primero = c?.trim().split(/\s+/)[0] ?? '';
    if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,20}$/.test(primero)) return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
  }
  return null;
}
