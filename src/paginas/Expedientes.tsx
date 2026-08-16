import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, type Expediente } from '../api/expedientes';
import { api as clientesApi, type Cliente } from '../api/cliente';

export function Expedientes() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function cargar() {
    setCargando(true);
    setError(null);
    Promise.all([api.listarExpedientes(), clientesApi.listarClientes()])
      .then(([expedientesCargados, clientesCargados]) => {
        setExpedientes(expedientesCargados);
        setClientes(clientesCargados);
      })
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
          <h1 style={{ fontSize: 26 }}>Expedientes</h1>
          <p style={{ color: 'var(--tinta-suave)', margin: '4px 0 0', fontSize: 13 }}>
            {expedientes.length} {expedientes.length === 1 ? 'expediente' : 'expedientes'}
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
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo expediente'}
        </button>
      </header>

      {mostrarFormulario && (
        <FormularioNuevoExpediente
          clientes={clientes}
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
      ) : expedientes.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--linea)',
            borderRadius: 'var(--radio)',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--tinta-suave)',
          }}
        >
          Todavía no hay expedientes cargados. Usá "Nuevo expediente" para agregar el primero.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {expedientes.map((e, i) => (
            <FilaExpediente key={e.id} expediente={e} numero={i + 1} onCambiado={cargar} />
          ))}
        </div>
      )}
    </div>
  );
}

const botonAccion: React.CSSProperties = {
  border: '1px solid var(--linea)',
  background: 'var(--papel-elevado)',
  borderRadius: 'var(--radio)',
  padding: '5px 10px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--tinta)',
};

