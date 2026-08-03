import { useEffect, useState } from 'react';
import { api, type Cliente } from '../api/cliente';

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
        <FormularioNuevoCliente
          onCreado={() => {
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
  );
}

function EstadoBadge({ estado }: { estado: Cliente['estado'] }) {
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

function FormularioNuevoCliente({ onCreado }: { onCreado: () => void }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.crearCliente({
        nombre,
        apellido,
        dni: dni || undefined,
        whatsapp: whatsapp || undefined,
      });
      onCreado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el cliente.');
    } finally {
      setEnviando(false);
    }
  }

  const campo: React.CSSProperties = {
    border: '1px solid var(--linea)',
    borderRadius: 'var(--radio)',
    padding: '9px 12px',
    fontSize: 14,
    background: 'var(--papel-elevado)',
  };

  return (
    <form
      onSubmit={enviar}
      style={{
        border: '1px solid var(--linea)',
        borderRadius: 'var(--radio)',
        padding: 20,
        marginBottom: 24,
        background: 'var(--papel-elevado)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>Nombre</span>
        <input style={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>Apellido</span>
        <input style={campo} value={apellido} onChange={(e) => setApellido(e.target.value)} required />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>DNI</span>
        <input style={campo} value={dni} onChange={(e) => setDni(e.target.value)} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>WhatsApp</span>
        <input style={campo} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </label>

      {error && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--alerta)', fontSize: 13 }}>{error}</div>
      )}

      <div style={{ gridColumn: '1 / -1' }}>
        <button
          type="submit"
          disabled={enviando}
          style={{
            background: 'var(--acento)',
            color: 'var(--papel)',
            border: 'none',
            borderRadius: 'var(--radio)',
            padding: '9px 18px',
            fontSize: 14,
            fontWeight: 600,
            opacity: enviando ? 0.6 : 1,
          }}
        >
          {enviando ? 'Guardando…' : 'Guardar cliente'}
        </button>
      </div>
    </form>
  );
}
