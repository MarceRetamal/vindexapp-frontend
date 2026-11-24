import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeftIcon, BotIcon, PaperclipIcon, SearchIcon, SendIcon, UserPlusIcon } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { api, CATEGORIAS_DOCUMENTO, type Conversacion, type ConversacionResumen, type MensajeWhatsApp } from '../api/whatsapp';
import { api as apiClientes, type Cliente } from '../api/cliente';
import { api as apiExpedientes, type Expediente } from '../api/expedientes';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { PageHeader } from '../componentes/PageHeader';

const botonPrincipal =
  'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver';
const botonSecundario = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
const campo = 'h-9 w-full rounded-sharp border border-line bg-transparent px-2 text-[13px] text-white';

const REFRESCO_MS = 10_000;

function hora(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const hoy = new Date();
  return d.toDateString() === hoy.toDateString()
    ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function nombreDe(c: ConversacionResumen): string {
  if (c.cliente_apellido) return `${c.cliente_apellido}, ${c.cliente_nombre ?? ''}`.trim();
  return c.nombre_completo || c.nombre_perfil || `+${c.telefono}`;
}

function estadoDe(c: ConversacionResumen): { texto: string; clase: string } {
  if (c.es_propio) return { texto: 'Número del estudio', clase: 'text-text-gray-light' };
  if (c.estado === 'humano') return { texto: 'Lo atendés vos', clase: 'text-silver' };
  if (c.estado === 'derivado') return { texto: 'Espera tu respuesta', clase: 'text-warning' };
  return { texto: 'Con el asistente', clase: 'text-text-gray-light' };
}

/**
 * Bandeja de WhatsApp: las conversaciones que entran al número del estudio, con el asistente de menús, la ficha que
 * arma, la respuesta del abogado y el vínculo con clientes, expedientes y documentos. La conversación abierta queda en
 * la dirección (?tel=…), que es el enlace de los avisos de Telegram.
 */
export function WhatsApp() {
  const [params, setParams] = useSearchParams();
  const actual = params.get('tel');
  const [lista, setLista] = useState<ConversacionResumen[] | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const abrir = (tel: string | null) => setParams(tel ? { tel } : {});

  return (
    <div>
      <PageHeader
        eyebrow="Hoy"
        title="WhatsApp"
        descripcion="Mensajes de clientes y consultas al número del estudio. El asistente toma los datos; cuando respondés vos, se calla."
        count={lista?.length}
      />
      {error && <ErrorBanner message={error} />}
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${actual ? 'hidden lg:block' : ''} min-w-0`} aria-label="Conversaciones">
          <div className="superficie mb-3 flex h-10 items-center gap-2 px-3 focus-within:border-silver">
            <SearchIcon className="h-4 w-4 shrink-0 text-silver-deep" strokeWidth={1.6} aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o teléfono"
              aria-label="Buscar conversación"
              className="sin-contorno min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-text-gray-light"
            />
          </div>
          {lista === null ? (
            <p className="text-sm text-text-gray-light">Cargando…</p>
          ) : lista.length === 0 ? (
            <EmptyState message="Todavía no hay conversaciones. Aparecen acá apenas alguien escribe al número del estudio." />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {lista.map((c) => {
                const est = estadoDe(c);
                return (
                  <li key={c.telefono}>
                    <button
                      type="button"
                      onClick={() => abrir(c.telefono)}
                      aria-current={actual === c.telefono}
                      className={`superficie w-full px-3.5 py-3 text-left transition-colors hover:border-silver-deep ${actual === c.telefono ? 'border-silver' : ''}`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {c.urgente ? <span className="mr-1.5 text-warning">URGENTE</span> : null}
                          {nombreDe(c)}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-text-gray-light">{hora(c.ultimo_ts)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-silver-deep">{c.ultimo_texto}</p>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                        <span className={est.clase}>{est.texto}</span>
                        {c.no_leidos > 0 && (
                          <span className="rounded-full bg-silver px-1.5 font-bold text-structural-black" aria-label={`${c.no_leidos} sin leer`}>
                            {c.no_leidos}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
        <section className={`${actual ? '' : 'hidden lg:block'} min-w-0`} aria-label="Conversación">
          {actual ? (
            <Chat key={actual} telefono={actual} onVolver={() => abrir(null)} onCambio={cargarLista} />
          ) : (
            <EmptyState message="Elegí una conversación de la lista." />
          )}
        </section>
      </div>
    </div>
  );
}

function Chat({ telefono, onVolver, onCambio }: { telefono: string; onVolver: () => void; onCambio: () => void }) {
  const [conv, setConv] = useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<MensajeWhatsApp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fondo = useRef<HTMLDivElement>(null);
  const ultimo = useRef<string>('');

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

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await api.responder(telefono, texto.trim());
      setTexto('');
      cargar();
      onCambio();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  async function asistente(activo: boolean) {
    try {
      await api.asistente(telefono, activo);
      cargar();
      onCambio();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!conv) return error ? <ErrorBanner message={error} /> : <p className="text-sm text-text-gray-light">Cargando…</p>;
  const conAsistente = conv.estado !== 'humano' && conv.estado !== 'derivado';

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="superficie flex min-h-[60vh] min-w-0 flex-col">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <button type="button" onClick={onVolver} className="text-silver-deep hover:text-white lg:hidden" aria-label="Volver a la lista">
            <ArrowLeftIcon className="h-5 w-5" strokeWidth={1.6} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-white">{nombreDe(conv)}</p>
            <p className="text-xs text-text-gray-light">+{conv.telefono}</p>
          </div>
          {!conv.es_propio && (
            <Button variant="ghost" className={`${botonSecundario} h-8 px-3 text-xs`} onClick={() => void asistente(!conAsistente)}>
              <BotIcon className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />
              {conAsistente ? 'Silenciar asistente' : 'Reactivar asistente'}
            </Button>
          )}
        </header>
        <div className="max-h-[60vh] flex-1 overflow-y-auto px-4 py-4">
          <ul className="flex flex-col gap-2">
            {mensajes.map((m) => (
              <Burbuja key={m.id} m={m} conv={conv} onGuardado={cargar} />
            ))}
          </ul>
          <div ref={fondo} />
        </div>
        {error && (
          <div className="px-4 pb-2">
            <ErrorBanner message={error} />
          </div>
        )}
        {!conv.ventana_abierta && (
          <p className="border-t border-line px-4 py-2 text-xs text-warning">
            Pasaron más de 24 horas desde el último mensaje de esta persona: WhatsApp no deja escribirle texto libre hasta que vuelva a escribir.
          </p>
        )}
        <form onSubmit={(e) => void enviar(e)} className="flex items-end gap-2 border-t border-line p-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 760) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            maxLength={4096}
            placeholder="Escribí tu respuesta"
            aria-label="Respuesta"
            className="min-h-[44px] flex-1 resize-y rounded-sharp border border-line bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-silver"
          />
          <Button type="submit" className={`${botonPrincipal} h-11 px-4`} disabled={enviando || !texto.trim()} aria-label="Enviar">
            <SendIcon className="h-4 w-4" strokeWidth={1.8} />
          </Button>
        </form>
      </div>
      <PanelFicha conv={conv} onCambio={() => { cargar(); onCambio(); }} />
    </div>
  );
}

function Burbuja({ m, conv, onGuardado }: { m: MensajeWhatsApp; conv: Conversacion; onGuardado: () => void }) {
  const [abriendo, setAbriendo] = useState(false);
  const [guardar, setGuardar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entrante = m.direccion === 'in';
  const fallo = m.estado?.startsWith('error');

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

  return (
    <li className={`flex ${entrante ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] rounded-sharp border px-3 py-2 ${entrante ? 'border-line bg-white/[0.03]' : 'border-silver-deep/40 bg-silver/10'}`}>
        {m.tipo === 'auto' && <p className="mb-0.5 text-[10px] uppercase tracking-[0.08em] text-text-gray-light">Asistente</p>}
        <p className="whitespace-pre-wrap break-words text-sm text-white">{m.texto}</p>
        {m.tiene_adjunto ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="ghost" className={`${botonSecundario} h-7 px-2.5 text-xs`} onClick={() => void ver()} disabled={abriendo}>
              <PaperclipIcon className="mr-1 h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />
              {abriendo ? 'Abriendo…' : 'Ver adjunto'}
            </Button>
            {m.documento_id ? (
              <span className="self-center text-xs text-silver">Guardado como documento</span>
            ) : (
              <Button variant="ghost" className={`${botonSecundario} h-7 px-2.5 text-xs`} onClick={() => setGuardar((v) => !v)}>
                Guardar en el legajo
              </Button>
            )}
          </div>
        ) : null}
        {guardar && !m.documento_id && <GuardarDocumento m={m} conv={conv} onListo={() => { setGuardar(false); onGuardado(); }} />}
        {error && <p role="alert" className="mt-1 text-xs text-warning">{error}</p>}
        <p className={`mt-1 text-right text-[10px] ${fallo ? 'text-warning' : 'text-text-gray-light'}`}>
          {hora(m.ts)}
          {!entrante && m.estado ? ` · ${m.estado}` : ''}
        </p>
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

  if (!conv.cliente_id) return <p className="mt-2 text-xs text-text-gray-light">Primero vinculá la conversación con un cliente (panel de la derecha).</p>;

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
    <div className="mt-2 flex flex-col gap-2 border-t border-line pt-2">
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

  return (
    <aside className="superficie h-fit p-4" aria-label="Ficha y vínculos">
      <p className="eyebrow">Cliente y expediente</p>
      <div className="mt-2 flex flex-col gap-2">
        <select
          value={conv.cliente_id ?? ''}
          disabled={ocupado || clientes === null}
          onChange={(e) => void hacer(() => api.vincular(conv.telefono, { cliente_id: e.target.value || null }))}
          className={campo}
          aria-label="Cliente"
        >
          <option value="">Sin vincular</option>
          {ordenados.map((c) => (
            <option key={c.id} value={c.id}>
              {c.apellido}, {c.nombre}
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
            <Button variant="ghost" className={`${botonSecundario} h-8 text-xs`} disabled={ocupado} onClick={() => void hacer(() => api.crearCliente(conv.telefono))}>
              <UserPlusIcon className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />
              Crear cliente con estos datos
            </Button>
          )
        )}
        {error && <p role="alert" className="text-xs text-warning">{error}</p>}
      </div>
      {(conv.ficha || conv.relato) && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="eyebrow">Lo que tomó el asistente</p>
          {conv.ficha && <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-silver">{conv.ficha}</p>}
          {conv.relato && (
            <>
              <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-text-gray-light">Relato</p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-silver">{conv.relato}</p>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
