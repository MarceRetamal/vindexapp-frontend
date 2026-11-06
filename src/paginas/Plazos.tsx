import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api, type CalendarioJudicial, type Regimen, type ResultadoPlazo, type TipoInhabil, type TipoInicio } from '../api/plazos';
import { api as expedientesApi, type Expediente } from '../api/expedientes';
import { api as tareasApi } from '../api/tareas';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { PageHeader } from '../componentes/PageHeader';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const selectClases = `${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`;
const etiquetaClases = 'text-xs text-text-gray-light';
const botonClases = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
const botonPrincipal =
  'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60';

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function formatear(fecha: string): string {
  const [a, m, d] = fecha.split('-');
  const dia = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  return `${DIAS_SEMANA[dia]} ${d}/${m}/${a}`;
}

function hoy(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}

function mensaje(e: unknown): string {
  return e instanceof Error ? e.message : 'No se pudo completar la operación.';
}

export function Plazos() {
  const [params] = useSearchParams();
  const [calendario, setCalendario] = useState<CalendarioJudicial | null>(null);
  const [error, setError] = useState<string | null>(null);

  function cargarCalendario() {
    api
      .calendario()
      .then(setCalendario)
      .catch((e) => setError(mensaje(e)));
  }
  useEffect(cargarCalendario, []);

  return (
    <div>
      <PageHeader
        eyebrow="Causas"
        title="Plazos"
        descripcion="Calculá un vencimiento con la norma que lo sostiene, día por día, con el calendario judicial del estudio."
      />

      {error && <ErrorBanner message={error} />}

      <Calculadora
        calendario={calendario}
        fechaInicial={params.get('fecha') ?? ''}
        expedienteInicial={params.get('expediente_id') ?? ''}
        tituloInicial={params.get('titulo') ?? ''}
        inicial={{
          regimen: params.get('regimen') === 'cpp' ? 'cpp' : 'cpcc',
          dias: params.get('dias'),
          vista: params.get('vista') === '1',
          localidad: params.get('localidad'),
          calcular: params.get('calcular') === '1',
        }}
      />
      <SeccionCalendario calendario={calendario} onCambio={cargarCalendario} />
    </div>
  );
}

