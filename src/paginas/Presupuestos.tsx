import { useEffect, useState } from 'react';
import { api, type Presupuesto } from '../api/presupuestos';
import { api as clientesApi, type Cliente } from '../api/cliente';
import { api as expedientesApi, type Expediente } from '../api/expedientes';

const FORMATO_MONTO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

export function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function cargar() {
    setCargando(true);
    setError(null);
    Promise.all([api.listarPresupuestos(), clientesApi.listarClientes(), expedientesApi.listarExpedientes()])
      .then(([p, c, e]) => {
        setPresupuestos(p);
        setClientes(c);
        setExpedientes(e);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  const clientesPorId = new Map(clientes.map((c) => [c.id, c]));

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
          <h1 style={{ fontSize: 26 }}>Presupuestos</h1>
          <p style={{ color: 'var(--tinta-suave)', margin: '4px 0 0', fontSize: 13 }}>
            {presupuestos.length} {presupuestos.length === 1 ? 'presupuesto' : 'presupuestos'}
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
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo presupuesto'}
        </button>
      </header>

      {mostrarFormulario && (
        <FormularioNuevoPresupuesto
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
      ) : presupuestos.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--linea)',
            borderRadius: 'var(--radio)',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--tinta-suave)',
          }}
        >
          Todavía no hay presupuestos cargados. Usá "Nuevo presupuesto" para agregar el primero.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {presupuestos.map((p, i) => (
            <FilaPresupuesto
              key={p.id}
              presupuesto={p}
              numero={i + 1}
              cliente={p.cliente_id ? clientesPorId.get(p.cliente_id) : undefined}
              expedientes={expedientes}
              onCambiado={cargar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const COLORES_ESTADO: Record<Presupuesto['estado'], string> = {
  borrador: 'var(--tinta-suave)',
  enviado: 'var(--alerta)',
  firmado: 'var(--exito)',
  rechazado: 'var(--acento)',
  vencido: 'var(--tinta-suave)',
};

function EstadoBadge({ estado }: { estado: Presupuesto['estado'] }) {
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

function FilaPresupuesto({
  presupuesto,
  numero,
  cliente,
  expedientes,
  onCambiado,
}: {
  presupuesto: Presupuesto;
  numero: number;
  cliente?: Cliente;
  expedientes: Expediente[];
  onCambiado: () => void;
}) {
  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nombreParte = cliente
    ? `${cliente.apellido}, ${cliente.nombre}`
    : presupuesto.contacto_nombre ?? 'Sin contacto';

  const esFinal = presupuesto.estado === 'firmado';

  async function transicionar(estado: 'enviado' | 'rechazado' | 'vencido') {
    setProcesando(true);
    setError(null);
    try {
      await api.cambiarEstado(presupuesto.id, estado);
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
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{presupuesto.concepto}</div>
          <div style={{ fontSize: 12, color: 'var(--tinta-suave)', marginTop: 2 }}>
            {nombreParte} · {FORMATO_MONTO.format(presupuesto.monto / 100)}
          </div>
        </div>

        {!esFinal && (
          <div style={{ display: 'flex', gap: 6 }}>
            {presupuesto.estado !== 'enviado' && (
              <button style={botonAccion} disabled={procesando} onClick={() => transicionar('enviado')}>
                Enviado
              </button>
            )}
            <button style={botonAccion} disabled={procesando} onClick={() => transicionar('rechazado')}>
              Rechazar
            </button>
            <button style={botonAccion} disabled={procesando} onClick={() => transicionar('vencido')}>
              Vencido
            </button>
            <button
              style={{ ...botonAccion, borderColor: 'var(--exito)', color: 'var(--exito)' }}
              disabled={procesando}
              onClick={() => setMostrarFirma((v) => !v)}
            >
              {mostrarFirma ? 'Cancelar firma' : 'Firmar'}
            </button>
          </div>
        )}

        <EstadoBadge estado={presupuesto.estado} />
      </div>

      {error && (
        <div style={{ color: 'var(--alerta)', fontSize: 12, padding: '0 4px 12px' }}>{error}</div>
      )}

      {mostrarFirma && (
        <FormularioFirma
          presupuesto={presupuesto}
          expedientes={expedientes}
          onFirmado={() => {
            setMostrarFirma(false);
            onCambiado();
          }}
          onCancelar={() => setMostrarFirma(false)}
        />
      )}
    </div>
  );
}

function FormularioFirma({
  presupuesto,
  expedientes,
  onFirmado,
  onCancelar,
}: {
  presupuesto: Presupuesto;
  expedientes: Expediente[];
  onFirmado: () => void;
  onCancelar: () => void;
}) {
  const [expedienteId, setExpedienteId] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const necesitaCliente = !presupuesto.cliente_id;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.firmar(presupuesto.id, {
        expediente_id: expedienteId,
        nombre: necesitaCliente ? nombre : undefined,
        apellido: necesitaCliente ? apellido : undefined,
        dni: necesitaCliente ? dni || undefined : undefined,
      });
      onFirmado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo firmar el presupuesto.');
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
        gridTemplateColumns: necesitaCliente ? '1fr 1fr 1fr' : '1fr',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
        <label htmlFor={`firma-${presupuesto.id}-expediente`} style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Expediente
        </label>
        <select
          id={`firma-${presupuesto.id}-expediente`}
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
      </div>

      {necesitaCliente && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor={`firma-${presupuesto.id}-nombre`} style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
              Nombre
            </label>
            <input
              id={`firma-${presupuesto.id}-nombre`}
              style={campo}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor={`firma-${presupuesto.id}-apellido`} style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
              Apellido
            </label>
            <input
              id={`firma-${presupuesto.id}-apellido`}
              style={campo}
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor={`firma-${presupuesto.id}-dni`} style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
              DNI
            </label>
            <input id={`firma-${presupuesto.id}-dni`} style={campo} value={dni} onChange={(e) => setDni(e.target.value)} />
          </div>
        </>
      )}

      {error && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--alerta)', fontSize: 12 }}>{error}</div>
      )}

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
        <button
          type="submit"
          disabled={enviando || expedientes.length === 0}
          style={{
            background: 'var(--exito)',
            color: 'var(--papel)',
            border: 'none',
            borderRadius: 'var(--radio)',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            opacity: enviando || expedientes.length === 0 ? 0.6 : 1,
          }}
        >
          {enviando ? 'Firmando…' : 'Confirmar firma'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--tinta-suave)',
            fontSize: 13,
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function FormularioNuevoPresupuesto({
  clientes,
  onCreado,
}: {
  clientes: Cliente[];
  onCreado: () => void;
}) {
  const [usaClienteExistente, setUsaClienteExistente] = useState(true);
  const [clienteId, setClienteId] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const montoNumero = Number(monto.replace(',', '.'));
      if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
        throw new Error('El monto debe ser un número mayor a cero.');
      }
      await api.crearPresupuesto({
        cliente_id: usaClienteExistente ? clienteId : undefined,
        contacto_nombre: usaClienteExistente ? undefined : contactoNombre,
        contacto_telefono: usaClienteExistente ? undefined : contactoTelefono || undefined,
        concepto,
        monto: Math.round(montoNumero * 100),
      });
      onCreado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el presupuesto.');
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
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16, fontSize: 13 }}>
        <label htmlFor="nuevo-presupuesto-cliente-existente" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            id="nuevo-presupuesto-cliente-existente"
            type="radio"
            checked={usaClienteExistente}
            onChange={() => setUsaClienteExistente(true)}
          />
          Cliente existente
        </label>
        <label htmlFor="nuevo-presupuesto-contacto-nuevo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            id="nuevo-presupuesto-contacto-nuevo"
            type="radio"
            checked={!usaClienteExistente}
            onChange={() => setUsaClienteExistente(false)}
          />
          Contacto nuevo (potencial cliente)
        </label>
      </div>

      {usaClienteExistente ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
          <label htmlFor="nuevo-presupuesto-cliente" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
            Cliente
          </label>
          <select
            id="nuevo-presupuesto-cliente"
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
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="nuevo-presupuesto-contacto-nombre" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
              Nombre del contacto
            </label>
            <input
              id="nuevo-presupuesto-contacto-nombre"
              style={campo}
              value={contactoNombre}
              onChange={(e) => setContactoNombre(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="nuevo-presupuesto-contacto-telefono" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
              Teléfono
            </label>
            <input
              id="nuevo-presupuesto-contacto-telefono"
              style={campo}
              value={contactoTelefono}
              onChange={(e) => setContactoTelefono(e.target.value)}
            />
          </div>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="nuevo-presupuesto-concepto" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Concepto
        </label>
        <input
          id="nuevo-presupuesto-concepto"
          style={campo}
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          required
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor="nuevo-presupuesto-monto" style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
          Monto ($)
        </label>
        <input
          id="nuevo-presupuesto-monto"
          style={campo}
          type="number"
          min="0"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />
      </div>

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
          {enviando ? 'Guardando…' : 'Guardar presupuesto'}
        </button>
      </div>
    </form>
  );
}
