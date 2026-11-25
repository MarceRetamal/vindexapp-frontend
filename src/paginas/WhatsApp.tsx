import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BotIcon,
  CheckCheckIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  ImageIcon,
  LibraryIcon,
  MicIcon,
  PaperclipIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  UserPlusIcon,
  VideoIcon,
  XIcon,
} from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import {
  api,
  apiPlantillas,
  CATEGORIAS_DOCUMENTO,
  CATEGORIAS_PLANTILLA,
  type CategoriaPlantilla,
  type Conversacion,
  type ConversacionResumen,
  type MensajeWhatsApp,
  type Plantilla,
} from '../api/whatsapp';
import { api as apiClientes, type Cliente } from '../api/cliente';
import { api as apiExpedientes, type Expediente } from '../api/expedientes';
import { sesionActual } from '../api/whoami';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { completarPlantilla, nombreDePila, pendientes } from '../lib/plantillas';

const botonPrincipal =
  'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-50';
const botonFantasma = 'rounded-sharp border border-white/10 bg-white/[0.03] text-silver hover:border-silver-deep hover:text-white';
const campo = 'h-9 w-full rounded-sharp border border-white/10 bg-black/30 px-2.5 text-[13px] text-white outline-none focus:border-silver-deep';

const REFRESCO_MS = 10_000;
const VENTANA_SEG = 24 * 3600;

type Filtro = 'todas' | 'sin_leer' | 'esperan' | 'urgentes' | 'clientes';
const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'sin_leer', texto: 'Sin leer' },
  { valor: 'esperan', texto: 'Esperan respuesta' },
  { valor: 'urgentes', texto: 'Urgentes' },
  { valor: 'clientes', texto: 'Clientes' },
];

// ---------------------------------------------------------------------------------------------------------------
// Utilidades de presentación
// ---------------------------------------------------------------------------------------------------------------