function FilaExpediente({
  expediente,
  numero,
  onCambiado,
}: {
  expediente: Expediente;
  numero: number;
  onCambiado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estaDeBaja = expediente.estado === 'Archivado';

  async function darDeBaja() {
    const motivo = window.prompt('Motivo de la baja (opcional):');
    if (motivo === null) return; // canceló el prompt
    setProcesando(true);
    setError(null);
    try {
      await api.darDeBajaExpediente(expediente.id, motivo || undefined);
      onCambiado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo dar de baja el expediente.');
    } finally {
      setProcesando(false);
    }
  }

  async function reactivar() {
    setProcesando(true);
    setError(null);
    try {
      await api.reactivarExpediente(expediente.id);
      onCambiado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reactivar el expediente.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--linea)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 4px' }}>
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

        <Link
          to={`/expedientes/${expediente.id}`}
          style={{ flex: 1, textDecoration: 'none', color: 'inherit', minWidth: 0 }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>{expediente.caratula}</div>
          <div style={{ fontSize: 12, color: 'var(--tinta-suave)', marginTop: 2 }}>
            {expediente.cliente_apellido}, {expediente.cliente_nombre}
            {expediente.numero ? ` · Nº ${expediente.numero}` : ''}
            {expediente.fuero ? ` · ${expediente.fuero}` : ''}
          </div>
        </Link>

        <div style={{ display: 'flex', gap: 6 }}>
          <button style={botonAccion} disabled={procesando} onClick={() => setEditando((v) => !v)}>
            {editando ? 'Cancelar' : 'Editar'}
          </button>
          {estaDeBaja ? (
            <button
              style={{ ...botonAccion, borderColor: 'var(--exito)', color: 'var(--exito)' }}
              disabled={procesando}
              onClick={reactivar}
            >
              Reactivar
            </button>
          ) : (
            <button
              style={{ ...botonAccion, borderColor: 'var(--alerta)', color: 'var(--alerta)' }}
              disabled={procesando}
              onClick={darDeBaja}
            >
              Dar de baja
            </button>
          )}
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--tinta-suave)',
            border: '1px solid var(--linea)',
            borderRadius: 'var(--radio)',
            padding: '3px 8px',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {expediente.estado.toUpperCase()}
        </span>
      </div>

      {error && <div style={{ color: 'var(--alerta)', fontSize: 12, padding: '0 4px 12px' }}>{error}</div>}

      {editando && (
        <FormularioEditarExpediente
          expediente={expediente}
          onGuardado={() => {
            setEditando(false);
            onCambiado();
          }}
          onCancelar={() => setEditando(false)}
        />
      )}
    </div>
  );
}

function FormularioEditarExpediente({
  expediente,
  onGuardado,
  onCancelar,
}: {
  expediente: Expediente;
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [caratula, setCaratula] = useState(expediente.caratula);
  const [numero, setNumero] = useState(expediente.numero ?? '');
  const [fuero, setFuero] = useState(expediente.fuero ?? '');
  const [juzgado, setJuzgado] = useState(expediente.juzgado ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.editarExpediente(expediente.id, {
        caratula,
        numero: numero || undefined,
        fuero: fuero || undefined,
        juzgado: juzgado || undefined,
      });
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar los cambios.');
    } finally {
      setEnviando(false);
    }
  }

  const campo: React.CSSProperties = {
    border: '1px solid var(--linea)',
    borderRadius: 'var(--radio)',
    padding: '8px 10px',
    fontSize: 13,
    background: 'var(--papel)',
  };

  return (
    <form
      onSubmit={enviar}
      style={{
        margin: '0 4px 16px',
        padding: 16,
        background: 'var(--acento-suave)',
        borderRadius: 'var(--radio)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
        <label htmlFor={`editar-${expediente.id}-caratula`} style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Carátula
        </label>
        <input
          id={`editar-${expediente.id}-caratula`}
          style={campo}
          value={caratula}
          onChange={(e) => setCaratula(e.target.value)}
          required
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor={`editar-${expediente.id}-numero`} style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Número
        </label>
        <input id={`editar-${expediente.id}-numero`} style={campo} value={numero} onChange={(e) => setNumero(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor={`editar-${expediente.id}-fuero`} style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Fuero
        </label>
        <input id={`editar-${expediente.id}-fuero`} style={campo} value={fuero} onChange={(e) => setFuero(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
        <label htmlFor={`editar-${expediente.id}-juzgado`} style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Juzgado
        </label>
        <input id={`editar-${expediente.id}-juzgado`} style={campo} value={juzgado} onChange={(e) => setJuzgado(e.target.value)} />
      </div>

      {error && <div style={{ gridColumn: '1 / -1', color: 'var(--alerta)', fontSize: 13 }}>{error}</div>}

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={enviando}
          style={{
            background: 'var(--acento)',
            color: 'var(--papel)',
            border: 'none',
            borderRadius: 'var(--radio)',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            opacity: enviando ? 0.6 : 1,
          }}
        >
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          style={{ background: 'transparent', border: 'none', color: 'var(--tinta-suave)', fontSize: 13 }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function FormularioNuevoExpediente({
  clientes,
  onCreado,
}: {
  clientes: Cliente[];
  onCreado: () => void;
}) {
  const [clienteId, setClienteId] = useState('');
  const [caratula, setCaratula] = useState('');
  const [numero, setNumero] = useState('');
  const [fuero, setFuero] = useState('');
  const [juzgado, setJuzgado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.crearExpediente({
        cliente_id: clienteId,
        caratula,
        numero: numero || undefined,
        fuero: fuero || undefined,
        juzgado: juzgado || undefined,
      });
      onCreado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el expediente.');
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
      {clientes.length === 0 && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--alerta)', fontSize: 13 }}>
          Todavía no hay clientes cargados. Creá uno primero en la sección Clientes.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="nuevo-expediente-cliente" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Cliente
        </label>
        <select
          id="nuevo-expediente-cliente"
          style={campo}
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          required
        >
          <option value="" disabled>
            Elegí un cliente
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.apellido}, {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="nuevo-expediente-caratula" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Carátula
        </label>
        <input
          id="nuevo-expediente-caratula"
          style={campo}
          value={caratula}
          onChange={(e) => setCaratula(e.target.value)}
          required
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="nuevo-expediente-numero" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Número
        </label>
        <input id="nuevo-expediente-numero" style={campo} value={numero} onChange={(e) => setNumero(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="nuevo-expediente-fuero" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Fuero
        </label>
        <input id="nuevo-expediente-fuero" style={campo} value={fuero} onChange={(e) => setFuero(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
        <label htmlFor="nuevo-expediente-juzgado" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Juzgado
        </label>
        <input id="nuevo-expediente-juzgado" style={campo} value={juzgado} onChange={(e) => setJuzgado(e.target.value)} />
      </div>

      {error && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--alerta)', fontSize: 13 }}>{error}</div>
      )}

      <div style={{ gridColumn: '1 / -1' }}>
        <button
          type="submit"
          disabled={enviando || clientes.length === 0}
          style={{
            background: 'var(--acento)',
            color: 'var(--papel)',
            border: 'none',
            borderRadius: 'var(--radio)',
            padding: '9px 18px',
            fontSize: 14,
            fontWeight: 600,
            opacity: enviando || clientes.length === 0 ? 0.6 : 1,
          }}
        >
          {enviando ? 'Guardando…' : 'Guardar expediente'}
        </button>
      </div>
    </form>
  );
}