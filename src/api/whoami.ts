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
  return pedido<{ usuario: Usuario; estudio: Estudio }>('/whoami');
}