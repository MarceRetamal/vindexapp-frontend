import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CheckIcon } from 'lucide-react';
import { api, type TareaListado } from '../api/tareas';
import { api as clientesApi, type Cliente } from '../api/cliente';
import { api as alertasApi, mensajeDeError } from '../api/alertas';
import { PageHeader } from '../componentes/PageHeader';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { BotonEliminar } from '../componentes/BotonEliminar';
import { BloqueFecha } from '../componentes/BloqueFecha';
import { Chips } from '../componentes/BarraFiltros';
import { BloqueIcono, FilaLista } from '../componentes/FilaLista';
import { diasEntre, hoyEnArgentina } from '../lib/fechas';
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
        eyebrow="Hoy"
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

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Chips
          etiqueta="Estado de las tareas"
          valor={filtroEstado}
          opciones={[
            { valor: 'pendientes', texto: 'Pendientes', cantidad: pendientes.length },
            { valor: 'completadas', texto: 'Completadas', cantidad: tareas.length - pendientes.length },
            { valor: 'todas', texto: 'Todas', cantidad: tareas.length },
          ]}
          onCambio={setFiltroEstado}
        />
        <Chips
          etiqueta="Origen de las tareas"
          valor={filtroOrigen}
          opciones={[
            { valor: 'todas', texto: 'Todas' },
            { valor: 'extrajudiciales', texto: 'Extrajudiciales' },
            { valor: 'judiciales', texto: 'De expedientes' },
          ]}
          onCambio={setFiltroOrigen}
        />
      </div>

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
        <ListaTareas tareas={visibles} agrupar={filtroEstado === 'pendientes'} clientes={clientes} onCambiado={cargar} onError={setError} />
      )}

      <div className="mt-12 border-t border-line pt-6">
        <ResumenAgenda onError={setError} />
      </div>
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
            ? 'Avisos por WhatsApp: a las 8, lo vencido y lo que vence hoy, mañana y pasado; 2 horas antes de cada audiencia con hora; y a las 17, lo que vence hoy y sigue pendiente.'
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

const GRUPOS_TAREA: { id: string; titulo: string; incluye: (dias: number | null) => boolean }[] = [
  { id: 'vencidas', titulo: 'Vencidas', incluye: (d) => d !== null && d < 0 },
  { id: 'hoy', titulo: 'Hoy', incluye: (d) => d === 0 },
  { id: 'semana', titulo: 'Esta semana', incluye: (d) => d !== null && d >= 1 && d <= 7 },
  { id: 'luego', titulo: 'Más adelante', incluye: (d) => d !== null && d > 7 },
  { id: 'sinfecha', titulo: 'Sin fecha', incluye: (d) => d === null },
];

/** Las tareas pendientes se agrupan por urgencia, como en Mi día; el resto, en una sola lista. */
function ListaTareas({
  tareas,
  agrupar,
  clientes,
  onCambiado,
  onError,
}: {
  tareas: TareaListado[];
  agrupar: boolean;
  clientes: Cliente[];
  onCambiado: () => void;
  onError: (mensaje: string | null) => void;
}) {
  const hoy = hoyEnArgentina();
  const diasDe = (t: TareaListado) => (t.fecha_limite ? diasEntre(hoy, t.fecha_limite.slice(0, 10)) : null);
  if (!agrupar) {
    return (
      <div className="flex flex-col gap-2">
        {tareas.map((t) => (
          <FilaTarea key={t.id} tarea={t} clientes={clientes} onCambiado={onCambiado} onError={onError} />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      {GRUPOS_TAREA.map((g) => {
        const delGrupo = tareas.filter((t) => g.incluye(diasDe(t)));
        if (delGrupo.length === 0) return null;
        return (
          <section key={g.id} aria-label={g.titulo}>
            <h2 className={`eyebrow mb-3 flex items-center gap-3 ${g.id === 'vencidas' ? 'text-warning' : g.id === 'hoy' ? 'text-white' : ''}`}>
              {g.titulo}
              <span className="font-light tabular-nums tracking-normal text-text-gray-light">{delGrupo.length}</span>
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            </h2>
            <div className="flex flex-col gap-2">
              {delGrupo.map((t) => (
                <FilaTarea key={t.id} tarea={t} clientes={clientes} onCambiado={onCambiado} onError={onError} />
              ))}
            </div>
          </section>
        );
      })}
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
  const dias = tarea.fecha_limite ? diasEntre(hoyEnArgentina(), tarea.fecha_limite.slice(0, 10)) : null;
  const cliente = tarea.cliente_apellido ? `${tarea.cliente_apellido}, ${tarea.cliente_nombre ?? ''}` : null;
  const contexto = [tarea.expediente_id ? null : (tarea.tipo ?? 'Extrajudicial'), cliente].filter(Boolean).join(' · ');

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
    <div>
      <FilaLista
        resaltada={!completada && dias !== null && dias < 0}
        accionesVisibles
        inicio={
          completada ? (
            <BloqueIcono>
              <CheckIcon className="h-5 w-5 text-success" strokeWidth={1.8} />
            </BloqueIcono>
          ) : tarea.fecha_limite && dias !== null ? (
            <BloqueFecha fecha={tarea.fecha_limite.slice(0, 10)} dias={dias} />
          ) : (
            <BloqueIcono>
              <span className="text-[11px] font-bold tracking-[0.12em] text-silver-deep">S/F</span>
            </BloqueIcono>
          )
        }
        acciones={
          <>
            <Button variant="ghost" size="sm" disabled={procesando} onClick={cambiarEstado} className={botonClases}>
              {completada ? 'Volver a pendiente' : 'Marcar hecha'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditando((v) => !v)} className={botonClases}>
              {editando ? 'Cancelar edición' : 'Editar'}
            </Button>
            <BotonEliminar descripcion={`la tarea "${tarea.titulo}"`} eliminar={() => api.eliminarTarea(tarea.id)} alEliminar={onCambiado} alFallar={onError} />
          </>
        }
      >
        <div className={`line-clamp-2 text-[15px] font-bold leading-snug ${completada ? 'text-text-gray-light line-through' : 'text-white'}`}>{tarea.titulo}</div>
        {tarea.expediente_id && (
          <Link to={`/expedientes/${tarea.expediente_id}`} className="mt-0.5 block truncate text-xs text-text-gray-light underline-offset-4 hover:text-white hover:underline">
            {tarea.expediente_caratula ?? 'Ver expediente'}
          </Link>
        )}
        {contexto && <div className="mt-0.5 truncate text-xs text-text-gray-light">{contexto}</div>}
        {tarea.descripcion && <p className="mt-1 line-clamp-2 text-xs text-silver-deep">{tarea.descripcion}</p>}
      </FilaLista>

      {editando && (
        <div className="mt-2">
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
    </div>
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
      className="superficie p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
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
