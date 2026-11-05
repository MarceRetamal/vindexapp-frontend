import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { api, type TareaListado } from '../api/tareas';
import { api as clientesApi, type Cliente } from '../api/cliente';
import { api as alertasApi, mensajeDeError } from '../api/alertas';
import { PageHeader } from '../componentes/PageHeader';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { BotonEliminar } from '../componentes/BotonEliminar';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Textarea } from '@/componentes/ui/textarea';

// Sugerencias para el tipo de gestión. Es texto libre: la lista de tipos no está cerrada.
const TIPOS_SUGERIDOS = ['Llamado', 'Email', 'Mensaje', 'Acuerdo extrajudicial', 'Reunión', 'Trámite'];

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
const botonClases = 'rounded-sharp border border-line text-text-gray-light hover:text-white';

type FiltroEstado = 'pendientes' | 'completadas' | 'todas';
type FiltroOrigen = 'todas' | 'extrajudiciales' | 'judiciales';

function hoyEnArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}

function formatearFecha(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

export function Tareas() {
  const [tareas, setTareas] = useState<TareaListado[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('pendientes');
  const [filtroOrigen, setFiltroOrigen] = useState<FiltroOrigen>('todas');

  function cargar() {
    setCargando(true);
    setError(null);
    api
      .listarTodas()
      .then(setTareas)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // Los clientes solo alimentan el selector del formulario: si fallan, se puede cargar la tarea sin cliente.
    clientesApi.listarClientes().then(setClientes).catch(() => setClientes([]));
  }, []);

  const pendientes = tareas.filter((t) => t.estado !== 'Completada');
  const visibles = tareas.filter(
    (t) =>
      (filtroEstado === 'todas' || (filtroEstado === 'completadas') === (t.estado === 'Completada')) &&
      (filtroOrigen === 'todas' || (filtroOrigen === 'judiciales') === (t.expediente_id !== null))
  );

  return (
    <div>
      <PageHeader
        title="Tareas"
        count={pendientes.length}
        ctaLabel={mostrarFormulario ? 'Cancelar' : '+ Nueva tarea'}
        onCta={() => setMostrarFormulario((v) => !v)}
      />

      {mostrarFormulario && (
        <FormularioTarea
          clientes={clientes}
          onGuardado={() => {
            setMostrarFormulario(false);
            cargar();
          }}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
        <Pestanas
          etiqueta="Estado de las tareas"
          valor={filtroEstado}
          opciones={[
            ['pendientes', 'Pendientes'],
            ['completadas', 'Completadas'],
            ['todas', 'Todas'],
          ]}
          onCambio={setFiltroEstado}
        />
        <Pestanas
          etiqueta="Origen de las tareas"
          valor={filtroOrigen}
          opciones={[
            ['todas', 'Todas'],
            ['extrajudiciales', 'Extrajudiciales'],
            ['judiciales', 'De expedientes'],
          ]}
          onCambio={setFiltroOrigen}
        />
      </div>

      <ResumenAgenda onError={setError} />

      {error && <ErrorBanner message={`No se pudo completar la operación: ${error}`} />}

      {cargando ? (
        <ListSkeleton rows={6} />
      ) : visibles.length === 0 ? (
        <EmptyState
          message={
            tareas.length === 0
              ? 'Todavía no hay tareas. Usá "Nueva tarea" para anotar un llamado, un mail o un acuerdo pendiente.'
              : 'No hay tareas con estos filtros.'
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {visibles.map((t) => (
            <FilaTarea key={t.id} tarea={t} clientes={clientes} onCambiado={cargar} onError={setError} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

/** Estado del resumen diario de agenda por WhatsApp y botón para probarlo. */
function ResumenAgenda({ onError }: { onError: (mensaje: string | null) => void }) {
  const [activo, setActivo] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    alertasApi
      .obtenerEstado()
      .then((r) => setActivo(r.whatsapp.configurado && r.whatsapp.estudio_correcto && Boolean(r.agenda?.plantilla)))
      .catch(() => setActivo(false));
  }, []);

  async function probar() {
    if (!window.confirm('Se enviará ahora por WhatsApp el resumen de agenda de hoy. ¿Seguimos?')) return;
    setEnviando(true);
    onError(null);
    setAviso(null);
    try {
      const r = await alertasApi.enviarAgendaPrueba();
      setAviso(`Resumen enviado (${r.pendientes} ${r.pendientes === 1 ? 'pendiente' : 'pendientes'}). Revisá tu WhatsApp.`);
    } catch (e) {
      onError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  if (activo === null) return null;
  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3 text-xs text-text-gray-light">
        <span>
          {activo
            ? 'Resumen diario por WhatsApp: todos los días desde las 8 te llega lo vencido y lo que vence hoy, mañana y pasado (tareas, audiencias y vencimientos).'
            : 'El resumen diario de agenda por WhatsApp no está configurado.'}
        </span>
        {activo && (
          <Button variant="ghost" size="sm" onClick={probar} disabled={enviando} className={botonClases}>
            {enviando ? 'Enviando…' : 'Enviar resumen de prueba'}
          </Button>
        )}
      </div>
      {aviso && <div className="border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm">{aviso}</div>}
    </div>
  );
}

function Pestanas<T extends string>({
  etiqueta,
  valor,
  opciones,
  onCambio,
}: {
  etiqueta: string;
  valor: T;
  opciones: [T, string][];
  onCambio: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label={etiqueta}>
      {opciones.map(([v, texto]) => (
        <Button
          key={v}
          role="tab"
          aria-selected={valor === v}
          variant="ghost"
          size="sm"
          onClick={() => onCambio(v)}
          className={`rounded-sharp border ${
            valor === v ? 'border-silver text-white font-bold' : 'border-line text-text-gray-light hover:text-white'
          }`}
        >
          {texto}
        </Button>
      ))}
    </div>
  );
}

function FilaTarea({
  tarea,
  clientes,
  onCambiado,
  onError,
}: {
  tarea: TareaListado;
  clientes: Cliente[];
  onCambiado: () => void;
  onError: (mensaje: string | null) => void;
}) {
  const [procesando, setProcesando] = useState(false);
  const [editando, setEditando] = useState(false);

  const completada = tarea.estado === 'Completada';
  const hoy = hoyEnArgentina();
  const vencida = !completada && tarea.fecha_limite !== null && tarea.fecha_limite < hoy;
  const venceHoy = !completada && tarea.fecha_limite === hoy;
  const cliente = tarea.cliente_apellido ? `${tarea.cliente_apellido}, ${tarea.cliente_nombre ?? ''}` : null;

  async function cambiarEstado() {
    setProcesando(true);
    onError(null);
    try {
      await api.cambiarEstadoTarea(tarea.id, completada ? 'Pendiente' : 'Completada');
      onCambiado();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo actualizar la tarea.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`py-4 border-b border-line ${vencida ? 'border-l-2 border-l-warning pl-3' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-silver-deep border border-line rounded-sharp px-2 py-0.5">
              {tarea.expediente_id ? 'Expediente' : (tarea.tipo ?? 'Extrajudicial')}
            </span>
            {vencida && <EstadoBadge estado="Vencida" colorMap={{ Vencida: 'warning' }} />}
            {venceHoy && <EstadoBadge estado="Vence hoy" colorMap={{ 'Vence hoy': 'warning' }} />}
            {completada && <EstadoBadge estado="Completada" colorMap={{ Completada: 'success' }} />}
          </div>
          <div className={`font-medium break-words ${completada ? 'text-text-gray-light line-through' : 'text-white'}`}>
            {tarea.titulo}
          </div>
          {tarea.expediente_id && (
            <Link
              to={`/expedientes/${tarea.expediente_id}`}
              className="text-xs text-text-gray-light hover:text-white underline-offset-4 hover:underline break-words"
            >
              {tarea.expediente_caratula ?? 'Ver expediente'}
            </Link>
          )}
          {cliente && <div className="text-xs text-text-gray-light">Cliente: {cliente}</div>}
          {tarea.descripcion && <p className="text-sm text-silver whitespace-pre-wrap break-words">{tarea.descripcion}</p>}
          {tarea.fecha_limite && (
            <div className={`text-xs font-mono ${vencida || venceHoy ? 'text-warning' : 'text-text-gray-light'}`}>
              Fecha límite {formatearFecha(tarea.fecha_limite)}
            </div>
          )}
        </div>
        <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:shrink-0">
          <Button variant="ghost" size="sm" disabled={procesando} onClick={cambiarEstado} className={botonClases}>
            {completada ? 'Volver a pendiente' : 'Marcar hecha'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditando((v) => !v)} className={botonClases}>
            {editando ? 'Cancelar edición' : 'Editar'}
          </Button>
          <BotonEliminar
            descripcion={`la tarea "${tarea.titulo}"`}
            eliminar={() => api.eliminarTarea(tarea.id)}
            alEliminar={onCambiado}
            alFallar={onError}
          />
        </div>
      </div>

      {editando && (
        <div className="mt-3">
          <FormularioTarea
            tarea={tarea}
            clientes={clientes}
            onGuardado={() => {
              setEditando(false);
              onCambiado();
            }}
            onCancelar={() => setEditando(false)}
          />
        </div>
      )}
    </motion.article>
  );
}

/** Alta de una tarea extrajudicial, o edición de una existente (judicial o extrajudicial) si recibe `tarea`. */
function FormularioTarea({
  tarea,
  clientes,
  onGuardado,
  onCancelar,
}: {
  tarea?: TareaListado;
  clientes: Cliente[];
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState(tarea?.titulo ?? '');
  const [tipo, setTipo] = useState(tarea?.tipo ?? '');
  const [clienteId, setClienteId] = useState(tarea?.cliente_id ?? '');
  const [fecha, setFecha] = useState(tarea?.fecha_limite ?? '');
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefijo = tarea ? `editar-${tarea.id}` : 'nueva-tarea';

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      if (tarea) {
        await api.editarTarea(tarea.id, {
          titulo,
          tipo: tipo || null,
          cliente_id: clienteId || null,
          fecha_limite: fecha || null,
          descripcion: descripcion || null,
        });
      } else {
        await api.crearTareaExtrajudicial({
          titulo,
          tipo: tipo || undefined,
          cliente_id: clienteId || undefined,
          fecha_limite: fecha || undefined,
          descripcion: descripcion || undefined,
        });
      }
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la tarea.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="border border-line rounded-sharp p-4 sm:p-5 mb-6 bg-graphite grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`${prefijo}-titulo`} className={etiquetaClases}>Qué hay que hacer</label>
        <Input
          id={`${prefijo}-titulo`}
          className={campoClases}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej.: llamar al Dr. Pérez por la propuesta de acuerdo"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-tipo`} className={etiquetaClases}>Tipo</label>
        <Input
          id={`${prefijo}-tipo`}
          className={campoClases}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          list={`${prefijo}-tipos`}
          placeholder="Llamado, email, mensaje…"
        />
        <datalist id={`${prefijo}-tipos`}>
          {TIPOS_SUGERIDOS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefijo}-fecha`} className={etiquetaClases}>Fecha límite</label>
        <Input
          id={`${prefijo}-fecha`}
          type="date"
          className={campoClases}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`${prefijo}-cliente`} className={etiquetaClases}>Cliente (opcional)</label>
        <select
          id={`${prefijo}-cliente`}
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className={`${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`}
        >
          <option value="" className="bg-graphite text-white">Sin cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id} className="bg-graphite text-white">
              {c.apellido}, {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`${prefijo}-descripcion`} className={etiquetaClases}>Notas</label>
        <Textarea
          id={`${prefijo}-descripcion`}
          className={campoClases}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
        />
      </div>

      {error && <div className="sm:col-span-2 text-warning text-sm">{error}</div>}

      <div className="sm:col-span-2 flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={enviando}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : tarea ? 'Guardar cambios' : 'Guardar tarea'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancelar} disabled={enviando} className={botonClases}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
