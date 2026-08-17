import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { api as apiExpedientes, type Expediente } from '../api/expedientes';
import { api as apiActuaciones, type Actuacion } from '../api/actuaciones';
import { api as apiTareas, type Tarea } from '../api/tareas';
import { PanelDocumentos } from '../componentes/PanelDocumentos';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { Input } from '@/componentes/ui/input';
import { Textarea } from '@/componentes/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';

function formatearFechaISO(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

function fechaISOVencida(fechaISO: string): boolean {
  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date());
  return fechaISO.slice(0, 10) < hoy;
}

export function ExpedienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actuaciones, setActuaciones] = useState<Actuacion[]>([]);
  const [cargandoActuaciones, setCargandoActuaciones] = useState(true);
  const [errorActuaciones, setErrorActuaciones] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargandoTareas, setCargandoTareas] = useState(true);
  const [errorTareas, setErrorTareas] = useState<string | null>(null);
  const [mostrarFormularioTarea, setMostrarFormularioTarea] = useState(false);

  function cargarExpediente() {
    if (!id) return;
    setCargando(true);
    setError(null);
    apiExpedientes
      .obtenerExpediente(id)
      .then(setExpediente)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }

  function cargarActuaciones() {
    if (!id) return;
    setCargandoActuaciones(true);
    setErrorActuaciones(null);
    apiActuaciones
      .listarActuaciones(id)
      .then(setActuaciones)
      .catch((e: Error) => setErrorActuaciones(e.message))
      .finally(() => setCargandoActuaciones(false));
  }

  function cargarTareas() {
    if (!id) return;
    setCargandoTareas(true);
    setErrorTareas(null);
    apiTareas
      .listarTareas(id)
      .then(setTareas)
      .catch((e: Error) => setErrorTareas(e.message))
      .finally(() => setCargandoTareas(false));
  }

  useEffect(cargarExpediente, [id]);
  useEffect(cargarActuaciones, [id]);
  useEffect(cargarTareas, [id]);

  async function notificar(actuacionId: string) {
    await apiActuaciones.notificarActuacion(actuacionId);
    setActuaciones((actuales) =>
      actuales.map((a) => (a.id === actuacionId ? { ...a, notificado: 1, visible: 1 } : a))
    );
  }

  async function completarTarea(tareaId: string) {
    const anteriores = tareas;
    setTareas((actuales) =>
      actuales.map((t) =>
        t.id === tareaId ? { ...t, estado: 'Completada', completado_en: Date.now() } : t
      )
    );
    try {
      await apiTareas.cambiarEstadoTarea(tareaId, 'Completada');
    } catch (e) {
      setTareas(anteriores);
      setErrorTareas(e instanceof Error ? e.message : 'No se pudo actualizar la tarea.');
    }
  }

  if (cargando) {
    return (
      <div>
        <VolverAExpedientes />
        <div className="mt-4">
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <VolverAExpedientes />
        <div className="mt-4">
          <ErrorBanner message={`No se pudo cargar el expediente: ${error}`} />
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

      <header className="flex items-start justify-between gap-4 mt-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-black uppercase tracking-wide text-white break-words">
            {expediente.caratula}
          </h1>
          <p className="text-sm text-text-gray-light mt-1">
            {expediente.cliente_apellido}, {expediente.cliente_nombre}
          </p>
        </div>
        <EstadoBadge
          estado={expediente.estado}
          colorMap={{ Activo: 'success', 'En trámite': 'warning', Archivado: 'neutral' }}
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Actuaciones</h2>
            <Button
              onClick={() => setMostrarFormulario(true)}
              className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver"
            >
              + Nueva actuación
            </Button>
          </div>

          {errorActuaciones && (
            <ErrorBanner message={`No se pudo cargar la línea de tiempo: ${errorActuaciones}`} />
          )}

          {cargandoActuaciones ? (
            <ListSkeleton rows={4} />
          ) : actuaciones.length === 0 ? (
            <EmptyState message='Todavía no hay actuaciones cargadas. Usá "Nueva actuación" para registrar la primera.' />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            >
              {actuaciones.map((actuacion) => (
                <FilaActuacion key={actuacion.id} actuacion={actuacion} onNotificar={notificar} />
              ))}
            </motion.div>
          )}

          <div className="flex items-center justify-between mb-3 mt-8">
            <h2 className="text-lg font-bold text-white">Tareas</h2>
            <Button
              onClick={() => setMostrarFormularioTarea(true)}
              className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver"
            >
              + Nueva tarea
            </Button>
          </div>

          {errorTareas && <ErrorBanner message={`No se pudieron cargar las tareas: ${errorTareas}`} />}

          {cargandoTareas ? (
            <ListSkeleton rows={3} />
          ) : tareas.length === 0 ? (
            <EmptyState message='Todavía no hay tareas cargadas. Usá "Nueva tarea" para crear la primera.' />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            >
              {tareas.map((tarea) => (
                <FilaTarea key={tarea.id} tarea={tarea} onCompletar={completarTarea} />
              ))}
            </motion.div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <section className="border border-line rounded-sharp bg-graphite p-4">
            <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Datos</h2>
            <div className="flex flex-col gap-3">
              <Dato etiqueta="Número" valor={expediente.numero} />
              <Dato etiqueta="Fuero" valor={expediente.fuero} />
              <Dato etiqueta="Juzgado" valor={expediente.juzgado} />
              <Dato etiqueta="Departamento judicial" valor={expediente.departamento} />
              <Dato etiqueta="Rol procesal" valor={expediente.rol_procesal} />
              <Dato etiqueta="Inicio" valor={expediente.inicio} />
            </div>
            {expediente.notas && (
              <div className="mt-4 pt-3 border-t border-line">
                <div className="text-xs text-text-gray-light mb-1">Notas</div>
                <p className="text-sm text-white">{expediente.notas}</p>
              </div>
            )}
          </section>

          <PanelDocumentos expedienteId={id} />
        </div>
      </div>

      <FormularioNuevaActuacion
        abierto={mostrarFormulario}
        expedienteId={id!}
        onCerrar={() => setMostrarFormulario(false)}
        onGuardado={() => {
          setMostrarFormulario(false);
          cargarActuaciones();
        }}
      />

      <FormularioNuevaTarea
        abierto={mostrarFormularioTarea}
        expedienteId={id!}
        onCerrar={() => setMostrarFormularioTarea(false)}
        onGuardado={() => {
          setMostrarFormularioTarea(false);
          cargarTareas();
        }}
      />
    </div>
  );
}

function VolverAExpedientes() {
  return (
    <Link to="/expedientes" className="text-sm text-silver hover:brightness-125 no-underline">
      ← Volver a expedientes
    </Link>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div>
      <div className="text-xs text-text-gray-light mb-0.5">{etiqueta}</div>
      <div className="text-sm font-medium text-white">{valor ?? '—'}</div>
    </div>
  );
}

function FilaActuacion({
  actuacion,
  onNotificar,
}: {
  actuacion: Actuacion;
  onNotificar: (id: string) => Promise<void>;
}) {
  const [abierta, setAbierta] = useState(false);
  const [notificando, setNotificando] = useState(false);
  const esHito = actuacion.hito === 1;
  const vencida = actuacion.vencimiento != null && fechaISOVencida(actuacion.vencimiento);

  async function notificar(e: React.MouseEvent) {
    e.stopPropagation();
    setNotificando(true);
    try {
      await onNotificar(actuacion.id);
    } finally {
      setNotificando(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`border-b border-line py-4 ${esHito ? 'border-l-2 border-l-silver pl-3' : ''}`}
    >
      <button
        onClick={() => setAbierta((v) => !v)}
        className="w-full flex items-center justify-between gap-4 text-left bg-transparent border-none p-0 cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{actuacion.tipo}</span>
            {esHito && (
              <Badge variant="outline" className="rounded-sharp uppercase text-xs border-silver text-silver">
                Hito
              </Badge>
            )}
            {actuacion.notificado === 1 && (
              <Badge variant="outline" className="rounded-sharp uppercase text-xs border-success text-success">
                Notificado
              </Badge>
            )}
            {actuacion.vencimiento &&
              (vencida && actuacion.notificado !== 1 ? (
                <Badge className="rounded-sharp uppercase text-xs bg-warning text-structural-black border-warning">
                  Vencida: {formatearFechaISO(actuacion.vencimiento)}
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-sharp uppercase text-xs border-warning text-warning">
                  Vence: {formatearFechaISO(actuacion.vencimiento)}
                </Badge>
              ))}
          </div>
          <span className="text-xs text-text-gray-light font-mono">
            {formatearFechaISO(actuacion.fecha)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actuacion.notificado !== 1 && (
            <Button
              onClick={notificar}
              disabled={notificando}
              variant="ghost"
              size="sm"
              className="rounded-sharp border border-line text-text-gray-light hover:text-white"
            >
              {notificando ? 'Notificando…' : 'Notificar al cliente'}
            </Button>
          )}
          <span className="text-text-gray-light text-xs">{abierta ? '▲' : '▼'}</span>
        </div>
      </button>

      <AnimatePresence>
        {abierta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex flex-col gap-2">
              {actuacion.detalle_interno && (
                <div>
                  <div className="text-xs text-text-gray-light mb-0.5">Detalle interno</div>
                  <p className="text-sm text-white whitespace-pre-wrap">{actuacion.detalle_interno}</p>
                </div>
              )}
              {actuacion.texto_cliente && (
                <div>
                  <div className="text-xs text-text-gray-light mb-0.5">Texto para el cliente</div>
                  <p className="text-sm text-white whitespace-pre-wrap">{actuacion.texto_cliente}</p>
                </div>
              )}
              {!actuacion.detalle_interno && !actuacion.texto_cliente && (
                <p className="text-sm text-text-gray-light italic">Sin detalle cargado.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FormularioNuevaActuacion({
  abierto,
  expedienteId,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  expedienteId: string;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [tipo, setTipo] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [vencimiento, setVencimiento] = useState('');
  const [detalleInterno, setDetalleInterno] = useState('');
  const [textoCliente, setTextoCliente] = useState('');
  const [hito, setHito] = useState(false);
  const [visible, setVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function limpiar() {
    setTipo('');
    setFecha(new Date().toISOString().slice(0, 10));
    setVencimiento('');
    setDetalleInterno('');
    setTextoCliente('');
    setHito(false);
    setVisible(false);
    setError(null);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await apiActuaciones.crearActuacion({
        expediente_id: expedienteId,
        tipo,
        fecha,
        vencimiento: vencimiento || undefined,
        detalle_interno: detalleInterno || undefined,
        texto_cliente: textoCliente || undefined,
        hito,
        visible,
      });
      limpiar();
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la actuación.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva actuación</DialogTitle>
        </DialogHeader>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="act-tipo" className={etiquetaClases}>Tipo</label>
            <Input id="act-tipo" className={campoClases} value={tipo} onChange={(e) => setTipo(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="act-fecha" className={etiquetaClases}>Fecha</label>
            <Input id="act-fecha" type="date" className={campoClases} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="act-vencimiento" className={etiquetaClases}>Vencimiento</label>
            <Input
              id="act-vencimiento"
              type="date"
              className={campoClases}
              value={vencimiento}
              onChange={(e) => setVencimiento(e.target.value)}
            />
            <p className="text-xs text-text-gray-light">
              Fecha límite para actuar (la cargás vos; el sistema no la calcula).
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="act-detalle" className={etiquetaClases}>Detalle interno</label>
            <Textarea id="act-detalle" className={`${campoClases} resize-y min-h-[60px]`} value={detalleInterno} onChange={(e) => setDetalleInterno(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="act-texto-cliente" className={etiquetaClases}>Texto para el cliente</label>
            <Textarea id="act-texto-cliente" className={`${campoClases} resize-y min-h-[60px]`} value={textoCliente} onChange={(e) => setTextoCliente(e.target.value)} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input type="checkbox" checked={hito} onChange={(e) => setHito(e.target.checked)} className="accent-silver" />
              Es un hito
            </label>
            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="accent-silver" />
              Visible para el cliente
            </label>
          </div>

          {error && <ErrorBanner message={error} />}

          <DialogFooter>
            <Button
              type="submit"
              disabled={enviando}
              className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
            >
              {enviando ? 'Guardando…' : 'Guardar actuación'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-sharp border border-line text-text-gray-light hover:text-white"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FilaTarea({
  tarea,
  onCompletar,
}: {
  tarea: Tarea;
  onCompletar: (id: string) => Promise<void>;
}) {
  const [completando, setCompletando] = useState(false);
  const completada = tarea.estado === 'Completada';
  const vencida =
    !completada && tarea.fecha_limite != null && fechaISOVencida(tarea.fecha_limite);

  async function completar() {
    setCompletando(true);
    try {
      await onCompletar(tarea.id);
    } finally {
      setCompletando(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 border-b border-line py-3"
    >
      <input
        type="checkbox"
        checked={completada}
        disabled={completada || completando}
        onChange={completar}
        className="accent-silver shrink-0 w-4 h-4 cursor-pointer disabled:cursor-default"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${completada ? 'text-text-gray-light line-through' : 'text-white'}`}>
            {tarea.titulo}
          </span>
          <Badge
            variant="outline"
            className={`rounded-sharp uppercase text-xs ${
              completada
                ? 'border-success text-success'
                : vencida
                  ? 'border-warning text-warning'
                  : 'border-line text-text-gray-light'
            }`}
          >
            {tarea.estado}
          </Badge>
        </div>
        {tarea.fecha_limite && (
          <span className={`text-xs font-mono ${vencida ? 'text-warning' : 'text-text-gray-light'}`}>
            Vence: {formatearFechaISO(tarea.fecha_limite)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function FormularioNuevaTarea({
  abierto,
  expedienteId,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  expedienteId: string;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function limpiar() {
    setTitulo('');
    setDescripcion('');
    setFechaLimite('');
    setError(null);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await apiTareas.crearTarea({
        expediente_id: expedienteId,
        titulo,
        descripcion: descripcion || undefined,
        fecha_limite: fechaLimite || undefined,
      });
      limpiar();
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la tarea.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
        </DialogHeader>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="tarea-titulo" className={etiquetaClases}>Título</label>
            <Input
              id="tarea-titulo"
              className={campoClases}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="tarea-descripcion" className={etiquetaClases}>Descripción</label>
            <Textarea
              id="tarea-descripcion"
              className={`${campoClases} resize-y min-h-[60px]`}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="tarea-fecha-limite" className={etiquetaClases}>Fecha límite</label>
            <Input
              id="tarea-fecha-limite"
              type="date"
              className={campoClases}
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
            />
          </div>

          {error && <ErrorBanner message={error} />}

          <DialogFooter>
            <Button
              type="submit"
              disabled={enviando}
              className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
            >
              {enviando ? 'Guardando…' : 'Guardar tarea'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-sharp border border-line text-text-gray-light hover:text-white"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
