import { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, type Expediente } from '../api/expedientes';
import { api as clientesApi, type Cliente } from '../api/cliente';
import { PageHeader } from '../componentes/PageHeader';
import { Row } from '../componentes/Row';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';

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
      <PageHeader
        title="Expedientes"
        count={expedientes.length}
        ctaLabel={mostrarFormulario ? 'Cancelar' : '+ Nuevo expediente'}
        onCta={() => setMostrarFormulario((v) => !v)}
      />

      {mostrarFormulario && (
        <FormularioNuevoExpediente
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
      ) : expedientes.length === 0 ? (
        <EmptyState message='Todavía no hay expedientes cargados. Usá "Nuevo expediente" para agregar el primero.' />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {expedientes.map((e, i) => (
            <FilaExpediente key={e.id} expediente={e} index={i + 1} onCambiado={cargar} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function FilaExpediente({
  expediente,
  index,
  onCambiado,
}: {
  expediente: Expediente;
  index: number;
  onCambiado: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estaDeBaja = expediente.estado === 'Archivado';

  async function darDeBaja() {
    const motivo = window.prompt('Motivo de la baja (opcional):');
    if (motivo === null) return;
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
    <div>
      <Row
        index={index}
        to={`/expedientes/${expediente.id}`}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={procesando}
              onClick={(e) => {
                e.preventDefault();
                setEditando((v) => !v);
              }}
              className="rounded-sharp border border-line text-text-gray-light hover:text-white"
            >
              {editando ? 'Cancelar' : 'Editar'}
            </Button>
            {estaDeBaja ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={procesando}
                onClick={(e) => {
                  e.preventDefault();
                  reactivar();
                }}
                className="rounded-sharp border border-success text-success hover:brightness-125"
              >
                Reactivar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={procesando}
                onClick={(e) => {
                  e.preventDefault();
                  darDeBaja();
                }}
                className="rounded-sharp border border-warning text-warning hover:brightness-125"
              >
                Dar de baja
              </Button>
            )}
            <EstadoBadge
              estado={expediente.estado}
              colorMap={{ Activo: 'success', 'En trámite': 'warning', Archivado: 'neutral' }}
            />
          </>
        }
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-bold text-white truncate">{expediente.caratula}</span>
          <span className="text-xs text-text-gray-light font-mono truncate">
            {expediente.cliente_apellido}, {expediente.cliente_nombre}
            {expediente.numero ? ` · Nº ${expediente.numero}` : ''}
            {expediente.fuero ? ` · ${expediente.fuero}` : ''}
          </span>
        </div>
      </Row>

      {error && <div className="text-warning text-xs pb-3">{error}</div>}

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

  return (
    <form
      onSubmit={enviar}
      className="border border-line rounded-sharp p-4 mb-4 bg-graphite grid grid-cols-2 gap-3"
    >
      <div className="flex flex-col gap-1 col-span-2">
        <label htmlFor={`editar-${expediente.id}-caratula`} className={etiquetaClases}>Carátula</label>
        <Input id={`editar-${expediente.id}-caratula`} className={campoClases} value={caratula} onChange={(e) => setCaratula(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`editar-${expediente.id}-numero`} className={etiquetaClases}>Número</label>
        <Input id={`editar-${expediente.id}-numero`} className={campoClases} value={numero} onChange={(e) => setNumero(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`editar-${expediente.id}-fuero`} className={etiquetaClases}>Fuero</label>
        <Input id={`editar-${expediente.id}-fuero`} className={campoClases} value={fuero} onChange={(e) => setFuero(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1 col-span-2">
        <label htmlFor={`editar-${expediente.id}-juzgado`} className={etiquetaClases}>Juzgado</label>
        <Input id={`editar-${expediente.id}-juzgado`} className={campoClases} value={juzgado} onChange={(e) => setJuzgado(e.target.value)} />
      </div>

      {error && <div className="col-span-2 text-warning text-sm">{error}</div>}

      <div className="col-span-2 flex gap-2">
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

  return (
    <form
      onSubmit={enviar}
      className="border border-line rounded-sharp p-5 mb-6 bg-graphite grid grid-cols-2 gap-3"
    >
      {clientes.length === 0 && (
        <div className="col-span-2">
          <ErrorBanner message="Todavía no hay clientes cargados. Creá uno primero en la sección Clientes." />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="nuevo-expediente-cliente" className={etiquetaClases}>Cliente</label>
        <select
          id="nuevo-expediente-cliente"
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
      <div className="flex flex-col gap-1">
        <label htmlFor="nuevo-expediente-caratula" className={etiquetaClases}>Carátula</label>
        <Input id="nuevo-expediente-caratula" className={campoClases} value={caratula} onChange={(e) => setCaratula(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nuevo-expediente-numero" className={etiquetaClases}>Número</label>
        <Input id="nuevo-expediente-numero" className={campoClases} value={numero} onChange={(e) => setNumero(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nuevo-expediente-fuero" className={etiquetaClases}>Fuero</label>
        <Input id="nuevo-expediente-fuero" className={campoClases} value={fuero} onChange={(e) => setFuero(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1 col-span-2">
        <label htmlFor="nuevo-expediente-juzgado" className={etiquetaClases}>Juzgado</label>
        <Input id="nuevo-expediente-juzgado" className={campoClases} value={juzgado} onChange={(e) => setJuzgado(e.target.value)} />
      </div>

      {error && <div className="col-span-2 text-warning text-sm">{error}</div>}

      <div className="col-span-2">
        <Button
          type="submit"
          disabled={enviando || clientes.length === 0}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Guardar expediente'}
        </Button>
      </div>
    </form>
  );
}
