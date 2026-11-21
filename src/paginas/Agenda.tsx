import { useEffect, useMemo, useState } from 'react';
import { api, type Audiencia } from '../api/audiencias';
import { api as expedientesApi, type Expediente } from '../api/expedientes';
import { api as portalApi, type CausaPortal } from '../api/portal';
import { api as clientesApi, type Cliente } from '../api/cliente';
import { avisarCambioNovedades } from '../api/novedades';
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
          onExpedienteCreado={cargar}
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

/**
 * El selector ofrece los expedientes y, aparte, las causas del portal que todavía no tienen expediente. Un expediente
 * exige cliente y el portal no lo informa: si se elige una causa, se pide el cliente (uno cargado o uno nuevo, con
 * nombre y apellido) y al guardar se crea el expediente con los datos del portal, vinculado a la causa, y la audiencia
 * queda en ese expediente. Es lo mismo que "Crear expediente" desde la ficha del cliente, en un solo paso.
 */
function FormularioNuevaAudiencia({
  expedientes,
  onCreado,
  onExpedienteCreado,
}: {
  expedientes: Expediente[];
  onCreado: () => void;
  onExpedienteCreado: () => void;
}) {
  // "exp:<id>" o "causa:<id>".
  const [seleccion, setSeleccion] = useState('');
  const [causas, setCausas] = useState<CausaPortal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [apellidoNuevo, setApellidoNuevo] = useState('');
  const [tipo, setTipo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [modalidad, setModalidad] = useState<(typeof MODALIDADES)[number] | ''>('');
  const [lugar, setLugar] = useState('');
  const [recordatorio, setRecordatorio] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function cargarCausasYClientes() {
    // Si falla, el formulario sigue sirviendo con los expedientes: no se muestra error por esto.
    portalApi
      .listarCausas()
      .then((todas) => setCausas(todas.filter((c) => c.expediente_id === null)))
      .catch(() => setCausas([]));
    clientesApi
      .listarClientes()
      .then(setClientes)
      .catch(() => setClientes([]));
  }

  useEffect(cargarCausasYClientes, []);

  const causaElegida = seleccion.startsWith('causa:') ? causas.find((c) => `causa:${c.id}` === seleccion) ?? null : null;
  const hayOpciones = expedientes.length > 0 || causas.length > 0;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setAviso(null);
    let expedienteId = seleccion.startsWith('exp:') ? seleccion.slice(4) : '';
    try {
      if (causaElegida) {
        let cliente = clienteId;
        if (cliente === 'nuevo') {
          const creado = await clientesApi.crearCliente({ nombre: nombreNuevo.trim(), apellido: apellidoNuevo.trim() });
          cliente = creado.id;
          // Si después falla otro paso, el reintento usa este cliente y no crea otro.
          setClienteId(creado.id);
          clientesApi.listarClientes().then(setClientes).catch(() => {});
        }
        const r = await clientesApi.crearExpedientesDesdeCausas(cliente, [causaElegida.id]);
        const nuevo = r.expedientes[0];
        if (!nuevo) throw new Error('La API no devolvió el expediente creado.');
        expedienteId = nuevo.id;
        // Desde acá la audiencia va a ese expediente, también si hay que reintentar.
        setSeleccion(`exp:${nuevo.id}`);
        setAviso(`Se creó el expediente "${nuevo.caratula}" y quedó vinculado a la causa del portal.`);
        avisarCambioNovedades();
        cargarCausasYClientes();
        onExpedienteCreado();
      }
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
      {!hayOpciones && (
        <div className="sm:col-span-2">
          <ErrorBanner message="Todavía no hay expedientes ni causas del portal. Creá un expediente primero en la sección Expedientes." />
        </div>
      )}

      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="nueva-audiencia-expediente" className={etiquetaClases}>Expediente o causa del portal</label>
        <select
          id="nueva-audiencia-expediente"
          value={seleccion}
          onChange={(e) => {
            setSeleccion(e.target.value);
            setAviso(null);
          }}
          required
          className={`${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`}
        >
          <option value="" disabled>Elegí un expediente o una causa</option>
          {expedientes.length > 0 && (
            <optgroup label="Expedientes" className="bg-graphite text-silver">
              {expedientes.map((e) => (
                <option key={e.id} value={`exp:${e.id}`} className="bg-graphite text-white">
                  {e.caratula}
                </option>
              ))}
            </optgroup>
          )}
          {causas.length > 0 && (
            <optgroup label="Causas del portal sin expediente" className="bg-graphite text-silver">
              {causas.map((c) => (
                <option key={c.id} value={`causa:${c.id}`} className="bg-graphite text-white">
                  {c.caratula ?? 'Sin carátula'} ({c.numero_causa})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {causaElegida && (
        <div className="sm:col-span-2 flex flex-col gap-2 border-l-2 border-line pl-3">
          <p className="text-xs text-text-gray-light">
            Esta causa todavía no tiene expediente. Elegí de qué cliente es: al guardar se crea el expediente con los
            datos del portal ({causaElegida.numero_causa}
            {causaElegida.organismo ? `, ${causaElegida.organismo}` : ''}), queda vinculado a la causa y la audiencia
            se carga ahí.
          </p>
          <label htmlFor="nueva-audiencia-cliente" className={etiquetaClases}>Cliente</label>
          <select
            id="nueva-audiencia-cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className={`${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`}
          >
            <option value="" disabled>Elegí el cliente</option>
            <option value="nuevo" className="bg-graphite text-white">+ Cliente nuevo</option>
            {clientes.map((cl) => (
              <option key={cl.id} value={cl.id} className="bg-graphite text-white">
                {cl.apellido}, {cl.nombre}
              </option>
            ))}
          </select>
          {clienteId === 'nuevo' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="nueva-audiencia-cliente-apellido" className={etiquetaClases}>Apellido</label>
                <Input id="nueva-audiencia-cliente-apellido" className={campoClases} value={apellidoNuevo} onChange={(e) => setApellidoNuevo(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="nueva-audiencia-cliente-nombre" className={etiquetaClases}>Nombre</label>
                <Input id="nueva-audiencia-cliente-nombre" className={campoClases} value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} required />
              </div>
              <span className="sm:col-span-2 text-xs text-text-gray-light">El resto de los datos se completa después en la ficha del cliente.</span>
            </div>
          )}
        </div>
      )}

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

      {aviso && <div className="sm:col-span-2 text-success text-sm">{aviso}</div>}
      {error && (
        <div className="sm:col-span-2 text-warning text-sm">
          {aviso ? `El expediente quedó creado, pero la audiencia no se guardó: ${error} Corregí y volvé a guardar.` : error}
        </div>
      )}

      <div className="sm:col-span-2">
        <Button
          type="submit"
          disabled={enviando || !hayOpciones}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Guardar audiencia'}
        </Button>
      </div>
    </form>
  );
}