function Calculadora({
  calendario,
  fechaInicial,
  expedienteInicial,
  tituloInicial,
  inicial,
}: {
  calendario: CalendarioJudicial | null;
  fechaInicial: string;
  expedienteInicial: string;
  tituloInicial: string;
  /** Datos con que se abre la calculadora desde una propuesta de plazo; con `calcular` calcula sola al cargar el calendario. */
  inicial: { regimen: Regimen; dias: string | null; vista: boolean; localidad: string | null; calcular: boolean };
}) {
  const [regimen, setRegimen] = useState<Regimen>(inicial.regimen);
  const [tipoInicio, setTipoInicio] = useState<TipoInicio>('notificacion');
  const [fecha, setFecha] = useState(fechaInicial);
  const [dias, setDias] = useState(inicial.dias ?? (inicial.regimen === 'cpp' ? '3' : '5'));
  const [localidad, setLocalidad] = useState(inicial.localidad ?? 'LA PLATA');
  const [distancia, setDistancia] = useState('');
  const [vista, setVista] = useState(inicial.vista);
  const [suspende, setSuspende] = useState(false);
  const [flagrancia, setFlagrancia] = useState(false);
  const [recurso, setRecurso] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPlazo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculando, setCalculando] = useState(false);

  // Si el calendario no tiene la localidad por defecto, se usa solo el provincial.
  useEffect(() => {
    if (calendario && !calendario.localidades.includes(localidad)) setLocalidad('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendario]);

  function cambiarRegimen(r: Regimen) {
    setRegimen(r);
    setResultado(null);
    if (r === 'cpp') {
      setTipoInicio('notificacion');
      setDias('3');
    } else {
      setDias('5');
    }
  }

  function calcular(e: React.FormEvent) {
    e.preventDefault();
    void ejecutar(localidad);
  }

  // Abierta desde una propuesta de plazo: calcula sola apenas está el calendario, para mostrar el cómputo ya hecho.
  const calculadaSola = useRef(false);
  useEffect(() => {
    if (!inicial.calcular || calculadaSola.current || !calendario || !fecha) return;
    calculadaSola.current = true;
    void ejecutar(calendario.localidades.includes(localidad) ? localidad : '');
    // Solo cuando llega el calendario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendario]);

  async function ejecutar(localidadEfectiva: string) {
    setCalculando(true);
    setError(null);
    setResultado(null);
    try {
      const r = await api.calcular({
        regimen,
        inicio: { tipo: tipoInicio, fecha },
        dias: Number(dias),
        localidad: localidadEfectiva || null,
        distancia_km: regimen === 'cpcc' && distancia ? Number(distancia) : undefined,
        vista: regimen === 'cpp' && vista,
        suspende_en_feria: regimen === 'cpp' && suspende,
        flagrancia: regimen === 'cpp' && flagrancia,
        recurso: regimen === 'cpp' && recurso,
      });
      setResultado(r);
    } catch (err) {
      setError(mensaje(err));
    } finally {
      setCalculando(false);
    }
  }

  return (
    <section className="mb-10">
      <form onSubmit={calcular} className="superficie p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="plazo-regimen" className={etiquetaClases}>Régimen</label>
          <select id="plazo-regimen" value={regimen} onChange={(e) => cambiarRegimen(e.target.value as Regimen)} className={selectClases}>
            <option value="cpcc" className="bg-graphite">Civil y Comercial, Familia, Paz (CPCC PBA): días hábiles</option>
            <option value="cpp" className="bg-graphite">Penal (CPP PBA, Ley 11.922): días corridos</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plazo-inicio" className={etiquetaClases}>Desde</label>
          <select id="plazo-inicio" value={tipoInicio} onChange={(e) => setTipoInicio(e.target.value as TipoInicio)} className={selectClases}>
            <option value="notificacion" className="bg-graphite">Fecha de notificación (la del proveído o el portal)</option>
            {regimen === 'cpcc' && <option value="ministerio_legis" className="bg-graphite">Fecha de la resolución, notificación automática (art. 133)</option>}
            {regimen === 'cpcc' && <option value="correo_electronico" className="bg-graphite">Envío de la notificación por correo electrónico (art. 143)</option>}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plazo-fecha" className={etiquetaClases}>
            {tipoInicio === 'notificacion' ? 'Fecha de notificación' : tipoInicio === 'ministerio_legis' ? 'Fecha de la resolución' : 'Fecha del envío'}
          </label>
          <Input id="plazo-fecha" type="date" required value={fecha} max="2100-12-31" onChange={(e) => setFecha(e.target.value)} className={campoClases} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plazo-dias" className={etiquetaClases}>
            Días del plazo {regimen === 'cpcc' ? '(traslados y vistas sin plazo: 5, art. 150)' : '(sin plazo fijado y vistas: 3, arts. 135 y 138)'}
          </label>
          <Input id="plazo-dias" type="number" min={1} max={365} required value={dias} onChange={(e) => setDias(e.target.value)} className={campoClases} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plazo-localidad" className={etiquetaClases}>Localidad del organismo (feriados locales)</label>
          <select id="plazo-localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} className={selectClases}>
            <option value="" className="bg-graphite">Solo feriados de toda la provincia</option>
            {(calendario?.localidades ?? []).map((l) => (
              <option key={l} value={l} className="bg-graphite">{l}</option>
            ))}
          </select>
        </div>
        {regimen === 'cpcc' ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="plazo-distancia" className={etiquetaClases}>Distancia en km para la ampliación (art. 158, opcional)</label>
            <Input id="plazo-distancia" type="number" min={0} value={distancia} onChange={(e) => setDistancia(e.target.value)} className={campoClases} />
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-silver sm:row-span-2">
            <label className="flex items-start gap-2"><input type="checkbox" checked={vista} onChange={(e) => setVista(e.target.checked)} className="accent-silver mt-1" />Es una vista: corre desde el día hábil siguiente (art. 135)</label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={suspende} onChange={(e) => setSuspende(e.target.checked)} className="accent-silver mt-1" />La feria lo suspende: oposición del art. 336, impugnación del auto de elevación o de la sentencia (art. 139)</label>
            {suspende && <label className="flex items-start gap-2 pl-5"><input type="checkbox" checked={flagrancia} onChange={(e) => setFlagrancia(e.target.checked)} className="accent-silver mt-1" />Procedimiento de flagrancia: la feria no suspende</label>}
            <label className="flex items-start gap-2"><input type="checkbox" checked={recurso} onChange={(e) => setRecurso(e.target.checked)} className="accent-silver mt-1" />Es un recurso (arts. 479 y siguientes)</label>
          </div>
        )}
        {error && <div className="sm:col-span-2"><ErrorBanner message={error} /></div>}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={calculando || !fecha} className={botonPrincipal}>
            {calculando ? 'Calculando…' : 'Calcular vencimiento'}
          </Button>
        </div>
      </form>

      {resultado && <Resultado resultado={resultado} expedienteInicial={expedienteInicial} tituloInicial={tituloInicial} />}
    </section>
  );
}

function Resultado({ resultado: r, expedienteInicial, tituloInicial }: { resultado: ResultadoPlazo; expedienteInicial: string; tituloInicial: string }) {
  const [verDetalle, setVerDetalle] = useState(false);
  return (
    <div className="mt-4 border border-line rounded-sharp p-4 sm:p-5 flex flex-col gap-4">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-silver-deep">Vence</div>
        <div className="text-2xl sm:text-3xl font-light text-white">{formatear(r.vencimiento)}</div>
        <div className="text-sm text-text-gray-light mt-1">
          Notificación: {formatear(r.fecha_notificacion)} · {r.dias_totales} días
          {r.localidad ? ` · feriados locales de ${r.localidad}` : ' · solo feriados provinciales'}
        </div>
        {r.plazo_de_gracia && (
          <div className="text-sm text-silver mt-1">Plazo de gracia: hasta las 4 primeras horas del {formatear(r.plazo_de_gracia)} (art. 139 CPP).</div>
        )}
      </div>

      {r.advertencias.length > 0 && (
        <ul className="border-l-2 border-warning bg-graphite px-4 py-3 rounded-sharp text-sm text-warning flex flex-col gap-1">
          {r.advertencias.map((a) => <li key={a}>{a}</li>)}
        </ul>
      )}

      <div className="text-xs text-text-gray-light flex flex-col gap-1">
        <div className="text-silver font-bold uppercase tracking-[0.16em]">Normas aplicadas</div>
        {r.normas.map((n) => <div key={n}>{n}</div>)}
        <div className="text-silver font-bold uppercase tracking-[0.16em] mt-2">Supuestos</div>
        {r.supuestos.map((s) => <div key={s}>{s}</div>)}
      </div>

      <div>
        <Button variant="ghost" size="sm" onClick={() => setVerDetalle((v) => !v)} className={botonClases}>
          {verDetalle ? 'Ocultar el cómputo día por día' : 'Ver el cómputo día por día'}
        </Button>
        {verDetalle && (
          <ol className="mt-3 text-sm flex flex-col">
            {r.detalle.map((d, i) => (
              <li key={`${d.fecha}-${i}`} className="flex gap-3 py-1 border-b border-line">
                <span className="font-mono text-silver-deep w-8 shrink-0 text-right">{d.numero ?? '—'}</span>
                <span className={`w-40 shrink-0 ${d.numero ? 'text-white' : 'text-text-gray-light'}`}>{formatear(d.fecha)}</span>
                <span className="text-text-gray-light min-w-0 break-words">{d.motivo}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <CrearTarea vencimiento={r.vencimiento} expedienteInicial={expedienteInicial} tituloInicial={tituloInicial} />
    </div>
  );
}

function CrearTarea({ vencimiento, expedienteInicial, tituloInicial }: { vencimiento: string; expedienteInicial: string; tituloInicial: string }) {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [expedienteId, setExpedienteId] = useState(expedienteInicial);
  const [titulo, setTitulo] = useState(tituloInicial ? `Vence: ${tituloInicial}` : 'Vencimiento de plazo');
  const [enviando, setEnviando] = useState(false);
  const [creada, setCreada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    expedientesApi.listarExpedientes().then(setExpedientes).catch(() => setExpedientes([]));
  }, []);
  useEffect(() => setCreada(false), [vencimiento]);

  async function crear() {
    setEnviando(true);
    setError(null);
    try {
      await tareasApi.crearTareaConVencimiento({ titulo, fecha_limite: vencimiento, expediente_id: expedienteId || undefined, tipo: expedienteId ? undefined : 'Plazo' });
      setCreada(true);
    } catch (e) {
      setError(mensaje(e));
    } finally {
      setEnviando(false);
    }
  }

  if (creada) {
    return (
      <div className="border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm">
        Tarea creada con vencimiento {formatear(vencimiento)}. Aparece en <Link to="/tareas" className="underline">Tareas</Link> y en el resumen diario por WhatsApp.
      </div>
    );
  }
  return (
    <div className="border-t border-line pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="plazo-tarea-titulo" className={etiquetaClases}>Tarea</label>
        <Input id="plazo-tarea-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={campoClases} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="plazo-tarea-expediente" className={etiquetaClases}>Expediente (opcional)</label>
        <select id="plazo-tarea-expediente" value={expedienteId} onChange={(e) => setExpedienteId(e.target.value)} className={selectClases}>
          <option value="" className="bg-graphite">Sin expediente</option>
          {expedientes.map((x) => <option key={x.id} value={x.id} className="bg-graphite">{x.caratula}</option>)}
        </select>
      </div>
      {error && <div className="sm:col-span-2"><ErrorBanner message={error} /></div>}
      <div className="sm:col-span-2">
        <Button onClick={crear} disabled={enviando || !titulo.trim()} className={botonPrincipal}>
          {enviando ? 'Creando…' : 'Crear tarea con este vencimiento'}
        </Button>
      </div>
    </div>
  );
}

const TIPOS: { valor: TipoInhabil; etiqueta: string }[] = [
  { valor: 'feriado', etiqueta: 'Feriado (nacional, provincial o local)' },
  { valor: 'feria', etiqueta: 'Feria judicial' },
  { valor: 'asueto', etiqueta: 'Asueto de la Suprema Corte' },
  { valor: 'suspension', etiqueta: 'Suspensión de términos' },
];

function SeccionCalendario({ calendario, onCambio }: { calendario: CalendarioJudicial | null; onCambio: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState<TipoInhabil>('feriado');
  const [alcance, setAlcance] = useState('');
  const [motivo, setMotivo] = useState('');
  const [fuente, setFuente] = useState('');
  const [verificado, setVerificado] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const proximos = (calendario?.dias ?? []).filter((d) => d.fecha >= hoy()).slice(0, 40);

  async function ejecutar(fn: () => Promise<unknown>) {
    setProcesando(true);
    setError(null);
    try {
      await fn();
      onCambio();
    } catch (e) {
      setError(mensaje(e));
    } finally {
      setProcesando(false);
    }
  }

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-silver">
        Calendario judicial
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </h2>
      <p className="text-sm text-text-gray-light mb-2">
        {calendario?.verificado_hasta
          ? `Verificado hasta el ${formatear(calendario.verificado_hasta)}. Después de esa fecha no se calcula: cargá los feriados, asuetos y la feria cuando la SCBA los publique.`
          : 'Todavía no hay calendario cargado: sin él no se puede calcular.'}
        {calendario?.fuente ? ` Fuente: ${calendario.fuente}` : ''}
      </p>
      <a href="https://www.scba.gob.ar/guia/suspensiones.asp" target="_blank" rel="noopener noreferrer" className="text-xs text-text-gray-light underline-offset-4 hover:underline hover:text-white">
        Ver las suspensiones de términos en la SCBA
      </a>

      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}

      <div className="mt-4">
        <div className="text-xs uppercase tracking-[0.16em] text-silver-deep mb-2">Próximos días inhábiles</div>
        {proximos.length === 0 ? (
          <p className="text-sm text-text-gray-light">No hay días inhábiles cargados desde hoy.</p>
        ) : (
          <ul className="flex flex-col">
            {proximos.map((d) => (
              <li key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-line text-sm">
                <span className="text-white sm:w-48 shrink-0">{formatear(d.fecha)}</span>
                <span className="text-text-gray-light flex-1 min-w-0 break-words">
                  {d.motivo}
                  {d.alcance !== 'PROVINCIA' ? ` · solo ${d.alcance}` : ''}
                </span>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => window.confirm(`Se quita el ${formatear(d.fecha)} del calendario. ¿Seguimos?`) && ejecutar(() => api.eliminarDia(d.id))}
                  className="text-xs text-text-gray-light hover:text-warning self-start sm:self-auto"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={() => setAbierto((v) => !v)} className={`${botonClases} mt-4`}>
        {abierto ? 'Cerrar' : 'Agregar un día o actualizar la verificación'}
      </Button>
      {abierto && (
        <div className="superficie mt-3 p-5 flex flex-col gap-4">
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void ejecutar(async () => {
                await api.agregarDia({ fecha, tipo, motivo, alcance: alcance || undefined, fuente: fuente || undefined });
                setFecha('');
                setMotivo('');
              });
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="cal-fecha" className={etiquetaClases}>Fecha</label>
              <Input id="cal-fecha" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={campoClases} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cal-tipo" className={etiquetaClases}>Tipo</label>
              <select id="cal-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoInhabil)} className={selectClases}>
                {TIPOS.map((t) => <option key={t.valor} value={t.valor} className="bg-graphite">{t.etiqueta}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cal-alcance" className={etiquetaClases}>Localidad (vacío = toda la provincia)</label>
              <Input id="cal-alcance" value={alcance} onChange={(e) => setAlcance(e.target.value)} placeholder="Ej.: LA PLATA" className={campoClases} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="cal-motivo" className={etiquetaClases}>Motivo</label>
              <Input id="cal-motivo" required value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: Feria judicial de enero (Res. …)" className={campoClases} />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor="cal-fuente" className={etiquetaClases}>Fuente (resolución o página oficial)</label>
              <Input id="cal-fuente" value={fuente} onChange={(e) => setFuente(e.target.value)} className={campoClases} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={procesando} className={botonPrincipal}>Agregar día inhábil</Button>
            </div>
          </form>
          <form
            className="flex flex-col sm:flex-row sm:items-end gap-3 border-t border-line pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void ejecutar(() => api.fijarVerificacion(verificado, 'SCBA, Suspensiones de Términos (scba.gob.ar/guia/suspensiones.asp)'));
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="cal-verificado" className={etiquetaClases}>Calendario verificado con la SCBA hasta</label>
              <Input id="cal-verificado" type="date" required value={verificado} onChange={(e) => setVerificado(e.target.value)} className={campoClases} />
            </div>
            <Button type="submit" disabled={procesando} className={botonClases}>Guardar verificación</Button>
          </form>
        </div>
      )}
    </section>
  );
}
