import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api, type Expediente } from '../api/expedientes';

export function ExpedienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    setError(null);
    api
      .obtenerExpediente(id)
      .then(setExpediente)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return <p style={{ color: 'var(--tinta-suave)' }}>Cargando…</p>;
  }

  if (error) {
    return (
      <div>
        <VolverAExpedientes />
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
          No se pudo cargar el expediente: {error}
        </div>
      </div>
    );
  }

  if (!expediente) {
    return null;
  }

  return (
    <div>
      <VolverAExpedientes />

      <header style={{ margin: '16px 0 28px' }}>
        <h1 style={{ fontSize: 24 }}>{expediente.caratula}</h1>
        <p style={{ color: 'var(--tinta-suave)', margin: '4px 0 0', fontSize: 13 }}>
          {expediente.cliente_apellido}, {expediente.cliente_nombre}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Dato etiqueta="Estado" valor={expediente.estado} />
        <Dato etiqueta="Número" valor={expediente.numero} />
        <Dato etiqueta="Fuero" valor={expediente.fuero} />
        <Dato etiqueta="Juzgado" valor={expediente.juzgado} />
        <Dato etiqueta="Departamento judicial" valor={expediente.departamento} />
        <Dato etiqueta="Rol procesal" valor={expediente.rol_procesal} />
        <Dato etiqueta="Inicio" valor={expediente.inicio} />
      </div>

      {expediente.notas && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--tinta-suave)', marginBottom: 4 }}>Notas</div>
          <p style={{ fontSize: 14 }}>{expediente.notas}</p>
        </div>
      )}
    </div>
  );
}

function VolverAExpedientes() {
  return (
    <Link to="/expedientes" style={{ fontSize: 13, color: 'var(--acento)', textDecoration: 'none' }}>
      ← Volver a expedientes
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
