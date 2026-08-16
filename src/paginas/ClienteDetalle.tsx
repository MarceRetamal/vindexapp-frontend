import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api, type Cliente } from '../api/cliente';
import { EstadoBadge } from './Clientes';
import { PanelDocumentos } from '../componentes/PanelDocumentos';

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
    return <p style={{ color: 'var(--tinta-suave)' }}>Cargando…</p>;
  }

  if (error) {
    return (
      <div>
        <VolverAClientes />
        <div
          style={{
            marginTop: 16,
            background: '#fdf1ef',
            border: '1px solid var(--alerta)',
            color: 'var(--alerta)',
            padding: '12px 16px',
            borderRadius: 'var(--radio)',
            fontSize: 13,
          }}
        >
          No se pudo cargar el cliente: {error}
        </div>
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  return (
    <div>
      <VolverAClientes />

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          margin: '16px 0 28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: 24 }}>
            {cliente.apellido}, {cliente.nombre}
          </h1>
          <p style={{ color: 'var(--tinta-suave)', margin: '4px 0 0', fontSize: 13 }}>
            {cliente.dni ? `DNI ${cliente.dni}` : 'Sin DNI cargado'}
          </p>
        </div>
        <EstadoBadge estado={cliente.estado} />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Dato etiqueta="Domicilio" valor={cliente.domicilio} />
        <Dato etiqueta="Localidad" valor={cliente.localidad} />
        <Dato etiqueta="Teléfono fijo" valor={cliente.telefono_fijo} />
        <Dato etiqueta="WhatsApp" valor={cliente.whatsapp} />
        <Dato etiqueta="Email" valor={cliente.email} />
      </div>

      {cliente.notas && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--tinta-suave)', marginBottom: 4 }}>Notas</div>
          <p style={{ fontSize: 14 }}>{cliente.notas}</p>
        </div>
      )}

      <PanelDocumentos clienteId={id} />
    </div>
  );
}

function VolverAClientes() {
  return (
    <Link to="/clientes" style={{ fontSize: 13, color: 'var(--acento)', textDecoration: 'none' }}>
      ← Volver a clientes
    </Link>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--tinta-suave)', marginBottom: 2 }}>{etiqueta}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{valor ?? '—'}</div>
    </div>
  );
}