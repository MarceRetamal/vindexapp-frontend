import { useEffect, useRef, useState } from 'react';
import {
  CATEGORIAS,
  CODIGOS,
  eliminarDocumento,
  listarDocumentos,
  pedirDescarga,
  subirDocumento,
  type CategoriaDocumento,
  type Documento,
} from '../api/documentos';
import { api as templatesApi, type Template } from '../api/templates';
import { api as generadorApi } from '../api/generadorDocumentos';
import { Input } from '@/componentes/ui/input';
import { Button } from '@/componentes/ui/button';
import { ErrorBanner } from '@/componentes/ErrorBanner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/componentes/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/ui/select';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';

const formateadorFecha = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  expedienteId?: string;
  clienteId?: string;
}

export function PanelDocumentos({ expedienteId, clienteId }: Props) {
  const [documentos, setDocumentos] = useState<Documento[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ultimoIdAgregado, setUltimoIdAgregado] = useState<string | null>(null);

  const [archivoPendiente, setArchivoPendiente] = useState<File | null>(null);
  const [categoria, setCategoria] = useState<CategoriaDocumento>('escrito_judicial');
  const [notas, setNotas] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [descargandoId, setDescargandoId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const [generadorAbierto, setGeneradorAbierto] = useState(false);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [templateSeleccionado, setTemplateSeleccionado] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [errorGenerador, setErrorGenerador] = useState<string | null>(null);

  const inputArchivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDocumentos(null);
    setError(null);
    listarDocumentos({ expediente_id: expedienteId, cliente_id: clienteId })
      .then(setDocumentos)
      .catch((e: Error) => setError(e.message));
  }, [expedienteId, clienteId]);

  function elegirArchivo(archivo: File) {
    setArchivoPendiente(archivo);
    setNotas('');
    setErrorSubida(null);
  }

  function cancelarPendiente() {
    setArchivoPendiente(null);
    setErrorSubida(null);
    if (inputArchivoRef.current) inputArchivoRef.current.value = '';
  }

  async function confirmarSubida() {
    if (!archivoPendiente) return;
    setSubiendo(true);
    setProgreso(0);
    setErrorSubida(null);
    try {
      const documento = await subirDocumento({
        archivo: archivoPendiente,
        categoria,
        expedienteId,
        clienteId,
        notas: notas.trim() || undefined,
        onProgreso: setProgreso,
      });
      setDocumentos((actuales) => [documento, ...(actuales ?? [])]);
      setUltimoIdAgregado(documento.id);
      setArchivoPendiente(null);
      setNotas('');
      if (inputArchivoRef.current) inputArchivoRef.current.value = '';
    } catch (e) {
      setErrorSubida(e instanceof Error ? e.message : 'Error desconocido al archivar el documento.');
    } finally {
      setSubiendo(false);
    }
  }

  async function descargar(documento: Documento) {
    setDescargandoId(documento.id);
    try {
      const { url_descarga } = await pedirDescarga(documento.id);
      window.open(url_descarga, '_blank', 'noopener,noreferrer');
    } catch {
      setError(`No se pudo preparar la descarga de "${documento.nombre}".`);
    } finally {
      setDescargandoId(null);
    }
  }

  async function eliminar(documento: Documento) {
    if (!window.confirm(`¿Eliminar el documento "${documento.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setEliminandoId(documento.id);
    try {
      await eliminarDocumento(documento.id);
      setDocumentos((actuales) => (actuales ?? []).filter((d) => d.id !== documento.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : `No se pudo eliminar el documento "${documento.nombre}".`);
    } finally {
      setEliminandoId(null);
    }
  }

  const total = documentos?.length ?? 0;

  function abrirGenerador() {
    setGeneradorAbierto(true);
    setErrorGenerador(null);
    setTemplateSeleccionado(null);
    setTemplates(null);
    templatesApi
      .listarTemplates()
      .then(setTemplates)
      .catch((e: Error) => setErrorGenerador(e.message));
  }

  async function generarDocumento() {
    if (!expedienteId || !templateSeleccionado) return;
    setGenerando(true);
    setErrorGenerador(null);
    try {
      await generadorApi.generarDocumento({
        template_id: templateSeleccionado,
        expediente_id: expedienteId,
      });
      const actualizados = await listarDocumentos({ expediente_id: expedienteId, cliente_id: clienteId });
      const nuevo = actualizados.find(
        (d) => !documentos?.some((existente) => existente.id === d.id)
      );
      setDocumentos(actualizados);
      if (nuevo) setUltimoIdAgregado(nuevo.id);
      setGeneradorAbierto(false);
    } catch (e) {
      setErrorGenerador(e instanceof Error ? e.message : 'Error desconocido al generar el documento.');
    } finally {
      setGenerando(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-bold text-white">Documentos</h2>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-xs text-text-gray-light font-mono">
              {total} {total === 1 ? 'ficha' : 'fichas'}
            </span>
          )}
          {expedienteId && (
            <Button
              onClick={abrirGenerador}
              variant="outline"
              className="rounded-sharp h-7 px-3 text-xs"
            >
              Generar documento
            </Button>
          )}
        </div>
      </div>

      {expedienteId && (
        <Dialog open={generadorAbierto} onOpenChange={setGeneradorAbierto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar documento</DialogTitle>
            </DialogHeader>

            {templates === null && !errorGenerador && (
              <p className="text-sm text-text-gray-light">Cargando templates…</p>
            )}

            {templates !== null && templates.length === 0 && (
              <p className="text-sm text-text-gray-light italic">
                No hay templates cargados todavía.
              </p>
            )}

            {templates !== null && templates.length > 0 && (
              <Select
                value={templateSeleccionado ?? undefined}
                onValueChange={(v) => setTemplateSeleccionado(v as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {errorGenerador && <ErrorBanner message={errorGenerador} />}

            <DialogFooter>
              <Button
                onClick={generarDocumento}
                disabled={!templateSeleccionado || generando}
                className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110"
              >
                {generando ? 'Generando…' : 'Generar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bandeja de recepción */}
      {!archivoPendiente && (
        <div
          onClick={() => !subiendo && inputArchivoRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!subiendo) setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            const archivo = e.dataTransfer.files?.[0];
            if (archivo && !subiendo) elegirArchivo(archivo);
          }}
          className={`rounded-sharp border border-dashed px-4 py-6 text-center transition-colors ${
            subiendo ? 'cursor-default opacity-50' : 'cursor-pointer'
          } ${arrastrando ? 'border-silver bg-graphite' : 'border-line bg-graphite/60'}`}
        >
          <p className="m-0 text-sm text-text-gray-light">
            Arrastrá un documento acá, o hacé clic para seleccionarlo
          </p>
          <input
            ref={inputArchivoRef}
            type="file"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) elegirArchivo(archivo);
            }}
            className="hidden"
          />
        </div>
      )}

      {/* Ficha pendiente de archivar */}
      {archivoPendiente && (
        <div className="border border-line rounded-sharp bg-graphite p-4">
          <div className="flex justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white break-all">
                {archivoPendiente.name}
              </div>
              <div className="text-xs text-text-gray-light font-mono mt-0.5">
                {formatearTamano(archivoPendiente.size)}
              </div>
            </div>
            {!subiendo && (
              <button
                onClick={cancelarPendiente}
                className="border-none bg-transparent text-text-gray-light text-xs cursor-pointer shrink-0 hover:text-white"
              >
                Cancelar
              </button>
            )}
          </div>

          {!subiendo ? (
            <>
              <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                <label htmlFor="doc-categoria" className={etiquetaClases}>
                  Categoría
                  <select
                    id="doc-categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}
                    className={`${campoClases} block w-full mt-1 h-8 px-2.5 text-sm text-white outline-none border`}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.valor} value={c.valor} className="bg-graphite text-white">
                        {c.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="doc-notas" className={etiquetaClases}>
                  Notas (opcional)
                  <Input
                    id="doc-notas"
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className={`${campoClases} block w-full mt-1`}
                  />
                </label>
              </div>

              {errorSubida && (
                <div className="mt-3">
                  <ErrorBanner message={errorSubida} />
                </div>
              )}

              <Button
                onClick={confirmarSubida}
                className="mt-3.5 rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver"
              >
                Archivar
              </Button>
            </>
          ) : (
            <div className="mt-3.5">
              <div className="h-[3px] rounded-sharp bg-line overflow-hidden">
                <div
                  className="h-full bg-silver transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.round(progreso * 100)}%` }}
                />
              </div>
              <div className="text-xs text-text-gray-light font-mono mt-1.5">
                Archivando… {Math.round(progreso * 100)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ledger */}
      <div className="mt-4">
        {error && (
          <p className="text-sm text-warning">No se pudo cargar el listado: {error}</p>
        )}

        {documentos === null && !error && (
          <p className="text-sm text-text-gray-light">Cargando…</p>
        )}

        {documentos !== null && documentos.length === 0 && (
          <p className="text-sm text-text-gray-light italic">
            Todavía no se archivó ningún documento en este expediente.
          </p>
        )}

        {documentos !== null &&
          documentos.map((doc, i) => (
            <FilaDocumento
              key={doc.id}
              documento={doc}
              folio={documentos.length - i}
              esNueva={doc.id === ultimoIdAgregado}
              descargando={descargandoId === doc.id}
              onDescargar={() => descargar(doc)}
              eliminando={eliminandoId === doc.id}
              onEliminar={() => eliminar(doc)}
            />
          ))}
      </div>
    </section>
  );
}

