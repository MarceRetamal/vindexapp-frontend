import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { MailIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react';
import { api, type Cliente } from '../api/cliente';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { BotonEliminar } from '../componentes/BotonEliminar';
import { PanelDocumentos } from '../componentes/PanelDocumentos';
import { PanelCausasCliente } from '../componentes/PanelCausasCliente';
import { SituacionCliente } from '../componentes/SituacionCliente';
import { enlaceWhatsApp } from '../lib/telefono';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';

const accionContacto = 'inline-flex h-9 items-center gap-2 rounded-full border border-line px-3.5 text-[13px] text-silver transition-colors hover:border-silver-deep hover:text-white';

export function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
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

      <header className="mb-8 mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Cliente</p>
          <h1 className="mt-2 break-words text-2xl font-black leading-tight text-white sm:text-[30px]">
            {cliente.apellido}, {cliente.nombre}
          </h1>
          <p className="mt-2 text-sm text-silver">
            {[cliente.dni ? `DNI ${cliente.dni}` : 'Sin DNI cargado', cliente.localidad].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {enlaceWhatsApp(cliente.whatsapp) && (
              <a href={enlaceWhatsApp(cliente.whatsapp) ?? undefined} target="_blank" rel="noopener noreferrer" className={accionContacto}>
                <MessageCircleIcon className="h-4 w-4" strokeWidth={1.6} /> WhatsApp
              </a>
            )}
            {(cliente.telefono_fijo || cliente.whatsapp) && (
              <a href={`tel:${(cliente.whatsapp ?? cliente.telefono_fijo ?? '').replace(/[^\d+]/g, '')}`} className={accionContacto}>
                <PhoneIcon className="h-4 w-4" strokeWidth={1.6} /> Llamar
              </a>
            )}
            {cliente.email && (
              <a href={`mailto:${cliente.email}`} className={accionContacto}>
                <MailIcon className="h-4 w-4" strokeWidth={1.6} /> Mail
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:shrink-0">
          <EstadoBadge
            estado={cliente.estado}
            colorMap={{ Activo: 'success', Potencial: 'warning', Inactivo: 'neutral' }}
          />
          <BotonEliminar
            etiqueta="Eliminar cliente"
            descripcion={`el cliente ${cliente.apellido}, ${cliente.nombre}`}
            tituloConContenido="Eliminar cliente con todo su contenido"
            alternativa="Si solo querés dejar de verlo en la lista de activos, es mejor pasarlo a estado Inactivo: no se pierde nada."
            eliminar={(conContenido) => api.eliminarCliente(cliente.id, conContenido)}
            alEliminar={() => navegar('/clientes')}
            alFallar={setErrorEliminar}
          />
        </div>
      </header>

      {errorEliminar && <ErrorBanner message={errorEliminar} />}

      <SituacionCliente clienteId={id!} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="superficie p-5">
            <h2 className="eyebrow mb-3 text-silver">Datos de contacto</h2>
            {sinDatos ? (
              <EmptyState message="Todavía no se cargaron datos de contacto para este cliente." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <PanelCausasCliente clienteId={id!} />
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
