import { pedido } from './http';

export interface Usuario {
  id: string;
  estudio_id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

export interface Estudio {
  id: string;
  nombre: string;
}

export function whoami() {
  return pedido<{ usuario: Usuario; estudio: Estudio; demo?: boolean }>('/whoami');
}
// Se completa en el arranque (main.tsx), junto con el estudio: la sesión ya está resuelta cuando se dibuja el panel.
let usuarioActual: Usuario | null = null;
let estudioActual: Estudio | null = null;
let enDemostracion = false;

export function setSesion(usuario: Usuario, estudio: Estudio, demo = false) {
  usuarioActual = usuario;
  estudioActual = estudio;
  enDemostracion = demo;
}

export function sesionActual(): { usuario: Usuario | null; estudio: Estudio | null; demo: boolean } {
  return { usuario: usuarioActual, estudio: estudioActual, demo: enDemostracion };
}
