import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { FolderOpenIcon } from 'lucide-react';
import { api, type Expediente } from '../api/expedientes';
import { api as clientesApi, type Cliente } from '../api/cliente';
import { PageHeader } from '../componentes/PageHeader';
import { BarraDeLista } from '../componentes/BarraDeLista';
import { BloqueIcono, FilaLista } from '../componentes/FilaLista';
import { coincide } from '../lib/texto';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { MarcaPortal } from '../componentes/MarcaPortal';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';

type FiltroEstado = 'vigentes' | 'archivados' | 'todos';

export function Expedientes() {
  const navegar = useNavigate();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('vigentes');

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

  const vigentes = expedientes.filter((e) => e.estado !== 'Archivado');
  const visibles = useMemo(
    () =>
      expedientes.filter(
        (e) =>
          (filtro === 'todos' || (filtro === 'archivados') === (e.estado === 'Archivado')) &&
          coincide(busqueda, `${e.caratula} ${e.numero ?? ''} ${e.juzgado ?? ''} ${e.fuero ?? ''} ${e.cliente_apellido} ${e.cliente_nombre}`)
      ),
    [expedientes, filtro, busqueda]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Causas"
        title="Expedientes"
        count={vigentes.length}
        ctaLabel={mostrarFormulario ? 'Cancelar' : '+ Nuevo expediente'}
        onCta={() => setMostrarFormulario((v) => !v)}
      />

      {mostrarFormulario && (
        <FormularioNuevoExpediente
          clientes={clientes}
          // Se abre la ficha del expediente nuevo: ahí aparece la causa del portal con el mismo número, si existe.
          onCreado={(id) => navegar(`/expedientes/${id}`)}
        />
      )}

      {error && <ErrorBanner message={`No se pudo cargar el listado: ${error}`} />}

      {!cargando && expedientes.length > 0 && (
        <BarraDeLista
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          placeholder="Carátula, número, juzgado o cliente"
          etiquetaBusqueda="Buscar un expediente"
          filtro={filtro}
          onFiltro={setFiltro}
          etiquetaFiltro="Estado de los expedientes"
          opciones={[
            { valor: 'vigentes', texto: 'Vigentes', cantidad: vigentes.length },
            { valor: 'archivados', texto: 'Archivados', cantidad: expedientes.length - vigentes.length },
            { valor: 'todos', texto: 'Todos', cantidad: expedientes.length },
          ]}
        />
      )}

      {cargando ? (
        <ListSkeleton rows={6} />
      ) : expedientes.length === 0 ? (
        <EmptyState message='Todavía no hay expedientes cargados. Usá "Nuevo expediente" para agregar el primero, o vinculá las causas que ya leyó el portal desde la ficha de un cliente.' />
      ) : visibles.length === 0 ? (
        <EmptyState
          message="Ningún expediente coincide con la búsqueda."
          accion={
            <Button variant="ghost" onClick={() => { setBusqueda(''); setFiltro('todos'); }} className="rounded-sharp border border-line text-silver hover:text-white">
              Ver todos los expedientes
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {visibles.map((e) => (
            <FilaExpediente key={e.id} expediente={e} onCambiado={cargar} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilaExpediente({ expediente, onCambiado }: { expediente: Expediente; onCambiado: () => void }) {
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

  const detalle = [`${expediente.cliente_apellido}, ${expediente.cliente_nombre}`, expediente.numero ? `N° ${expediente.numero}` : null, expediente.fuero].filter(Boolean).join(' · ');

  return (
    <div>
      <FilaLista
        to={`/expedientes/${expediente.id}`}
        inicio={
          <BloqueIcono>
            <FolderOpenIcon className="h-5 w-5" strokeWidth={1.5} />
          </BloqueIcono>
        }
        lateral={
          <>
            <MarcaPortal causas={expediente.causas_portal} pendientes={expediente.novedades_pendientes} />
            <EstadoBadge estado={expediente.estado} colorMap={{ Activo: 'success', 'En trámite': 'warning', Archivado: 'neutral' }} />
          </>
        }
        acciones={
          <>
            <Button variant="ghost" size="sm" disabled={procesando} onClick={() => setEditando((v) => !v)} className="rounded-sharp border border-line text-text-gray-light hover:text-white">
              {editando ? 'Cancelar' : 'Editar'}
            </Button>
            {estaDeBaja ? (
              <Button variant="ghost" size="sm" disabled={procesando} onClick={reactivar} className="rounded-sharp border border-success text-success hover:brightness-125">
                Reactivar
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled={procesando} onClick={darDeBaja} className="rounded-sharp border border-line text-text-gray-light hover:border-warning hover:text-warning">
                Dar de baja
              </Button>
            )}
          </>
        }
      >
        <div className="line-clamp-2 text-[15px] font-bold leading-snug text-white">{expediente.caratula}</div>
        <div className="mt-0.5 truncate text-xs text-text-gray-light">{detalle}</div>
        {expediente.juzgado && <div className="truncate text-xs text-silver-deep">{expediente.juzgado}</div>}
      </FilaLista>

      {error && <div className="pt-2 text-xs text-warning">{error}</div>}

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
      className="superficie p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <div className="flex flex-col gap-1 sm:col-span-2">
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
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`editar-${expediente.id}-juzgado`} className={etiquetaClases}>Juzgado</label>
        <Input id={`editar-${expediente.id}-juzgado`} className={campoClases} value={juzgado} onChange={(e) => setJuzgado(e.target.value)} />
      </div>

      {error && <div className="sm:col-span-2 text-warning text-sm">{error}</div>}

      <div className="sm:col-span-2 flex gap-2">
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
  onCreado: (id: string) => void;
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
      const creado = await api.crearExpediente({
        cliente_id: clienteId,
        caratula,
        numero: numero || undefined,
        fuero: fuero || undefined,
        juzgado: juzgado || undefined,
      });
      onCreado(creado.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el expediente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="superficie p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {clientes.length === 0 && (
        <div className="sm:col-span-2">
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
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="nuevo-expediente-juzgado" className={etiquetaClases}>Juzgado</label>
        <Input id="nuevo-expediente-juzgado" className={campoClases} value={juzgado} onChange={(e) => setJuzgado(e.target.value)} />
      </div>

      {error && <div className="sm:col-span-2 text-warning text-sm">{error}</div>}

      <div className="sm:col-span-2">
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
