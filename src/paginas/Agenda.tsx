import { useEffect, useState } from 'react';
import { api, type Audiencia } from '../api/audiencias';
import { api as expedientesApi, type Expediente } from '../api/expedientes';

const MODALIDADES = ['Presencial', 'Videoconferencia', 'Telefónica'] as const;

export function Agenda() {
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function cargar() {
    setCargando(true);
    setError(null);
    Promise.all([api.listarAudiencias(), expedientesApi.listarExpedientes()])
      .then(([a, e]) => {
        setAudiencias(a);
        setExpedientes(e);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  const expedientesPorId = new Map(expedientes.map((e) => [e.id, e]));

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
          <h1 style={{ fontSize: 26 }}>Agenda</h1>
          <p style={{ color: 'var(--tinta-suave)', margin: '4px 0 0', fontSize: 13 }}>
            {audiencias.length} {audiencias.length === 1 ? 'audiencia' : 'audiencias'}
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
          {mostrarFormulario ? 'Cancelar' : '+ Nueva audiencia'}
        </button>
      </header>

      {mostrarFormulario && (
        <FormularioNuevaAudiencia
          expedientes={expedientes}
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
      ) : audiencias.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--linea)',
            borderRadius: 'var(--radio)',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--tinta-suave)',
          }}
        >
          Todavía no hay audiencias cargadas. Usá "Nueva audiencia" para agregar la primera.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {audiencias.map((a, i) => (
            <FilaAudiencia
              key={a.id}
              audiencia={a}
              numero={i + 1}
              expediente={expedientesPorId.get(a.expediente_id)}
              onCambiado={cargar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const COLORES_ESTADO: Record<Audiencia['estado'], string> = {
  Programada: 'var(--acento)',
  Realizada: 'var(--exito)',
  Suspendida: 'var(--alerta)',
  Cancelada: 'var(--tinta-suave)',
};

function EstadoBadge({ estado }: { estado: Audiencia['estado'] }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: COLORES_ESTADO[estado],
        border: `1px solid ${COLORES_ESTADO[estado]}`,
        borderRadius: 'var(--radio)',
        padding: '3px 8px',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {estado.toUpperCase()}
    </span>
  );
}

function FilaAudiencia({
  audiencia,
  numero,
  expediente,
  onCambiado,
}: {
  audiencia: Audiencia;
  numero: number;
  expediente?: Expediente;
  onCambiado: () => void;
}) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transicionar(estado: 'Realizada' | 'Suspendida' | 'Cancelada') {
    setProcesando(true);
    setError(null);
    try {
      await api.cambiarEstado(audiencia.id, estado);
      onCambiado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setProcesando(false);
    }
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
        <div
          style={{
            fontFamily: 'var(--fuente-dato)',
            fontSize: 12,
            color: 'var(--tinta-suave)',
            width: 96,
          }}
        >
          {audiencia.fecha}
          {audiencia.hora ? ` ${audiencia.hora}` : ''}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{audiencia.tipo}</div>
          <div style={{ fontSize: 12, color: 'var(--tinta-suave)', marginTop: 2 }}>
            {expediente ? expediente.caratula : 'Expediente no encontrado'}
            {audiencia.modalidad ? ` · ${audiencia.modalidad}` : ''}
            {audiencia.lugar ? ` · ${audiencia.lugar}` : ''}
          </div>
        </div>

        {audiencia.estado === 'Programada' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={botonAccion} disabled={procesando} onClick={() => transicionar('Realizada')}>
              Realizada
            </button>
            <button style={botonAccion} disabled={procesando} onClick={() => transicionar('Suspendida')}>
              Suspender
            </button>
            <button style={botonAccion} disabled={procesando} onClick={() => transicionar('Cancelada')}>
              Cancelar
            </button>
          </div>
        )}

        <EstadoBadge estado={audiencia.estado} />
      </div>

      {error && (
        <div style={{ color: 'var(--alerta)', fontSize: 12, padding: '0 4px 12px' }}>{error}</div>
      )}
    </div>
  );
}

function FormularioNuevaAudiencia({
  expedientes,
  onCreado,
}: {
  expedientes: Expediente[];
  onCreado: () => void;
}) {
  const [expedienteId, setExpedienteId] = useState('');
  const [tipo, setTipo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [modalidad, setModalidad] = useState<(typeof MODALIDADES)[number] | ''>('');
  const [lugar, setLugar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.crearAudiencia({
        expediente_id: expedienteId,
        tipo,
        fecha,
        hora: hora || undefined,
        modalidad: modalidad || undefined,
        lugar: lugar || undefined,
      });
      onCreado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la audiencia.');
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
      {expedientes.length === 0 && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--alerta)', fontSize: 13 }}>
          Todavía no hay expedientes cargados. Creá uno primero en la sección Expedientes.
        </div>
      )}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>Expediente</span>
        <select
          style={campo}
          value={expedienteId}
          onChange={(e) => setExpedienteId(e.target.value)}
          required
        >
          <option value="" disabled>
            Elegí un expediente
          </option>
          {expedientes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.caratula}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>Tipo</span>
        <input
          style={campo}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          placeholder="Audiencia de conciliación"
          required
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>Modalidad</span>
        <select
          style={campo}
          value={modalidad}
          onChange={(e) => setModalidad(e.target.value as (typeof MODALIDADES)[number] | '')}
        >
          <option value="">Sin especificar</option>
          {MODALIDADES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>Fecha</span>
        <input
          style={campo}
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>Hora</span>
        <input style={campo} type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
        <span style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>Lugar</span>
        <input style={campo} value={lugar} onChange={(e) => setLugar(e.target.value)} />
      </label>

      {error && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--alerta)', fontSize: 13 }}>{error}</div>
      )}

      <div style={{ gridColumn: '1 / -1' }}>
        <button
          type="submit"
          disabled={enviando || expedientes.length === 0}
          style={{
            background: 'var(--acento)',
            color: 'var(--papel)',
            border: 'none',
            borderRadius: 'var(--radio)',
            padding: '9px 18px',
            fontSize: 14,
            fontWeight: 600,
            opacity: enviando || expedientes.length === 0 ? 0.6 : 1,
          }}
        >
          {enviando ? 'Guardando…' : 'Guardar audiencia'}
        </button>
      </div>
    </form>
  );
}
