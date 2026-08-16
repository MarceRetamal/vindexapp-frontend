import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, type Cliente } from '../api/cliente';
import { FormularioCliente } from '../componentes/FormularioCliente';
import { PageHeader } from '../componentes/PageHeader';
import { Row } from '../componentes/Row';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { ListSkeleton } from '../componentes/ListSkeleton';

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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

  return (
    <div>
      <PageHeader
        title="Clientes"
        count={clientes.length}
        ctaLabel={mostrarFormulario ? 'Cancelar' : '+ Nuevo cliente'}
        onCta={() => setMostrarFormulario((v) => !v)}
      />

      {mostrarFormulario && (
        <FormularioCliente
          onGuardado={() => {
            setMostrarFormulario(false);
            cargar();
          }}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {error && <ErrorBanner message={`No se pudo cargar el listado: ${error}`} />}

      {cargando ? (
        <ListSkeleton rows={6} />
      ) : clientes.length === 0 ? (
        <EmptyState message='Todavía no hay clientes cargados. Usá "Nuevo cliente" para agregar el primero.' />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {clientes.map((cliente, i) => (
            <Row key={cliente.id} index={i + 1} to={`/clientes/${cliente.id}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold text-white truncate">
                    {cliente.apellido}, {cliente.nombre}
                  </span>
                  <span className="text-xs text-text-gray-light font-mono truncate">
                    {cliente.dni ? `DNI ${cliente.dni}` : 'Sin DNI cargado'}
                    {cliente.whatsapp ? ` · ${cliente.whatsapp}` : ''}
                  </span>
                </div>
                <EstadoBadge
                  estado={cliente.estado}
                  colorMap={{ Activo: 'success', Potencial: 'warning', Inactivo: 'neutral' }}
                />
              </div>
            </Row>
          ))}
        </motion.div>
      )}
    </div>
  );
}
