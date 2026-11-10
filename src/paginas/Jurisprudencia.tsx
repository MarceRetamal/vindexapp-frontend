import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CheckIcon, ChevronDownIcon, CopyIcon, ExternalLinkIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { api, type DocumentoJurisprudencia, type Jurisdiccion, type PaginaJurisprudencia, type ResultadoJurisprudencia } from '../api/jurisprudencia';
import { Chips } from '../componentes/BarraFiltros';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { PageHeader } from '../componentes/PageHeader';
import { enlaceSeguro } from '../lib/texto';

const botonPrincipal =
  'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver';
const botonSecundario = 'rounded-sharp border border-line text-text-gray-light hover:text-white';

const JURISDICCIONES: { valor: Jurisdiccion; texto: string }[] = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'buenos_aires', texto: 'Provincia de Buenos Aires' },
  { valor: 'federal', texto: 'Federal' },
  { valor: 'nacional', texto: 'Nacional' },
];

/** Buscadores oficiales que no se pueden consultar desde el sistema: se abren en otra pestaña. */
const FUENTES_OFICIALES = [
  { nombre: 'CSJN, fallos completos', url: 'https://sjconsulta.csjn.gov.ar/sjconsulta/fallos/consulta.html' },
  { nombre: 'SCBA, JUBA', url: 'https://juba.scba.gov.ar/Busquedas.aspx' },
];

function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Lo que SAIJ informa del sumario, tal cual: no se completa nada que la fuente no diga. */
function citaDe(r: Pick<ResultadoJurisprudencia, 'titulo' | 'numero_sumario' | 'fecha' | 'enlace'>): string {
  const partes = [r.titulo, r.numero_sumario ? `sumario ${r.numero_sumario}` : null, r.fecha ? fechaLegible(r.fecha) : null, 'SAIJ', r.enlace];
  return partes.filter(Boolean).join(', ');
}

/**
 * Buscador de jurisprudencia. Consulta SAIJ (Ministerio de Justicia) y muestra los sumarios; cada uno se abre acá
 * mismo y enlaza a la fuente. La búsqueda queda en la dirección (?q=…), así se puede volver atrás o compartirla.
 */