function horaCorta(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function cuandoLista(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return horaCorta(ts);
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function etiquetaDia(ts: number): string {
  const d = new Date(ts * 1000);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function nombreDe(c: ConversacionResumen): string {
  if (c.cliente_apellido) return `${c.cliente_apellido}, ${c.cliente_nombre ?? ''}`.trim();
  return c.nombre_completo || c.nombre_perfil || `+${c.telefono}`;
}

function iniciales(texto: string): string {
  const palabras = texto.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return '#';
  return ((palabras[0]?.[0] ?? '') + (palabras.length > 1 ? (palabras[palabras.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

function estadoDe(c: ConversacionResumen): { texto: string; clase: string; punto: string } {
  if (c.es_propio) return { texto: 'Número del estudio', clase: 'text-text-gray-light', punto: 'bg-text-gray-light' };
  if (c.estado === 'humano') return { texto: 'La atendés vos', clase: 'text-silver', punto: 'bg-silver' };
  if (c.estado === 'derivado') return { texto: 'Espera respuesta', clase: 'text-warning', punto: 'bg-warning' };
  return { texto: 'Con el asistente', clase: 'text-silver-deep', punto: 'bg-silver-deep' };
}

function temaDe(c: Pick<Conversacion, 'area' | 'subtema'>): string | null {
  if (!c.area || c.area === 'Otro tema') return null;
  const area = c.area.charAt(0).toLowerCase() + c.area.slice(1);
  return c.subtema ? `${area} (${c.subtema.toLowerCase()})` : area;
}

function horasDeVentana(c: Pick<Conversacion, 'ultima_entrante_ts'>): number | null {
  if (!c.ultima_entrante_ts) return null;
  const resta = VENTANA_SEG - (Date.now() / 1000 - c.ultima_entrante_ts);
  return resta > 0 ? resta / 3600 : null;
}

function Avatar({ texto, chico }: { texto: string; chico?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full border border-silver/25 bg-gradient-to-br from-graphite-raised to-structural-black font-bold tracking-wide text-silver ${chico ? 'h-9 w-9 text-[11px]' : 'h-11 w-11 text-[13px]'}`}
    >
      {iniciales(texto)}
    </span>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`h-7 shrink-0 rounded-full border px-3 text-[12px] transition-colors ${activo ? 'border-silver/60 bg-silver/15 text-white' : 'border-white/10 text-silver-deep hover:border-silver-deep hover:text-silver'}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------------------------------------------

/**
 * Bandeja de WhatsApp: conversaciones del número del estudio, chat con respuestas predeterminadas, ficha que arma el
 * asistente y vínculo con clientes, expedientes y documentos. La conversación abierta va en ?tel= (es el enlace de los
 * avisos de Telegram). Estética de vidrio sobre la paleta de VINDEX LEGAL.
 */
export function WhatsApp() {
  const [params, setParams] = useSearchParams();
  const actual = params.get('tel');
  const [lista, setLista] = useState<ConversacionResumen[] | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [error, setError] = useState<string | null>(null);
  const [gestionar, setGestionar] = useState(false);

  const cargarLista = useCallback(() => {
    api
      .listar(busqueda.trim())
      .then((d) => {
        setLista(d.conversaciones);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [busqueda]);

  useEffect(() => {
    cargarLista();
    const t = window.setInterval(cargarLista, REFRESCO_MS);
    return () => window.clearInterval(t);
  }, [cargarLista]);

  const cuentas = useMemo(() => {
    const l = lista ?? [];
    return {
      sin_leer: l.filter((c) => c.no_leidos > 0).length,
      esperan: l.filter((c) => c.estado === 'derivado').length,
      urgentes: l.filter((c) => c.urgente).length,
    };
  }, [lista]);

  const visibles = useMemo(() => {
    const l = lista ?? [];
    switch (filtro) {
      case 'sin_leer':
        return l.filter((c) => c.no_leidos > 0);
      case 'esperan':
        return l.filter((c) => c.estado === 'derivado');
      case 'urgentes':
        return l.filter((c) => c.urgente);
      case 'clientes':
        return l.filter((c) => c.cliente_id);
      default:
        return l;
    }
  }, [lista, filtro]);

  const abrir = (tel: string | null) => setParams(tel ? { tel } : {});

  return (
    <div className="fondo-vidrio rounded-lg border border-white/[0.04] p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Hoy · Canal directo</p>
          <h1 className="mt-1.5 text-[28px] font-black leading-tight tracking-tight text-white sm:text-[32px]">WhatsApp</h1>
          <p className="mt-1 max-w-xl text-sm text-silver-deep">
            Consultas y clientes del número del estudio. El asistente toma los datos; cuando respondés vos, se retira.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Indicador valor={cuentas.sin_leer} texto="sin leer" />
          <Indicador valor={cuentas.esperan} texto="esperan respuesta" destacado={cuentas.esperan > 0} />
          <Indicador valor={cuentas.urgentes} texto="urgentes" destacado={cuentas.urgentes > 0} />
          <Button variant="ghost" className={`${botonFantasma} h-9 px-3 text-xs`} onClick={() => setGestionar(true)}>
            <LibraryIcon className="mr-1.5 h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
            Respuestas predeterminadas
          </Button>
        </div>
      </header>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 lg:h-[calc(100vh-15rem)] lg:min-h-[560px] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={`${actual ? 'hidden lg:flex' : 'flex'} vidrio min-h-0 min-w-0 flex-col overflow-hidden`} aria-label="Conversaciones">
          <div className="border-b border-white/[0.06] p-3">
            <div className="flex h-10 items-center gap-2 rounded-sharp border border-white/10 bg-black/30 px-3 focus-within:border-silver-deep">
              <SearchIcon className="h-4 w-4 shrink-0 text-silver-deep" strokeWidth={1.6} aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, cliente o teléfono"
                aria-label="Buscar conversación"
                className="sin-contorno min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-text-gray-light"
              />
            </div>
            <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {FILTROS.map((f) => (
                <Chip key={f.valor} activo={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
                  {f.texto}
                </Chip>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {lista === null ? (
              <p className="p-4 text-sm text-text-gray-light">Cargando…</p>
            ) : visibles.length === 0 ? (
              <p className="p-6 text-center text-sm text-text-gray-light">
                {lista.length === 0 ? 'Todavía no hay conversaciones. Aparecen apenas alguien escribe al número del estudio.' : 'Ninguna conversación con este filtro.'}
              </p>
            ) : (
              <ul>
                {visibles.map((c) => (
                  <FilaConversacion key={c.telefono} c={c} activa={actual === c.telefono} onAbrir={() => abrir(c.telefono)} />
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className={`${actual ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-col`} aria-label="Conversación">
          {actual ? (
            <Chat key={actual} telefono={actual} onVolver={() => abrir(null)} onCambio={cargarLista} onGestionar={() => setGestionar(true)} />
          ) : (
            <div className="vidrio grid flex-1 place-items-center p-10 text-center">
              <div>
                <p className="eyebrow">Bandeja</p>
                <p className="mt-2 text-sm text-silver-deep">Elegí una conversación para leerla y responder.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <GestorPlantillas abierto={gestionar} onCerrar={() => setGestionar(false)} />
    </div>
  );
}

function Indicador({ valor, texto, destacado }: { valor: number; texto: string; destacado?: boolean }) {
  return (
    <span className={`vidrio-claro inline-flex h-9 items-center gap-1.5 px-3 text-xs ${destacado ? 'text-white' : 'text-silver-deep'}`}>
      <span className={`text-[15px] font-black tabular-nums ${destacado ? 'text-warning' : 'text-silver'}`}>{valor}</span>
      {texto}
    </span>
  );
}

function FilaConversacion({ c, activa, onAbrir }: { c: ConversacionResumen; activa: boolean; onAbrir: () => void }) {
  const est = estadoDe(c);
  const nombre = nombreDe(c);
  return (
    <li>
      <button
        type="button"
        onClick={onAbrir}
        aria-current={activa}
        className={`flex w-full items-start gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${activa ? 'bg-silver/[0.08] shadow-[inset_2px_0_0_var(--color-silver)]' : ''}`}
      >
        <Avatar texto={nombre} chico />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`truncate text-sm ${c.no_leidos > 0 ? 'font-black text-white' : 'font-bold text-white/90'}`}>{nombre}</span>
            <span className={`shrink-0 text-[11px] tabular-nums ${c.no_leidos > 0 ? 'text-silver' : 'text-text-gray-light'}`}>{cuandoLista(c.ultimo_ts)}</span>
          </div>
          <p className="mt-0.5 truncate text-[13px] text-silver-deep">{c.ultimo_texto}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
            <span className={`inline-flex items-center gap-1.5 ${est.clase}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${est.punto}`} aria-hidden="true" />
              {est.texto}
              {c.urgente ? <span className="ml-1 rounded-sharp border border-warning/50 px-1 text-[10px] font-bold uppercase tracking-wider text-warning">Urgente</span> : null}
            </span>
            {c.no_leidos > 0 && (
              <span className="rounded-full bg-silver px-1.5 text-[11px] font-black text-structural-black" aria-label={`${c.no_leidos} sin leer`}>
                {c.no_leidos}
              </span>
            )}
          </div>
          {(c.area || c.expediente_caratula) && (
            <p className="mt-1 truncate text-[11px] text-text-gray-light">{c.expediente_caratula ?? c.area}</p>
          )}
        </div>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------------------------------------------

function Chat({ telefono, onVolver, onCambio, onGestionar }: { telefono: string; onVolver: () => void; onCambio: () => void; onGestionar: () => void }) {
  const [conv, setConv] = useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<MensajeWhatsApp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ficha, setFicha] = useState(false);
  const fondo = useRef<HTMLDivElement>(null);
  const ultimo = useRef('');

  const cargar = useCallback(() => {
    api
      .abrir(telefono)
      .then((d) => {
        setConv(d.conversacion);
        setMensajes(d.mensajes);
        setError(null);
        const firma = d.mensajes.map((m) => m.id + m.estado).join();
        if (firma !== ultimo.current) {
          ultimo.current = firma;
          requestAnimationFrame(() => fondo.current?.scrollIntoView({ block: 'end' }));
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [telefono]);

  useEffect(() => {
    cargar();
    const t = window.setInterval(cargar, REFRESCO_MS);
    return () => window.clearInterval(t);
  }, [cargar]);

  async function asistente(activo: boolean) {
    try {
      await api.asistente(telefono, activo);
      cargar();
      onCambio();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const grupos = useMemo(() => {
    const salida: { dia: string; mensajes: MensajeWhatsApp[] }[] = [];
    for (const m of mensajes) {
      const dia = etiquetaDia(m.ts);
      const ultimoGrupo = salida[salida.length - 1];
      if (ultimoGrupo?.dia === dia) ultimoGrupo.mensajes.push(m);
      else salida.push({ dia, mensajes: [m] });
    }
    return salida;
  }, [mensajes]);

  if (!conv) return <div className="vidrio flex-1 p-6">{error ? <ErrorBanner message={error} /> : <p className="text-sm text-text-gray-light">Cargando…</p>}</div>;

  const conAsistente = conv.estado !== 'humano' && conv.estado !== 'derivado';
  const est = estadoDe(conv);
  const horas = horasDeVentana(conv);
  const nombre = nombreDe(conv);
  const refrescar = () => {
    cargar();
    onCambio();
  };

  return (
    <div className={`grid min-h-0 flex-1 gap-4 ${ficha ? 'xl:grid-cols-[minmax(0,1fr)_300px]' : ''} 2xl:grid-cols-[minmax(0,1fr)_320px]`}>
      <div className="vidrio flex min-h-[70vh] min-w-0 flex-col overflow-hidden lg:min-h-0">
        <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <button type="button" onClick={onVolver} className="text-silver-deep hover:text-white lg:hidden" aria-label="Volver a la lista">
            <ArrowLeftIcon className="h-5 w-5" strokeWidth={1.6} />
          </button>
          <Avatar texto={nombre} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-black text-white">{nombre}</p>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-text-gray-light">
              <span className="tabular-nums">+{conv.telefono}</span>
              <span className={`inline-flex items-center gap-1 ${est.clase}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${est.punto}`} aria-hidden="true" />
                {est.texto}
              </span>
              <Ventana horas={horas} />
            </p>
          </div>
                    {!conv.es_propio && (
            <Button
              variant="ghost"
              className={`${botonFantasma} h-8 px-2.5 text-xs`}
              onClick={() => void asistente(!conAsistente)}
              title={conAsistente ? 'El asistente deja de responder en esta conversación' : 'El asistente vuelve a saludar en el próximo mensaje'}
            >
              <BotIcon className="h-4 w-4 sm:mr-1.5" strokeWidth={1.6} aria-hidden="true" />
              <span className="hidden sm:inline">{conAsistente ? 'Retirar asistente' : 'Reactivar asistente'}</span>
            </Button>
          )}
          <Button variant="ghost" className={`${botonFantasma} h-8 px-2.5 text-xs 2xl:hidden ${ficha ? 'border-silver-deep text-white' : ''}`} onClick={() => setFicha((v) => !v)} aria-pressed={ficha}>
            Ficha
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {grupos.map((g) => (
            <div key={g.dia}>
              <div className="my-4 flex justify-center">
                <span className="vidrio-claro px-3 py-0.5 text-[11px] capitalize text-silver">{g.dia}</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {g.mensajes.map((m) => (
                  <Burbuja key={m.id} m={m} conv={conv} onGuardado={cargar} />
                ))}
              </ul>
            </div>
          ))}
          <div ref={fondo} />
        </div>

        {error && (
          <div className="px-4 pb-2">
            <ErrorBanner message={error} />
          </div>
        )}
        <Compositor conv={conv} onEnviado={refrescar} onError={setError} onGestionar={onGestionar} />
      </div>

      <div className={`${ficha ? 'block' : 'hidden'} min-h-0 overflow-y-auto 2xl:block`}>
        <PanelFicha conv={conv} onCambio={refrescar} />
      </div>
    </div>
  );
}

function Ventana({ horas }: { horas: number | null }) {
  if (horas === null)
    return (
      <span className="inline-flex items-center gap-1 text-warning" title="Pasaron más de 24 horas desde el último mensaje de esta persona">
        <ClockIcon className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
        Ventana de 24 h cerrada
      </span>
    );
  const texto = horas >= 1 ? `${Math.floor(horas)} h` : `${Math.max(1, Math.round(horas * 60))} min`;
  return (
    <span
      className={`inline-flex items-center gap-1 ${horas < 3 ? 'text-warning' : 'text-silver-deep'}`}
      title="Tiempo que queda para responder con texto libre (WhatsApp lo permite hasta 24 horas después del último mensaje de la persona)"
    >
      <ClockIcon className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
      Quedan {texto} para responder
    </span>
  );
}

function iconoAdjunto(m: MensajeWhatsApp) {
  const t = m.tipo ?? '';
  if (t === 'image' || t === 'sticker') return ImageIcon;
  if (t === 'audio') return MicIcon;
  if (t === 'video') return VideoIcon;
  return FileTextIcon;
}

function EstadoEnvio({ estado }: { estado: string | null }) {
  if (!estado) return null;
  if (estado.startsWith('error')) return <AlertTriangleIcon className="h-3.5 w-3.5 text-warning" strokeWidth={2} aria-label={estado} />;
  if (estado === 'read') return <CheckCheckIcon className="h-3.5 w-3.5 text-silver" strokeWidth={2} aria-label="Leído" />;
  if (estado === 'delivered') return <CheckCheckIcon className="h-3.5 w-3.5 text-silver-deep" strokeWidth={2} aria-label="Entregado" />;
  return <CheckIcon className="h-3.5 w-3.5 text-silver-deep" strokeWidth={2} aria-label="Enviado" />;
}

function Burbuja({ m, conv, onGuardado }: { m: MensajeWhatsApp; conv: Conversacion; onGuardado: () => void }) {
  const [imagen, setImagen] = useState<string | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [guardar, setGuardar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entrante = m.direccion === 'in';
  const auto = m.tipo === 'auto';
  const esImagen = (m.tipo === 'image' || m.tipo === 'sticker') && m.tiene_adjunto === 1;
  const fallo = m.estado?.startsWith('error');
  const Icono = iconoAdjunto(m);

  // Las imágenes se muestran en miniatura apenas se ve el mensaje (URL firmada de 5 minutos).
  useEffect(() => {
    if (!esImagen) return;
    let vigente = true;
    api
      .adjunto(m.id)
      .then((r) => vigente && setImagen(r.url_descarga))
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [esImagen, m.id]);

  async function ver() {
    setAbriendo(true);
    setError(null);
    try {
      const r = await api.adjunto(m.id);
      window.open(r.url_descarga, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAbriendo(false);
    }
  }

  // El texto de un adjunto es "[imagen] leyenda": la etiqueta ya la dice el ícono.
  const leyenda = m.tiene_adjunto ? (m.texto ?? '').replace(/^\[[^\]]+\]\s*/, '') : m.texto;
  const texto = leyenda && leyenda !== m.media_nombre ? leyenda : null;

  return (
    <li className={`flex ${entrante ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] px-3.5 py-2 sm:max-w-[70%] ${
          entrante
            ? 'rounded-[14px] rounded-tl-sm border border-white/[0.07] bg-graphite-raised/80'
            : auto
              ? 'rounded-[14px] rounded-tr-sm border border-dashed border-silver/20 bg-white/[0.03]'
              : 'rounded-[14px] rounded-tr-sm border border-silver/20 bg-gradient-to-br from-silver/[0.16] to-silver/[0.06]'
        } ${fallo ? 'border-warning/50' : ''}`}
      >
        {auto && (
          <p className="mb-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-silver-deep">
            <BotIcon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            Asistente
          </p>
        )}
        {imagen && (
          <button type="button" onClick={() => void ver()} className="mb-1.5 block overflow-hidden rounded-md border border-white/10">
            <img src={imagen} alt={texto || 'Imagen recibida'} className="max-h-64 w-auto object-cover" loading="lazy" />
          </button>
        )}
        {m.tiene_adjunto === 1 && !imagen && (
          <button type="button" onClick={() => void ver()} disabled={abriendo} className="mb-1 flex w-full items-center gap-2.5 rounded-md border border-white/10 bg-black/25 px-2.5 py-2 text-left hover:border-silver-deep">
            <Icono className="h-5 w-5 shrink-0 text-silver" strokeWidth={1.5} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-white">{m.media_nombre ?? (m.tipo === 'audio' ? 'Audio' : m.tipo === 'video' ? 'Video' : 'Archivo')}</span>
              <span className="text-[11px] text-text-gray-light">{abriendo ? 'Abriendo…' : m.tamano_bytes ? `${Math.max(1, Math.round(m.tamano_bytes / 1024))} KB · abrir` : 'Abrir'}</span>
            </span>
          </button>
        )}
        {texto && <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-white">{texto}</p>}
        {m.tiene_adjunto === 1 && (
          <div className="mt-1.5">
            {m.documento_id ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-silver">
                <CheckIcon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                Guardado en el legajo
              </span>
            ) : (
              <button type="button" onClick={() => setGuardar((v) => !v)} className="inline-flex items-center gap-1 text-[11px] text-silver-deep underline-offset-2 hover:text-white hover:underline">
                <PaperclipIcon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                Guardar en el legajo
              </button>
            )}
          </div>
        )}
        {guardar && !m.documento_id && (
          <GuardarDocumento
            m={m}
            conv={conv}
            onListo={() => {
              setGuardar(false);
              onGuardado();
            }}
          />
        )}
        {error && <p role="alert" className="mt-1 text-xs text-warning">{error}</p>}
        <p className="mt-1 flex items-center justify-end gap-1 text-[10px] tabular-nums text-text-gray-light">
          {horaCorta(m.ts)}
          {!entrante && <EstadoEnvio estado={m.estado} />}
        </p>
        {fallo && <p className="text-[11px] text-warning">{m.estado?.replace(/^error:\s*/, 'No se entregó: ')}</p>}
      </div>
    </li>
  );
}

function GuardarDocumento({ m, conv, onListo }: { m: MensajeWhatsApp; conv: Conversacion; onListo: () => void }) {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [expediente, setExpediente] = useState(conv.expediente_id ?? '');
  const [categoria, setCategoria] = useState('otro');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (conv.cliente_id) apiExpedientes.listarDeCliente(conv.cliente_id).then(setExpedientes).catch(() => setExpedientes([]));
  }, [conv.cliente_id]);

  if (!conv.cliente_id) return <p className="mt-2 text-xs text-text-gray-light">Primero vinculá la conversación con un cliente (en la ficha).</p>;

  async function confirmar() {
    setGuardando(true);
    setError(null);
    try {
      await api.guardarDocumento(m.id, expediente ? { expediente_id: expediente, categoria } : { cliente_id: conv.cliente_id!, categoria });
      onListo();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-2">
      <select value={expediente} onChange={(e) => setExpediente(e.target.value)} className={campo} aria-label="Expediente">
        <option value="">Documentos del cliente (sin expediente)</option>
        {expedientes.map((x) => (
          <option key={x.id} value={x.id}>
            {x.caratula}
          </option>
        ))}
      </select>
      <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={campo} aria-label="Categoría">
        {CATEGORIAS_DOCUMENTO.map((c) => (
          <option key={c.valor} value={c.valor}>
            {c.texto}
          </option>
        ))}
      </select>
      <Button className={`${botonPrincipal} h-8`} onClick={() => void confirmar()} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </Button>
      {error && <p role="alert" className="text-xs text-warning">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Compositor con respuestas predeterminadas
// ---------------------------------------------------------------------------------------------------------------

function Compositor({ conv, onEnviado, onError, onGestionar }: { conv: Conversacion; onEnviado: () => void; onError: (e: string | null) => void; onGestionar: () => void }) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [paleta, setPaleta] = useState(false);
  const [usada, setUsada] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const faltan = pendientes(texto);
  const cerrada = horasDeVentana(conv) === null;

  function elegir(p: Plantilla) {
    const sesion = sesionActual();
    const abogado = sesion.usuario ? `${sesion.usuario.nombre} ${sesion.usuario.apellido}`.trim() : null;
    const completo = completarPlantilla(p.texto, {
      nombre: nombreDePila(conv.cliente_nombre, conv.nombre_completo, conv.nombre_perfil),
      tema: temaDe(conv),
      abogado,
    });
    setTexto(completo);
    setUsada(p.id);
    setPaleta(false);
    // Deja seleccionado el primer dato a completar, para escribirlo directamente.
    requestAnimationFrame(() => {
      const el = area.current;
      if (!el) return;
      el.focus();
      const i = completo.indexOf('[');
      const f = i >= 0 ? completo.indexOf(']', i) : -1;
      if (i >= 0 && f > i) el.setSelectionRange(i, f + 1);
      else el.setSelectionRange(completo.length, completo.length);
    });
  }

  function siguientePendiente() {
    const el = area.current;
    if (!el) return;
    const desde = el.selectionEnd ?? 0;
    let i = texto.indexOf('[', desde);
    if (i < 0) i = texto.indexOf('[');
    const f = i >= 0 ? texto.indexOf(']', i) : -1;
    if (i >= 0 && f > i) {
      el.focus();
      el.setSelectionRange(i, f + 1);
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim() || faltan.length > 0) return;
    setEnviando(true);
    try {
      await api.responder(conv.telefono, texto.trim());
      if (usada) apiPlantillas.usar(usada).catch(() => undefined);
      setTexto('');
      setUsada(null);
      onError(null);
      onEnviado();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative border-t border-white/[0.06] p-3">
      {paleta && <PaletaRespuestas onElegir={elegir} onCerrar={() => setPaleta(false)} onGestionar={onGestionar} />}
      {cerrada && (
        <p className="mb-2 flex items-start gap-1.5 text-xs text-warning">
          <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          Pasaron más de 24 horas desde el último mensaje de esta persona: WhatsApp no deja escribirle texto libre hasta que vuelva a escribir.
        </p>
      )}
      {faltan.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-silver-deep">Completá antes de enviar:</span>
          {faltan.map((f) => (
            <button key={f} type="button" onClick={siguientePendiente} className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] text-warning hover:bg-warning/20">
              {f}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={(e) => void enviar(e)} className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          className={`${botonFantasma} h-11 w-11 shrink-0 p-0`}
          onClick={() => setPaleta((v) => !v)}
          aria-label="Respuestas predeterminadas"
          aria-expanded={paleta}
          title="Respuestas predeterminadas (o escribí / al principio)"
        >
          <LibraryIcon className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </Button>
        <textarea
          ref={area}
          value={texto}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '/') {
              setPaleta(true);
              setTexto('');
              return;
            }
            setTexto(v);
            if (!v) setUsada(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 760) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
            if (e.key === 'Tab' && faltan.length > 0) {
              e.preventDefault();
              siguientePendiente();
            }
          }}
          rows={Math.min(8, Math.max(2, texto.split('\n').length))}
          maxLength={4096}
          placeholder="Escribí tu respuesta, o / para usar una respuesta predeterminada"
          aria-label="Respuesta"
          className="min-h-[44px] flex-1 resize-none rounded-[12px] border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-text-gray-light focus:border-silver-deep"
        />
        <Button type="submit" className={`${botonPrincipal} h-11 w-11 shrink-0 p-0`} disabled={enviando || !texto.trim() || faltan.length > 0} aria-label="Enviar">
          <SendIcon className="h-4 w-4" strokeWidth={1.8} />
        </Button>
      </form>
    </div>
  );
}

function PaletaRespuestas({ onElegir, onCerrar, onGestionar }: { onElegir: (p: Plantilla) => void; onCerrar: () => void; onGestionar: () => void }) {
  const [plantillas, setPlantillas] = useState<Plantilla[] | null>(null);
  const [categoria, setCategoria] = useState<CategoriaPlantilla | 'todas'>('todas');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiPlantillas
      .listar()
      .then((d) => setPlantillas(d.plantillas))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    const cerrar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [onCerrar]);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (plantillas ?? [])
      .filter((p) => categoria === 'todas' || p.categoria === categoria)
      .filter((p) => !t || p.titulo.toLowerCase().includes(t) || p.texto.toLowerCase().includes(t))
      .sort((a, b) => b.usos - a.usos || a.orden - b.orden);
  }, [plantillas, categoria, q]);

  const presentes = new Set((plantillas ?? []).map((p) => p.categoria));

  return (
    <div className="vidrio absolute bottom-full left-3 right-3 z-20 mb-2 flex max-h-[60vh] flex-col overflow-hidden !bg-graphite/95" role="dialog" aria-label="Respuestas predeterminadas">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <SearchIcon className="h-4 w-4 text-silver-deep" strokeWidth={1.6} aria-hidden="true" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar respuesta"
          aria-label="Buscar respuesta"
          className="sin-contorno min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-text-gray-light"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtradas[0]) {
              e.preventDefault();
              onElegir(filtradas[0]);
            }
          }}
        />
        <button type="button" onClick={onGestionar} className="text-[12px] text-silver-deep hover:text-white">
          Administrar
        </button>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-silver-deep hover:text-white">
          <XIcon className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto border-b border-white/[0.06] px-3 py-2">
        <Chip activo={categoria === 'todas'} onClick={() => setCategoria('todas')}>
          Todas
        </Chip>
        {CATEGORIAS_PLANTILLA.filter((c) => presentes.has(c.valor)).map((c) => (
          <Chip key={c.valor} activo={categoria === c.valor} onClick={() => setCategoria(c.valor)}>
            {c.texto}
          </Chip>
        ))}
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {error && <li className="p-3 text-sm text-warning">{error}</li>}
        {plantillas === null && !error && <li className="p-3 text-sm text-text-gray-light">Cargando…</li>}
        {plantillas !== null && filtradas.length === 0 && <li className="p-3 text-sm text-text-gray-light">No hay respuestas con ese criterio.</li>}
        {filtradas.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onElegir(p)} className="w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06]">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-bold text-white">{p.titulo}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-silver-deep">{CATEGORIAS_PLANTILLA.find((c) => c.valor === p.categoria)?.texto}</span>
              </span>
              <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-silver-deep">{p.texto}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Administración de respuestas predeterminadas
// ---------------------------------------------------------------------------------------------------------------

const VACIA = { titulo: '', categoria: 'otra' as CategoriaPlantilla, texto: '' };

function GestorPlantillas({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [editando, setEditando] = useState<string | 'nueva' | null>(null);
  const [datos, setDatos] = useState(VACIA);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    apiPlantillas
      .listar()
      .then((d) => setPlantillas(d.plantillas))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (abierto) cargar();
    else {
      setEditando(null);
      setError(null);
    }
  }, [abierto, cargar]);

  function editar(p: Plantilla | null) {
    setEditando(p ? p.id : 'nueva');
    setDatos(p ? { titulo: p.titulo, categoria: p.categoria, texto: p.texto } : VACIA);
    setError(null);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      if (editando === 'nueva') await apiPlantillas.crear(datos);
      else if (editando) await apiPlantillas.editar(editando, datos);
      setEditando(null);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(p: Plantilla) {
    if (!window.confirm(`¿Borrar la respuesta "${p.titulo}"?`)) return;
    try {
      await apiPlantillas.borrar(p.id);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const porCategoria = CATEGORIAS_PLANTILLA.map((c) => ({ ...c, items: plantillas.filter((p) => p.categoria === c.valor) })).filter((g) => g.items.length > 0);

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="vidrio max-h-[88vh] overflow-y-auto border-white/10 bg-graphite/90 sm:max-w-2xl">
        <DialogHeader>
          <p className="eyebrow">WhatsApp</p>
          <DialogTitle className="text-xl font-black text-white">Respuestas predeterminadas</DialogTitle>
          <p className="text-[13px] leading-relaxed text-silver-deep">
            <span className="text-silver">{'{nombre}'}</span>, <span className="text-silver">{'{tema}'}</span> y <span className="text-silver">{'{abogado}'}</span> se completan solos.
            Lo que va entre corchetes, como <span className="text-silver">[monto]</span> o <span className="text-silver">[fecha]</span>, lo completás antes de enviar: el sistema no deja mandar el mensaje con corchetes pendientes.
          </p>
        </DialogHeader>

        {error && <ErrorBanner message={error} />}

        {editando ? (
          <form onSubmit={(e) => void guardar(e)} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <label className="flex flex-col gap-1 text-xs text-silver-deep">
                Título
                <input className={campo} value={datos.titulo} onChange={(e) => setDatos({ ...datos, titulo: e.target.value })} maxLength={80} required />
              </label>
              <label className="flex flex-col gap-1 text-xs text-silver-deep">
                Categoría
                <select className={campo} value={datos.categoria} onChange={(e) => setDatos({ ...datos, categoria: e.target.value as CategoriaPlantilla })}>
                  {CATEGORIAS_PLANTILLA.map((c) => (
                    <option key={c.valor} value={c.valor}>
                      {c.texto}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs text-silver-deep">
              Texto
              <textarea
                className="min-h-[180px] w-full resize-y rounded-sharp border border-white/10 bg-black/30 px-3 py-2 text-sm leading-relaxed text-white outline-none focus:border-silver-deep"
                value={datos.texto}
                onChange={(e) => setDatos({ ...datos, texto: e.target.value })}
                maxLength={4000}
                required
              />
            </label>
            <DialogFooter>
              <Button type="submit" className={`${botonPrincipal} h-9 px-4`} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button type="button" variant="ghost" className={`${botonFantasma} h-9 px-4`} onClick={() => setEditando(null)} disabled={guardando}>
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="flex justify-end">
              <Button className={`${botonPrincipal} h-9 px-4`} onClick={() => editar(null)}>
                <PlusIcon className="mr-1.5 h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Nueva respuesta
              </Button>
            </div>
            {porCategoria.length === 0 && <p className="py-6 text-center text-sm text-text-gray-light">No hay respuestas cargadas.</p>}
            {porCategoria.map((g) => (
              <section key={g.valor}>
                <p className="eyebrow mb-2">{g.texto}</p>
                <ul className="flex flex-col gap-2">
                  {g.items.map((p) => (
                    <li key={p.id} className="vidrio-claro flex items-start gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-white">
                          {p.titulo}
                          {p.usos > 0 && <span className="ml-2 text-[11px] font-normal text-text-gray-light">usada {p.usos} {p.usos === 1 ? 'vez' : 'veces'}</span>}
                        </p>
                        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[12px] leading-relaxed text-silver-deep">{p.texto}</p>
                      </div>
                      <button type="button" onClick={() => editar(p)} className="text-silver-deep hover:text-white" aria-label={`Editar ${p.titulo}`}>
                        <PencilIcon className="h-4 w-4" strokeWidth={1.6} />
                      </button>
                      <button type="button" onClick={() => void borrar(p)} className="text-silver-deep hover:text-warning" aria-label={`Borrar ${p.titulo}`}>
                        <Trash2Icon className="h-4 w-4" strokeWidth={1.6} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Ficha
// ---------------------------------------------------------------------------------------------------------------

function DatoFicha({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  if (!valor) return null;
  return (
    <div className="py-1.5">
      <dt className="text-[10px] uppercase tracking-[0.14em] text-text-gray-light">{etiqueta}</dt>
      <dd className="mt-0.5 text-[13px] text-white">{valor}</dd>
    </div>
  );
}

function PanelFicha({ conv, onCambio }: { conv: Conversacion; onCambio: () => void }) {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    apiClientes.listarClientes().then(setClientes).catch(() => setClientes([]));
  }, []);
  useEffect(() => {
    if (conv.cliente_id) apiExpedientes.listarDeCliente(conv.cliente_id).then(setExpedientes).catch(() => setExpedientes([]));
    else setExpedientes([]);
  }, [conv.cliente_id]);

  const ordenados = useMemo(() => (clientes ?? []).slice().sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es')), [clientes]);

  async function hacer(f: () => Promise<unknown>) {
    setOcupado(true);
    setError(null);
    try {
      await f();
      onCambio();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  let respuestas: { p: string; r: string }[] = [];
  try {
    respuestas = JSON.parse((conv as Conversacion & { respuestas?: string | null }).respuestas ?? '[]') as { p: string; r: string }[];
  } catch {
    respuestas = [];
  }
  const c = conv as Conversacion & Record<string, string | null>;

  return (
    <aside className="flex flex-col gap-4" aria-label="Ficha y vínculos">
      <section className="vidrio p-4">
        <p className="eyebrow">Legajo</p>
        <div className="mt-3 flex flex-col gap-2">
          <select
            value={conv.cliente_id ?? ''}
            disabled={ocupado || clientes === null}
            onChange={(e) => void hacer(() => api.vincular(conv.telefono, { cliente_id: e.target.value || null }))}
            className={campo}
            aria-label="Cliente"
          >
            <option value="">Sin cliente vinculado</option>
            {ordenados.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.apellido}, {cl.nombre}
              </option>
            ))}
          </select>
          {conv.cliente_id ? (
            <>
              <select
                value={conv.expediente_id ?? ''}
                disabled={ocupado}
                onChange={(e) => void hacer(() => api.vincular(conv.telefono, { expediente_id: e.target.value || null }))}
                className={campo}
                aria-label="Expediente"
              >
                <option value="">Sin expediente</option>
                {expedientes.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.caratula}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-3 text-xs">
                <Link to={`/clientes/${conv.cliente_id}`} className="text-silver underline-offset-2 hover:underline">
                  Abrir cliente
                </Link>
                {conv.expediente_id && (
                  <Link to={`/expedientes/${conv.expediente_id}`} className="text-silver underline-offset-2 hover:underline">
                    Abrir expediente
                  </Link>
                )}
              </div>
            </>
          ) : (
            !conv.es_propio && (
              <Button variant="ghost" className={`${botonFantasma} h-9 text-xs`} disabled={ocupado} onClick={() => void hacer(() => api.crearCliente(conv.telefono))}>
                <UserPlusIcon className="mr-1.5 h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                Crear cliente con estos datos
              </Button>
            )
          )}
          {error && <p role="alert" className="text-xs text-warning">{error}</p>}
        </div>
      </section>

      {(conv.ficha || conv.relato) && (
        <section className="vidrio p-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Ficha del asistente</p>
            {conv.urgente ? <span className="rounded-sharp border border-warning/50 px-1.5 text-[10px] font-bold uppercase tracking-wider text-warning">Urgente</span> : null}
          </div>
          <dl className="mt-2 divide-y divide-white/[0.05]">
            <DatoFicha etiqueta="Nombre" valor={c.nombre_completo} />
            <DatoFicha etiqueta="DNI" valor={c.dni} />
            <DatoFicha etiqueta="Localidad" valor={c.localidad} />
            <DatoFicha etiqueta="Email" valor={c.email} />
            <DatoFicha etiqueta="Motivo" valor={c.motivo_cliente} />
            <DatoFicha etiqueta="Tema" valor={conv.area ? conv.area + (conv.subtema ? ` · ${conv.subtema}` : '') : null} />
            {respuestas.map((r) => (
              <DatoFicha key={r.p} etiqueta={r.p} valor={r.r} />
            ))}
            <DatoFicha etiqueta="Causa iniciada" valor={c.causa} />
            <DatoFicha etiqueta="Lugar en la causa" valor={c.causa_rol} />
            <DatoFicha etiqueta="Juzgado" valor={c.juzgado} />
            <DatoFicha etiqueta="Expediente" valor={c.expediente_texto} />
            <DatoFicha etiqueta="Abogado actual" valor={c.abogado_actual} />
            <DatoFicha etiqueta="Audiencia o plazo" valor={c.vencimiento} />
          </dl>
          {conv.relato && (
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-text-gray-light">Relato</p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-silver">{conv.relato}</p>
            </div>
          )}
        </section>
      )}
    </aside>
  );
}
