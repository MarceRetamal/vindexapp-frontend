import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, type Presupuesto } from '../api/presupuestos';
import { api as clientesApi, type Cliente } from '../api/cliente';
import { api as expedientesApi, type Expediente } from '../api/expedientes';
import { PageHeader } from '../componentes/PageHeader';
import { Row } from '../componentes/Row';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';

const FORMATO_MONTO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';

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
      <PageHeader
        title="Presupuestos"
        count={presupuestos.length}
        ctaLabel={mostrarFormulario ? 'Cancelar' : '+ Nuevo presupuesto'}
        onCta={() => setMostrarFormulario((v) => !v)}
      />

      {mostrarFormulario && (
        <FormularioNuevoPresupuesto
          clientes={clientes}
          onCreado={() => {
            setMostrarFormulario(false);
            cargar();
          }}
        />
      )}

      {error && <ErrorBanner message={`No se pudo cargar el listado: ${error}`} />}

      {cargando ? (
        <ListSkeleton rows={6} />
      ) : presupuestos.length === 0 ? (
        <EmptyState message='Todavía no hay presupuestos cargados. Usá "Nuevo presupuesto" para agregar el primero.' />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {presupuestos.map((p, i) => (
            <FilaPresupuesto
              key={p.id}
              presupuesto={p}
              index={i + 1}
              cliente={p.cliente_id ? clientesPorId.get(p.cliente_id) : undefined}
              expedientes={expedientes}
              onCambiado={cargar}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function FilaPresupuesto({
  presupuesto,
  index,
  cliente,
  expedientes,
  onCambiado,
}: {
  presupuesto: Presupuesto;
  index: number;
  cliente?: Cliente;
  expedientes: Expediente[];
  onCambiado: () => void;
}) {
  const [mostrarFirma, setMostrarFirma] = useState(false);
  const [editando, setEditando] = useState(false);
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

  async function eliminar() {
    if (!window.confirm(`¿Eliminar el presupuesto "${presupuesto.concepto}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setProcesando(true);
    setError(null);
    try {
      await api.eliminarPresupuesto(presupuesto.id);
      onCambiado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el presupuesto.');
      setProcesando(false);
    }
  }

  return (
    <div>
      <Row
        index={index}
        to="/presupuestos"
        actions={
          <>
            {!esFinal && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={procesando}
                  onClick={(e) => {
                    e.preventDefault();
                    setEditando((v) => !v);
                    setMostrarFirma(false);
                  }}
                  className="rounded-sharp border border-line text-text-gray-light hover:text-white"
                >
                  {editando ? 'Cancelar edición' : 'Editar'}
                </Button>
                {presupuesto.estado !== 'enviado' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={procesando}
                    onClick={(e) => {
                      e.preventDefault();
                      transicionar('enviado');
                    }}
                    className="rounded-sharp border border-line text-text-gray-light hover:text-white"
                  >
                    Enviado
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={procesando}
                  onClick={(e) => {
                    e.preventDefault();
                    transicionar('rechazado');
                  }}
                  className="rounded-sharp border border-line text-text-gray-light hover:text-white"
                >
                  Rechazar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={procesando}
                  onClick={(e) => {
                    e.preventDefault();
                    transicionar('vencido');
                  }}
                  className="rounded-sharp border border-line text-text-gray-light hover:text-white"
                >
                  Vencido
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={procesando}
                  onClick={(e) => {
                    e.preventDefault();
                    setMostrarFirma((v) => !v);
                    setEditando(false);
                  }}
                  className="rounded-sharp border border-success text-success hover:brightness-125"
                >
                  {mostrarFirma ? 'Cancelar firma' : 'Firmar'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={procesando}
                  onClick={(e) => {
                    e.preventDefault();
                    eliminar();
                  }}
                  className="rounded-sharp border border-warning text-warning hover:brightness-125"
                >
                  Eliminar
                </Button>
              </>
            )}
            <EstadoBadge
              estado={presupuesto.estado}
              colorMap={{
                borrador: 'neutral',
                enviado: 'warning',
                firmado: 'success',
                rechazado: 'warning',
                vencido: 'neutral',
              }}
            />
          </>
        }
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-bold text-white truncate">{presupuesto.concepto}</span>
          <span className="text-xs text-text-gray-light font-mono truncate">
            {nombreParte} · {FORMATO_MONTO.format(presupuesto.monto / 100)}
          </span>
        </div>
      </Row>

      {error && <div className="text-warning text-xs pb-3">{error}</div>}

      {editando && (
        <FormularioEditarPresupuesto
          presupuesto={presupuesto}
          onGuardado={() => {
            setEditando(false);
            onCambiado();
          }}
          onCancelar={() => setEditando(false)}
        />
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

function FormularioEditarPresupuesto({
  presupuesto,
  onGuardado,
  onCancelar,
}: {
  presupuesto: Presupuesto;
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [concepto, setConcepto] = useState(presupuesto.concepto);
  const [monto, setMonto] = useState((presupuesto.monto / 100).toFixed(2));
  const [contactoNombre, setContactoNombre] = useState(presupuesto.contacto_nombre ?? '');
  const [contactoTelefono, setContactoTelefono] = useState(presupuesto.contacto_telefono ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const necesitaContacto = !presupuesto.cliente_id;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const montoNumero = Number(monto.replace(',', '.'));
      if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
        throw new Error('El monto debe ser un número mayor a cero.');
      }
      await api.editarPresupuesto(presupuesto.id, {
        concepto,
        monto: Math.round(montoNumero * 100),
        contacto_nombre: necesitaContacto ? contactoNombre : undefined,
        contacto_telefono: necesitaContacto ? contactoTelefono || undefined : undefined,
      });
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar los cambios.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className={`border border-line rounded-sharp p-4 mb-4 bg-graphite grid gap-3 ${
        necesitaContacto ? 'grid-cols-3' : 'grid-cols-2'
      }`}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`editar-${presupuesto.id}-concepto`} className={etiquetaClases}>Concepto</label>
        <Input id={`editar-${presupuesto.id}-concepto`} className={campoClases} value={concepto} onChange={(e) => setConcepto(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`editar-${presupuesto.id}-monto`} className={etiquetaClases}>Monto ($)</label>
        <Input id={`editar-${presupuesto.id}-monto`} type="number" min="0" step="0.01" className={campoClases} value={monto} onChange={(e) => setMonto(e.target.value)} required />
      </div>

      {necesitaContacto && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`editar-${presupuesto.id}-contacto`} className={etiquetaClases}>Contacto</label>
          <Input id={`editar-${presupuesto.id}-contacto`} className={campoClases} value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} placeholder="Nombre" />
          <Input className={`${campoClases} mt-1.5`} value={contactoTelefono} onChange={(e) => setContactoTelefono(e.target.value)} placeholder="Teléfono" />
        </div>
      )}

      {error && <div className="col-span-full text-warning text-sm">{error}</div>}

      <div className="col-span-full flex gap-2">
        <Button
          type="submit"
          disabled={enviando}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancelar}
          disabled={enviando}
          className="rounded-sharp border border-line text-text-gray-light hover:text-white"
        >
          Cancelar
        </Button>
      </div>
    </form>
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

  return (
    <form
      onSubmit={enviar}
      className={`border border-line rounded-sharp p-4 mb-4 bg-graphite grid gap-3 ${
        necesitaCliente ? 'grid-cols-3' : 'grid-cols-1'
      }`}
    >
      <div className="flex flex-col gap-1 col-span-full">
        <label htmlFor={`firma-${presupuesto.id}-expediente`} className={etiquetaClases}>Expediente</label>
        <select
          id={`firma-${presupuesto.id}-expediente`}
          value={expedienteId}
          onChange={(e) => setExpedienteId(e.target.value)}
          required
          className={`${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`}
        >
          <option value="" disabled>Elegí un expediente</option>
          {expedientes.map((e) => (
            <option key={e.id} value={e.id} className="bg-graphite text-white">
              {e.caratula}
            </option>
          ))}
        </select>
      </div>

      {necesitaCliente && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor={`firma-${presupuesto.id}-nombre`} className={etiquetaClases}>Nombre</label>
            <Input id={`firma-${presupuesto.id}-nombre`} className={campoClases} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`firma-${presupuesto.id}-apellido`} className={etiquetaClases}>Apellido</label>
            <Input id={`firma-${presupuesto.id}-apellido`} className={campoClases} value={apellido} onChange={(e) => setApellido(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`firma-${presupuesto.id}-dni`} className={etiquetaClases}>DNI</label>
            <Input id={`firma-${presupuesto.id}-dni`} className={campoClases} value={dni} onChange={(e) => setDni(e.target.value)} />
          </div>
        </>
      )}

      {error && <div className="col-span-full text-warning text-sm">{error}</div>}

      <div className="col-span-full flex gap-2">
        <Button
          type="submit"
          disabled={enviando || expedientes.length === 0}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
        >
          {enviando ? 'Firmando…' : 'Confirmar firma'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancelar}
          disabled={enviando}
          className="rounded-sharp border border-line text-text-gray-light hover:text-white"
        >
          Cancelar
        </Button>
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

  return (
    <form
      onSubmit={enviar}
      className="border border-line rounded-sharp p-5 mb-6 bg-graphite grid grid-cols-2 gap-3"
    >
      <div className="col-span-2 flex gap-4 text-sm text-white">
        <label htmlFor="nuevo-presupuesto-cliente-existente" className="flex items-center gap-1.5 cursor-pointer">
          <input
            id="nuevo-presupuesto-cliente-existente"
            type="radio"
            checked={usaClienteExistente}
            onChange={() => setUsaClienteExistente(true)}
            className="accent-silver"
          />
          Cliente existente
        </label>
        <label htmlFor="nuevo-presupuesto-contacto-nuevo" className="flex items-center gap-1.5 cursor-pointer">
          <input
            id="nuevo-presupuesto-contacto-nuevo"
            type="radio"
            checked={!usaClienteExistente}
            onChange={() => setUsaClienteExistente(false)}
            className="accent-silver"
          />
          Contacto nuevo (potencial cliente)
        </label>
      </div>

      {usaClienteExistente ? (
        <div className="flex flex-col gap-1 col-span-2">
          <label htmlFor="nuevo-presupuesto-cliente" className={etiquetaClases}>Cliente</label>
          <select
            id="nuevo-presupuesto-cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className={`${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`}
          >
            <option value="" disabled>Elegí un cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id} className="bg-graphite text-white">
                {c.apellido}, {c.nombre}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="nuevo-presupuesto-contacto-nombre" className={etiquetaClases}>Nombre del contacto</label>
            <Input id="nuevo-presupuesto-contacto-nombre" className={campoClases} value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="nuevo-presupuesto-contacto-telefono" className={etiquetaClases}>Teléfono</label>
            <Input id="nuevo-presupuesto-contacto-telefono" className={campoClases} value={contactoTelefono} onChange={(e) => setContactoTelefono(e.target.value)} />
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="nuevo-presupuesto-concepto" className={etiquetaClases}>Concepto</label>
        <Input id="nuevo-presupuesto-concepto" className={campoClases} value={concepto} onChange={(e) => setConcepto(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nuevo-presupuesto-monto" className={etiquetaClases}>Monto ($)</label>
        <Input id="nuevo-presupuesto-monto" type="number" min="0" step="0.01" className={campoClases} value={monto} onChange={(e) => setMonto(e.target.value)} required />
      </div>

      {error && <div className="col-span-2 text-warning text-sm">{error}</div>}

      <div className="col-span-2">
        <Button
          type="submit"
          disabled={enviando}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Guardar presupuesto'}
        </Button>
      </div>
    </form>
  );
}
