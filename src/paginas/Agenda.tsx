import { useEffect, useMemo, useState } from 'react';
import { api, type Audiencia } from '../api/audiencias';
import { api as expedientesApi, type Expediente } from '../api/expedientes';
import { PageHeader } from '../componentes/PageHeader';
import { BloqueFecha } from '../componentes/BloqueFecha';
import { Chips } from '../componentes/BarraFiltros';
import { FilaLista } from '../componentes/FilaLista';
import { diasEntre, hoyEnArgentina } from '../lib/fechas';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { BotonEliminar } from '../componentes/BotonEliminar';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';

const MODALIDADES = ['Presencial', 'Videoconferencia', 'Telefónica'] as const;

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';

type Filtro = 'proximas' | 'pasadas' | 'todas';

const GRUPOS_AGENDA: { id: string; titulo: string; incluye: (dias: number) => boolean }[] = [
  { id: 'cerrar', titulo: 'Para cerrar', incluye: (d) => d < 0 },
  { id: 'hoy', titulo: 'Hoy', incluye: (d) => d === 0 },
  { id: 'manana', titulo: 'Mañana', incluye: (d) => d === 1 },
  { id: 'semana', titulo: 'Esta semana', incluye: (d) => d >= 2 && d <= 7 },
  { id: 'luego', titulo: 'Más adelante', incluye: (d) => d > 7 },
];

