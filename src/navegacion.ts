import {
  BellIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  ChartColumnIcon,
  FileTextIcon,
  FolderOpenIcon,
  HourglassIcon,
  LayoutDashboardIcon,
  ScaleIcon,
  SettingsIcon,
  SquareCheckBigIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

export interface Seccion {
  ruta: string;
  etiqueta: string;
  icono: LucideIcon;
  grupo: 'Hoy' | 'Causas' | 'Estudio';
}

/** Secciones del panel, agrupadas por cómo se usan: lo del día, el trabajo sobre las causas y la gestión del estudio. */
export const SECCIONES: Seccion[] = [
  { ruta: '/', etiqueta: 'Mi día', icono: LayoutDashboardIcon, grupo: 'Hoy' },
  { ruta: '/novedades', etiqueta: 'Novedades', icono: BellIcon, grupo: 'Hoy' },
  { ruta: '/tareas', etiqueta: 'Tareas', icono: SquareCheckBigIcon, grupo: 'Hoy' },
  { ruta: '/agenda', etiqueta: 'Agenda', icono: CalendarDaysIcon, grupo: 'Hoy' },
  { ruta: '/expedientes', etiqueta: 'Expedientes', icono: FolderOpenIcon, grupo: 'Causas' },
  { ruta: '/clientes', etiqueta: 'Clientes', icono: UsersIcon, grupo: 'Causas' },
  { ruta: '/plazos', etiqueta: 'Plazos', icono: HourglassIcon, grupo: 'Causas' },
  { ruta: '/jurisprudencia', etiqueta: 'Jurisprudencia', icono: ScaleIcon, grupo: 'Causas' },
  { ruta: '/presupuestos', etiqueta: 'Presupuestos', icono: FileTextIcon, grupo: 'Estudio' },
  { ruta: '/liquidaciones', etiqueta: 'Liquidaciones', icono: CalculatorIcon, grupo: 'Estudio' },
  { ruta: '/reportes', etiqueta: 'Reportes', icono: ChartColumnIcon, grupo: 'Estudio' },
  { ruta: '/configuracion', etiqueta: 'Configuración', icono: SettingsIcon, grupo: 'Estudio' },
];

export const GRUPOS: Seccion['grupo'][] = ['Hoy', 'Causas', 'Estudio'];

/** Evento para abrir la paleta de búsqueda desde cualquier botón. */
export const EVENTO_PALETA = 'vindex:abrir-paleta';
