import { pedido } from './http';

export type RolUsuario = 'titular' | 'asociado' | 'administrativo';

export const ROLES_USUARIO: { valor: RolUsuario; etiqueta: string; descripcion: string }[] = [
  { valor: 'titular', etiqueta: 'Titular', descripcion: 'Todo, incluida la configuración, los usuarios y los borrados definitivos.' },
  { valor: 'asociado', etiqueta: 'Asociado', descripcion: 'Trabaja en clientes, expedientes, plazos y novedades.' },
  { valor: 'administrativo', etiqueta: 'Administrativo', descripcion: 'Igual que asociado; pensado para personal de apoyo.' },
];

export interface UsuarioEstudio {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  activo: number;
  creado_en: number;
}

export const api = {
  listar: () => pedido<UsuarioEstudio[]>('/usuarios'),
  crear: (datos: { nombre: string; apellido: string; email: string; rol: RolUsuario }) =>
    pedido<{ id: string; email: string }>('/usuarios', { method: 'POST', body: JSON.stringify(datos) }),
  actualizar: (id: string, cambios: { rol?: RolUsuario; activo?: boolean }) =>
    pedido<{ id: string; rol: RolUsuario; activo: number }>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) }),
};
