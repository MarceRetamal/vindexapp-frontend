import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api, type Cliente } from '../api/cliente';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { PanelDocumentos } from '../componentes/PanelDocumentos';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';

export function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    setError(null);
    api
      .obtenerCliente(id)
      .then(setCliente)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div>
        <VolverAClientes />
        <div className="mt-4">
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <VolverAClientes />
        <div className="mt-4">
          <ErrorBanner message={`No se pudo cargar el cliente: ${error}`} />
        </div>
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  const sinDatos =
    !cliente.domicilio &&
    !cliente.localidad &&
    !cliente.telefono_fijo &&
    !cliente.whatsapp &&
    !cliente.email;

  return (
    <div>
      <VolverAClientes />

      <header className="flex items-start justify-between gap-4 mt-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-black uppercase tracking-wide text-white break-words">
            {cliente.apellido}, {cliente.nombre}
          </h1>
          <p className="text-sm text-text-gray-light mt-1">
            {cliente.dni ? `DNI ${cliente.dni}` : 'Sin DNI cargado'}
          </p>
        </div>
        <EstadoBadge
          estado={cliente.estado}
          colorMap={{ Activo: 'success', Potencial: 'warning', Inactivo: 'neutral' }}
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="border border-line rounded-sharp bg-graphite p-4">
            <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Datos de contacto</h2>
            {sinDatos ? (
              <EmptyState message="Todavía no se cargaron datos de contacto para este cliente." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Dato etiqueta="Domicilio" valor={cliente.domicilio} />
                <Dato etiqueta="Localidad" valor={cliente.localidad} />
                <Dato etiqueta="Teléfono fijo" valor={cliente.telefono_fijo} />
                <Dato etiqueta="WhatsApp" valor={cliente.whatsapp} />
                <Dato etiqueta="Email" valor={cliente.email} />
              </div>
            )}
            {cliente.notas && (
              <div className="mt-4 pt-3 border-t border-line">
                <div className="text-xs text-text-gray-light mb-1">Notas</div>
                <p className="text-sm text-white whitespace-pre-wrap">{cliente.notas}</p>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <PanelDocumentos clienteId={id} />
        </div>
      </div>
    </div>
  );
}

function VolverAClientes() {
  return (
    <Link to="/clientes" className="text-sm text-silver hover:brightness-125 no-underline">
      ← Volver a clientes
    </Link>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div>
      <div className="text-xs text-text-gray-light mb-0.5">{etiqueta}</div>
      <div className="text-sm font-medium text-white">{valor ?? '—'}</div>
    </div>
  );
}