function FilaDocumento({
  documento,
  folio,
  esNueva,
  descargando,
  onDescargar,
  eliminando,
  onEliminar,
}: {
  documento: Documento;
  folio: number;
  esNueva: boolean;
  descargando: boolean;
  onDescargar: () => void;
  eliminando: boolean;
  onEliminar: () => void;
}) {
  const [visible, setVisible] = useState(!esNueva);

  useEffect(() => {
    if (!esNueva) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [esNueva]);

  return (
    <div
      className="grid items-center gap-3 py-2.5 px-1 border-b border-line transition-[opacity,transform] duration-250 ease-out"
      style={{
        gridTemplateColumns: '44px 40px minmax(0, 1fr) auto auto auto',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-4px)',
      }}
    >
      <span className="text-xs text-text-gray-light font-mono">
        N.° {String(folio).padStart(3, '0')}
      </span>

      <span
        className="text-[10px] font-mono font-semibold text-silver border border-silver rounded-sharp px-1.5 py-0.5 text-center"
        title={CATEGORIAS.find((c) => c.valor === documento.categoria)?.etiqueta}
      >
        {CODIGOS[documento.categoria]}
      </span>

      <div className="min-w-0">
        <div className="text-sm text-white break-words">{documento.nombre}</div>
        {documento.notas && (
          <div className="text-xs text-text-gray-light mt-0.5">{documento.notas}</div>
        )}
      </div>

      <span className="text-xs text-text-gray-light font-mono whitespace-nowrap">
        {formatearTamano(documento.tamano_bytes)} · {formateadorFecha.format(new Date(documento.creado_en))}
      </span>

      <button
        onClick={onDescargar}
        disabled={descargando}
        className={`border-none bg-transparent text-silver text-xs font-semibold whitespace-nowrap ${
          descargando ? 'cursor-default opacity-50' : 'cursor-pointer hover:brightness-125'
        }`}
      >
        {descargando ? 'Preparando…' : 'Descargar'}
      </button>

      <button
        onClick={onEliminar}
        disabled={eliminando}
        className={`border-none bg-transparent text-warning text-xs font-semibold whitespace-nowrap ${
          eliminando ? 'cursor-default opacity-50' : 'cursor-pointer hover:brightness-125'
        }`}
      >
        {eliminando ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  );
}