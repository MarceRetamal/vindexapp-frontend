import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { api, type Cliente } from '../api/cliente';
import { BarraDeLista } from '../componentes/BarraDeLista';
import { BloqueIcono, FilaLista } from '../componentes/FilaLista';
import { FormularioCliente } from '../componentes/FormularioCliente';
import { PageHeader } from '../componentes/PageHeader';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { Button } from '@/componentes/ui/button';
import { iniciales } from '../lib/fechas';
import { coincide } from '../lib/texto';

type FiltroEstado = 'todos' | 'Activo' | 'Potencial' | 'Inactivo';

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('todos');
  const navegar = useNavigate();

  function cargar() {
    setCargando(true);
    setError(null);
    api
      .listarClientes()
      .then(setClientes)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  const visibles = useMemo(
    () =>
      clientes.filter(
        (c) =>
          (filtro === 'todos' || c.estado === filtro) &&
          coincide(busqueda, `${c.apellido} ${c.nombre} ${c.dni ?? ''} ${c.email ?? ''} ${c.whatsapp ?? ''} ${c.localidad ?? ''}`)
      ),
    [clientes, filtro, busqueda]
  );
  const cantidad = (estado: FiltroEstado) => (estado === 'todos' ? clientes.length : clientes.filter((c) => c.estado === estado).length);

  return (
    <div>
      <PageHeader
        eyebrow="Causas"
        title="Clientes"
        count={clientes.length}
        ctaLabel={mostrarFormulario ? 'Cancelar' : '+ Nuevo cliente'}
        onCta={() => setMostrarFormulario((v) => !v)}
      />

      {mostrarFormulario && (
        <FormularioCliente
          // Después de crear un cliente se abre su ficha, donde el sistema busca sus causas en el portal.
          onGuardado={(id) => navegar(`/clientes/${id}`)}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {error && <ErrorBanner message={`No se pudo cargar el listado: ${error}`} />}

      {!cargando && clientes.length > 0 && (
        <BarraDeLista
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          placeholder="Apellido, nombre, DNI o mail"
          etiquetaBusqueda="Buscar un cliente"
          filtro={filtro}
          onFiltro={setFiltro}
          etiquetaFiltro="Estado de los clientes"
          opciones={[
            { valor: 'todos', texto: 'Todos', cantidad: cantidad('todos') },
            { valor: 'Activo', texto: 'Activos', cantidad: cantidad('Activo') },
            { valor: 'Potencial', texto: 'Potenciales', cantidad: cantidad('Potencial') },
            { valor: 'Inactivo', texto: 'Inactivos', cantidad: cantidad('Inactivo') },
          ]}
        />
      )}

      {cargando ? (
        <ListSkeleton rows={6} />
      ) : clientes.length === 0 ? (
        <EmptyState message='Todavía no hay clientes cargados. Usá "Nuevo cliente" para agregar el primero: al guardarlo, el sistema busca sus causas en el portal.' />
      ) : visibles.length === 0 ? (
        <EmptyState
          message="Ningún cliente coincide con la búsqueda."
          accion={
            <Button variant="ghost" onClick={() => { setBusqueda(''); setFiltro('todos'); }} className="rounded-sharp border border-line text-silver hover:text-white">
              Ver todos los clientes
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {visibles.map((cliente) => (
            <FilaLista
              key={cliente.id}
              to={`/clientes/${cliente.id}`}
              inicio={<BloqueIcono redondo>{iniciales(cliente.nombre, cliente.apellido)}</BloqueIcono>}
              lateral={<EstadoBadge estado={cliente.estado} colorMap={{ Activo: 'success', Potencial: 'warning', Inactivo: 'neutral' }} />}
            >
              <div className="truncate text-[15px] font-bold text-white">
                {cliente.apellido}, {cliente.nombre}
              </div>
              <div className="mt-0.5 truncate text-xs text-text-gray-light">
                {[cliente.dni ? `DNI ${cliente.dni}` : 'Sin DNI cargado', cliente.whatsapp, cliente.localidad].filter(Boolean).join(' · ')}
              </div>
              {cliente.email && <div className="truncate text-xs text-silver-deep">{cliente.email}</div>}
            </FilaLista>
          ))}
        </div>
      )}
    </div>
  );
}