export function Agenda() {
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('proximas');

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
  const hoy = hoyEnArgentina();
  const diasDe = (a: Audiencia) => diasEntre(hoy, a.fecha.slice(0, 10));
  // "Próximas" son las programadas: las de fechas ya pasadas van arriba, como "Para cerrar" (hay que marcarlas hechas o suspendidas).
  const programadas = useMemo(() => audiencias.filter((a) => a.estado === 'Programada'), [audiencias]);
  const cerradas = useMemo(() => audiencias.filter((a) => a.estado !== 'Programada'), [audiencias]);
  const visibles = filtro === 'proximas' ? programadas : filtro === 'pasadas' ? cerradas : audiencias;

  const fila = (a: Audiencia) => <FilaAudiencia key={a.id} audiencia={a} dias={diasDe(a)} expediente={expedientesPorId.get(a.expediente_id)} onCambiado={cargar} />;

  return (
    <div>
      <PageHeader
        eyebrow="Hoy"
        title="Agenda"
        count={programadas.length}
        ctaLabel={mostrarFormulario ? 'Cancelar' : '+ Nueva audiencia'}
        onCta={() => setMostrarFormulario((v) => !v)}
      />

      {mostrarFormulario && (
        <FormularioNuevaAudiencia
          expedientes={expedientes}
          onCreado={() => {
            setMostrarFormulario(false);
            cargar();
          }}
        />
      )}

      {error && <ErrorBanner message={`No se pudo cargar el listado: ${error}`} />}

      {!cargando && audiencias.length > 0 && (
        <div className="mb-6">
          <Chips
            etiqueta="Audiencias a mostrar"
            valor={filtro}
            opciones={[
              { valor: 'proximas', texto: 'Programadas', cantidad: programadas.length },
              { valor: 'pasadas', texto: 'Cerradas', cantidad: cerradas.length },
              { valor: 'todas', texto: 'Todas', cantidad: audiencias.length },
            ]}
            onCambio={setFiltro}
          />
        </div>
      )}

      {cargando ? (
        <ListSkeleton rows={6} />
      ) : audiencias.length === 0 ? (
        <EmptyState message='Todavía no hay audiencias cargadas. Usá "Nueva audiencia" para agregar la primera: el sistema te avisa por WhatsApp 2 horas antes.' />
      ) : visibles.length === 0 ? (
        <EmptyState message={filtro === 'proximas' ? 'No hay audiencias programadas.' : 'Todavía no hay audiencias cerradas.'} />
      ) : filtro === 'proximas' ? (
        <div className="flex flex-col gap-8">
          {GRUPOS_AGENDA.map((g) => {
            const delGrupo = visibles.filter((a) => g.incluye(diasDe(a)));
            if (delGrupo.length === 0) return null;
            return (
              <section key={g.id} aria-label={g.titulo}>
                <h2 className={`eyebrow mb-3 flex items-center gap-3 ${g.id === 'cerrar' ? 'text-warning' : g.id === 'hoy' ? 'text-white' : ''}`}>
                  {g.titulo}
                  <span className="font-light tabular-nums tracking-normal text-text-gray-light">{delGrupo.length}</span>
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                </h2>
                <div className="flex flex-col gap-2">{delGrupo.map(fila)}</div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">{[...visibles].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(fila)}</div>
      )}
    </div>
  );
}

function FilaAudiencia({
  audiencia,
  dias,
  expediente,
  onCambiado,
}: {
  audiencia: Audiencia;
  dias: number;
  expediente?: Expediente;
  onCambiado: () => void;
}) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const programada = audiencia.estado === 'Programada';

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

  const boton = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
  const detalle = [audiencia.hora ? `${audiencia.hora.slice(0, 5)} hs` : null, audiencia.modalidad, audiencia.lugar].filter(Boolean).join(' · ');

  return (
    <div>
      <FilaLista
        to={expediente ? `/expedientes/${expediente.id}` : undefined}
        resaltada={programada && dias < 0}
        inicio={<BloqueFecha fecha={audiencia.fecha.slice(0, 10)} dias={programada ? dias : 1} hora={audiencia.hora ? audiencia.hora.slice(0, 5) : null} />}
        lateral={
          <EstadoBadge
            estado={audiencia.estado}
            colorMap={{ Programada: 'warning', Realizada: 'success', Suspendida: 'warning', Cancelada: 'neutral' }}
          />
        }
        acciones={
          <>
            {programada && (
              <>
                <Button variant="ghost" size="sm" disabled={procesando} onClick={() => transicionar('Realizada')} className={boton}>
                  Realizada
                </Button>
                <Button variant="ghost" size="sm" disabled={procesando} onClick={() => transicionar('Suspendida')} className={boton}>
                  Suspender
                </Button>
                <Button variant="ghost" size="sm" disabled={procesando} onClick={() => transicionar('Cancelada')} className={boton}>
                  Cancelar
                </Button>
              </>
            )}
            <BotonEliminar
              descripcion={`la audiencia "${audiencia.tipo}" del ${audiencia.fecha}`}
              eliminar={() => api.eliminarAudiencia(audiencia.id)}
              alEliminar={onCambiado}
              alFallar={setError}
            />
          </>
        }
      >
        <div className="line-clamp-2 text-[15px] font-bold leading-snug text-white">{audiencia.tipo}</div>
        <div className="mt-0.5 truncate text-xs text-text-gray-light">{expediente ? expediente.caratula : 'Expediente no encontrado'}</div>
        {detalle && <div className="truncate text-xs text-silver-deep">{detalle}</div>}
      </FilaLista>

      {error && <div className="pt-2 text-xs text-warning">{error}</div>}
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
  const [recordatorio, setRecordatorio] = useState(true);
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
        recordatorio,
      });
      onCreado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la audiencia.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="superficie p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {expedientes.length === 0 && (
        <div className="sm:col-span-2">
          <ErrorBanner message="Todavía no hay expedientes cargados. Creá uno primero en la sección Expedientes." />
        </div>
      )}

      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="nueva-audiencia-expediente" className={etiquetaClases}>Expediente</label>
        <select
          id="nueva-audiencia-expediente"
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

      <div className="flex flex-col gap-1">
        <label htmlFor="nueva-audiencia-tipo" className={etiquetaClases}>Tipo</label>
        <Input
          id="nueva-audiencia-tipo"
          className={campoClases}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          placeholder="Audiencia de conciliación"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nueva-audiencia-modalidad" className={etiquetaClases}>Modalidad</label>
        <select
          id="nueva-audiencia-modalidad"
          value={modalidad}
          onChange={(e) => setModalidad(e.target.value as (typeof MODALIDADES)[number] | '')}
          className={`${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`}
        >
          <option value="">Sin especificar</option>
          {MODALIDADES.map((m) => (
            <option key={m} value={m} className="bg-graphite text-white">{m}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nueva-audiencia-fecha" className={etiquetaClases}>Fecha</label>
        <Input id="nueva-audiencia-fecha" type="date" className={campoClases} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nueva-audiencia-hora" className={etiquetaClases}>Hora</label>
        <Input id="nueva-audiencia-hora" type="time" className={campoClases} value={hora} onChange={(e) => setHora(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="nueva-audiencia-lugar" className={etiquetaClases}>Lugar</label>
        <Input id="nueva-audiencia-lugar" className={campoClases} value={lugar} onChange={(e) => setLugar(e.target.value)} />
      </div>

      <div className="sm:col-span-2 flex flex-col gap-1">
        <label htmlFor="nueva-audiencia-recordatorio" className="flex items-center gap-2 text-sm text-white">
          <input
            id="nueva-audiencia-recordatorio"
            type="checkbox"
            checked={recordatorio}
            onChange={(e) => setRecordatorio(e.target.checked)}
            className="accent-silver"
          />
          Recordármela por WhatsApp 2 horas antes
        </label>
        {recordatorio && !hora && (
          <span className="text-xs text-text-gray-light">Sin hora cargada no hay recordatorio: la audiencia sale solo en el resumen de la mañana.</span>
        )}
      </div>

      {error && <div className="sm:col-span-2 text-warning text-sm">{error}</div>}

      <div className="sm:col-span-2">
        <Button
          type="submit"
          disabled={enviando || expedientes.length === 0}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Guardar audiencia'}
        </Button>
      </div>
    </form>
  );
}