export function Jurisprudencia() {
  const [params, setParams] = useSearchParams();
  const consulta = params.get('q') ?? '';
  const jurisdiccion = (JURISDICCIONES.find((j) => j.valor === params.get('j'))?.valor ?? 'todas') as Jurisdiccion;

  const [texto, setTexto] = useState(consulta);
  const [pagina, setPagina] = useState<PaginaJurisprudencia | null>(null);
  const [resultados, setResultados] = useState<ResultadoJurisprudencia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pedidoActual = useRef(0);

  useEffect(() => {
    setTexto(consulta);
    if (consulta.trim().length < 3) {
      setPagina(null);
      setResultados([]);
      setError(null);
      return;
    }
    const turno = ++pedidoActual.current;
    setBuscando(true);
    setError(null);
    api
      .buscar(consulta, jurisdiccion, 1)
      .then((p) => {
        if (turno !== pedidoActual.current) return;
        setPagina(p);
        setResultados(p.resultados);
      })
      .catch((e: Error) => {
        if (turno !== pedidoActual.current) return;
        setPagina(null);
        setResultados([]);
        setError(e.message);
      })
      .finally(() => {
        if (turno === pedidoActual.current) setBuscando(false);
      });
  }, [consulta, jurisdiccion]);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const q = texto.trim();
    if (q.length < 3) return;
    setParams(jurisdiccion === 'todas' ? { q } : { q, j: jurisdiccion });
  }

  function cambiarJurisdiccion(j: Jurisdiccion) {
    const siguiente: Record<string, string> = {};
    if (consulta) siguiente.q = consulta;
    if (j !== 'todas') siguiente.j = j;
    setParams(siguiente);
  }

  async function cargarMas() {
    if (!pagina) return;
    setCargandoMas(true);
    try {
      const p = await api.buscar(consulta, jurisdiccion, pagina.pagina + 1);
      setPagina(p);
      setResultados((previos) => [...previos, ...p.resultados.filter((r) => !previos.some((x) => x.id === r.id))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar más resultados.');
    } finally {
      setCargandoMas(false);
    }
  }

  const hayMas = pagina !== null && pagina.resultados.length === pagina.por_pagina && resultados.length < pagina.total;

  return (
    <div>
      <PageHeader eyebrow="Causas" title="Jurisprudencia" descripcion="Sumarios de jurisprudencia de todo el país, de la base oficial del Ministerio de Justicia (SAIJ)." />

      <form onSubmit={buscar} className="flex flex-col gap-3 sm:flex-row" role="search">
        <div className="superficie flex h-12 min-w-0 flex-1 items-center gap-3 px-4 focus-within:border-silver">
          <SearchIcon className="h-[18px] w-[18px] shrink-0 text-silver-deep" strokeWidth={1.6} aria-hidden="true" />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Por ejemplo: caducidad de instancia, cuidado personal, daño moral"
            aria-label="Buscar jurisprudencia"
            autoFocus
            maxLength={200}
            className="sin-contorno min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-text-gray-light [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
        <Button type="submit" className={`${botonPrincipal} h-12 px-6`} disabled={buscando || texto.trim().length < 3}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </Button>
      </form>

      <div className="mt-4">
        <Chips etiqueta="Jurisdicción" valor={jurisdiccion} opciones={JURISDICCIONES} onCambio={cambiarJurisdiccion} />
      </div>

      <div className="mt-6">
        {error && <ErrorBanner message={error} />}
        {buscando && <ListSkeleton rows={4} />}

        {!buscando && !error && consulta.trim().length < 3 && (
          <EmptyState message="Escribí el tema que necesitás y tocá Buscar. Los resultados son sumarios: el criterio del tribunal resumido, con el enlace a la fuente." />
        )}

        {!buscando && !error && pagina !== null && resultados.length === 0 && (
          <EmptyState message={`No hay sumarios para "${pagina.consulta}"${jurisdiccion === 'todas' ? '' : ' en esa jurisdicción'}. Probá con menos palabras o con otro término.`} />
        )}

        {!buscando && pagina !== null && resultados.length > 0 && (
          <>
            <p className="mb-3 text-xs text-text-gray-light" aria-live="polite">
              {pagina.total.toLocaleString('es-AR')} {pagina.total === 1 ? 'sumario' : 'sumarios'} para "{pagina.consulta}", los más recientes primero.
            </p>
            <ul className="flex flex-col gap-3">
              {resultados.map((r) => (
                <Sumario key={r.id} resultado={r} />
              ))}
            </ul>
            {hayMas && (
              <div className="mt-5 flex justify-center">
                <Button variant="ghost" className={botonSecundario} onClick={() => void cargarMas()} disabled={cargandoMas}>
                  {cargandoMas ? 'Cargando…' : 'Ver más resultados'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <section className="mt-10 border-t border-line pt-6" aria-label="Otras fuentes oficiales">
        <p className="eyebrow">Otras fuentes oficiales</p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-text-gray-light">
          Los buscadores de la Corte Suprema y de la Suprema Corte bonaerense no permiten consultarse desde otro sistema. Se abren en una pestaña nueva.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FUENTES_OFICIALES.map((f) => (
            <a
              key={f.url}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-sharp border border-line px-3.5 text-[13px] text-silver-deep transition-colors hover:border-silver-deep hover:text-white"
            >
              {f.nombre}
              <ExternalLinkIcon className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function Sumario({ resultado: r }: { resultado: ResultadoJurisprudencia }) {
  const [abierto, setAbierto] = useState(false);
  const [documento, setDocumento] = useState<DocumentoJurisprudencia | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<'cita' | 'texto' | null>(null);
  const enlace = enlaceSeguro(r.enlace);

  function alternar() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (!siguiente || documento || cargando) return;
    setCargando(true);
    setError(null);
    api
      .documento(r.id)
      .then(setDocumento)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }

  async function copiar(que: 'cita' | 'texto') {
    const contenido = que === 'cita' ? citaDe(r) : `${(documento?.parrafos ?? [r.extracto]).join('\n\n')}\n\n(${citaDe(r)})`;
    try {
      await navigator.clipboard.writeText(contenido);
      setCopiado(que);
      window.setTimeout(() => setCopiado(null), 2000);
    } catch {
      setError('El navegador no permitió copiar. Seleccioná el texto y copialo a mano.');
    }
  }

  const datos = [r.fecha ? fechaLegible(r.fecha) : null, r.jurisdiccion, r.tipo_tribunal ? `Tribunal: ${r.tipo_tribunal}` : null, r.numero_sumario ? `Sumario ${r.numero_sumario}` : null].filter(Boolean);
  const idPanel = `sumario-${r.id}`;

  return (
    <li className="superficie p-5">
      <button type="button" onClick={alternar} aria-expanded={abierto} aria-controls={idPanel} className="flex w-full items-start gap-3 text-left">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold leading-snug text-white first-letter:uppercase">{r.titulo}</h2>
          {datos.length > 0 && <p className="mt-1 text-xs text-text-gray-light">{datos.join(' · ')}</p>}
          {!abierto && r.extracto && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-silver-deep">{r.extracto}</p>}
        </div>
        <ChevronDownIcon className={`mt-0.5 h-5 w-5 shrink-0 text-silver-deep transition-transform ${abierto ? 'rotate-180' : ''}`} strokeWidth={1.6} aria-hidden="true" />
      </button>

      {abierto && (
        <div id={idPanel} className="mt-4 border-t border-line pt-4">
          {cargando && <p className="text-sm text-text-gray-light">Trayendo el sumario completo…</p>}
          {error && <p role="alert" className="text-sm text-warning">{error}</p>}
          {(documento?.parrafos ?? (cargando ? [] : [r.extracto])).map((p, i) => (
            <p key={i} className="mb-3 max-w-3xl text-sm leading-relaxed text-silver">
              {p}
            </p>
          ))}
          {documento?.materia && <p className="text-xs text-text-gray-light">Materia: {documento.materia.toLowerCase()}</p>}
          {r.voces.length > 0 && <p className="mt-1 text-xs text-text-gray-light">Voces: {r.voces.join(', ')}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" className={botonSecundario} onClick={() => void copiar('texto')} disabled={cargando}>
              {copiado === 'texto' ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
              {copiado === 'texto' ? 'Copiado' : 'Copiar texto y cita'}
            </Button>
            <Button variant="ghost" size="sm" className={botonSecundario} onClick={() => void copiar('cita')}>
              {copiado === 'cita' ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
              {copiado === 'cita' ? 'Copiada' : 'Copiar cita'}
            </Button>
            {enlace && (
              <a
                href={enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-1.5 rounded-sharp border border-line px-2.5 text-[0.8rem] text-text-gray-light transition-colors hover:text-white"
              >
                Abrir en SAIJ
                <ExternalLinkIcon className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
