/** Funciones de fecha del panel. Las fechas de negocio son AAAA-MM-DD y "hoy" es la fecha de Argentina. */

const ZONA = 'America/Argentina/Buenos_Aires';

export function horaEnArgentina(ahora: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: '2-digit', hourCycle: 'h23' }).format(ahora));
}

export function saludoDe(hora: number): string {
  if (hora < 12) return 'Buen día';
  if (hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** "jueves 5 de noviembre" */
export function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
}

/** { dia: '5', mes: 'NOV' } */
export function diaYMes(iso: string): { dia: string; mes: string } {
  const f = new Date(`${iso}T12:00:00Z`);
  return {
    dia: String(f.getUTCDate()),
    mes: new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' }).format(f).replace('.', '').toUpperCase(),
  };
}

/** "Venció hace 3 días" · "Hoy" · "Mañana" · "En 4 días" */
export function etiquetaDias(dias: number): string {
  if (dias < -1) return `Venció hace ${-dias} días`;
  if (dias === -1) return 'Venció ayer';
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

/** "hace 27 min" · "hace 3 h" · "hace 2 días" */
export function haceCuanto(marca: number, ahora: number = Date.now()): string {
  const min = Math.max(0, Math.round((ahora - marca) / 60_000));
  if (min < 1) return 'hace instantes';
  if (min < 60) return `hace ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

export function iniciales(nombre: string, apellido: string): string {
  return `${nombre.trim().charAt(0)}${apellido.trim().charAt(0)}`.toUpperCase();
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * La frase de arriba de "Mi día": lo más urgente primero. Nunca inventa nada: son conteos de lo que está cargado.
 * Sin nada pendiente dice que no hay nada urgente.
 */
export function resumenDelDia(datos: { vencidas: number; plazosHoy: number; audienciasHoy: number; horaAudiencia: string | null; tareasHoy: number; novedades: number }): string {
  const partes: string[] = [];
  if (datos.vencidas > 0) partes.push(plural(datos.vencidas, 'tarea vencida', 'tareas vencidas'));
  if (datos.plazosHoy > 0) partes.push(`${datos.plazosHoy} ${datos.plazosHoy === 1 ? 'plazo que vence' : 'plazos que vencen'} hoy`);
  if (datos.audienciasHoy > 0) {
    partes.push(
      datos.audienciasHoy === 1 && datos.horaAudiencia ? `1 audiencia a las ${datos.horaAudiencia}` : `${plural(datos.audienciasHoy, 'audiencia', 'audiencias')} hoy`
    );
  }
  if (datos.tareasHoy > 0) partes.push(`${plural(datos.tareasHoy, 'tarea', 'tareas')} para hoy`);
  if (datos.novedades > 0) partes.push(`${plural(datos.novedades, 'novedad del portal', 'novedades del portal')} sin revisar`);
  if (partes.length === 0) return 'No tenés nada urgente para hoy.';
  const ultimo = partes.pop() as string;
  return `Tenés ${partes.length > 0 ? `${partes.join(', ')} y ` : ''}${ultimo}.`;
}

/** Fecha de hoy en Argentina (AAAA-MM-DD). */
export function hoyEnArgentina(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(ahora);
}

/** Días entre dos fechas AAAA-MM-DD (b - a): negativo si b es anterior. */
export function diasEntre(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86_400_000);
}

/** "jueves 12/11/2026" */
export function fechaConDia(iso: string): string {
  const dia = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
  const [a, m, d] = iso.split('-');
  return `${dia} ${d}/${m}/${a}`;
}

/** "12/11/2026" */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}
