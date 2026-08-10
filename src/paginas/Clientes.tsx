import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, type Cliente } from '../api/cliente';
import { FormularioCliente } from '../componentes/FormularioCliente';

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
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26 }}>Clientes</h1>
          <p style={{ color: 'var(--tinta-suave)', margin: '4px 0 0', fontSize: 13 }}>
            {clientes.length} {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}
          </p>
        </div>
        <button
          onClick={() => setMostrarFormulario((v) => !v)}
          style={{
            background: 'var(--tinta)',
            color: 'var(--papel)',
            border: 'none',
            borderRadius: 'var(--radio)',
            padding: '9px 16px',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo cliente'}
        </button>
      </header>

      {mostrarFormulario && (
        <FormularioCliente
          onGuardado={() => {
            setMostrarFormulario(false);
            cargar();
          }}
        />
      )}

      {error && (
        <div
          style={{
            background: '#fdf1ef',
            border: '1px solid var(--alerta)',
            color: 'var(--alerta)',
            padding: '12px 16px',
            borderRadius: 'var(--radio)',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          No se pudo cargar el listado: {error}
        </div>
      )}

      {cargando ? (
        <p style={{ color: 'var(--tinta-suave)' }}>Cargando…</p>
      ) : clientes.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--linea)',
            borderRadius: 'var(--radio)',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--tinta-suave)',
          }}
        >
          Todavía no hay clientes cargados. Usá "Nuevo cliente" para agregar el primero.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {clientes.map((c, i) => (
            <FilaCliente key={c.id} cliente={c} numero={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilaCliente({ cliente, numero }: { cliente: Cliente; numero: number }) {
  return (
    <Link to={`/clientes/${cliente.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 4px',
          borderBottom: '1px solid var(--linea)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--fuente-dato)',
            fontSize: 12,
            color: 'var(--tinta-suave)',
            width: 28,
          }}
        >
          {String(numero).padStart(2, '0')}
        </span>
        <div style={{ width: 3, alignSelf: 'stretch', background: 'var(--acento)', opacity: 0.4 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {cliente.apellido}, {cliente.nombre}
          </div>
          <div style={{ fontSize: 12, color: 'var(--tinta-suave)', marginTop: 2 }}>
            {cliente.dni ? `DNI ${cliente.dni}` : 'Sin DNI cargado'}
            {cliente.whatsapp ? ` · ${cliente.whatsapp}` : ''}
          </div>
        </div>
        <EstadoBadge estado={cliente.estado} />
      </div>
    </Link>
  );
}

export function EstadoBadge({ estado }: { estado: Cliente['estado'] }) {
  const colores: Record<Cliente['estado'], string> = {
    Activo: 'var(--exito)',
    Potencial: 'var(--alerta)',
    Inactivo: 'var(--tinta-suave)',
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: colores[estado],
        border: `1px solid ${colores[estado]}`,
        borderRadius: 'var(--radio)',
        padding: '3px 8px',
        letterSpacing: '0.02em',
      }}
    >
      {estado.toUpperCase()}
    </span>
  );
}
