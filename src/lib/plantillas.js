export function completarPlantilla(texto, datos) {
    return texto.replace(/\{(nombre|tema|abogado)\}/g, (_, clave) => {
        const v = datos[clave]?.trim();
        return v ? v : `[${clave}]`;
    });
}
/** Datos entre corchetes que faltan completar, sin repetir. */
export function pendientes(texto) {
    return [...new Set([...texto.matchAll(/\[([^\[\]\n]{1,60})\]/g)].map((m) => m[0]))];
}
/** Primer nombre a partir del nombre completo o del perfil de WhatsApp ("Juana María Pérez" pasa a "Juana"). */
export function nombreDePila(...candidatos) {
    for (const c of candidatos) {
        const primero = c?.trim().split(/\s+/)[0] ?? '';
        if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,20}$/.test(primero))
            return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
    }
    return null;
}
