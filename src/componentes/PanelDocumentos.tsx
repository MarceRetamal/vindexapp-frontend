import { useEffect, useRef, useState } from 'react';
import {
  CATEGORIAS,
  CODIGOS,
  listarDocumentos,
  pedirDescarga,
  subirDocumento,
  type CategoriaDocumento,
  type Documento,
} from '../api/documentos';

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

  const total = documentos?.length ?? 0;

  return (
    <section style={{ marginTop: 32 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <h2 style={{ fontSize: 17 }}>Documentos</h2>
        {total > 0 && (
          <span style={{ fontSize: 12, color: 'var(--tinta-suave)', fontFamily: 'var(--fuente-dato)' }}>
            {total} {total === 1 ? 'ficha' : 'fichas'}
          </span>
        )}
      </div>

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
          style={{
            border: `1px dashed ${arrastrando ? 'var(--acento)' : 'var(--linea)'}`,
            borderRadius: 'var(--radio)',
            background: arrastrando ? 'var(--acento-suave)' : 'var(--papel-elevado)',
            padding: '22px 16px',
            textAlign: 'center',
            cursor: subiendo ? 'default' : 'pointer',
            opacity: subiendo ? 0.5 : 1,
            transition: 'border-color .15s ease, background .15s ease, transform .15s ease',
            transform: arrastrando ? 'scale(1.005)' : 'scale(1)',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: 'var(--tinta-suave)' }}>
            Arrastrá un documento acá, o hacé clic para seleccionarlo
          </p>
          <input
            ref={inputArchivoRef}
            type="file"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) elegirArchivo(archivo);
            }}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Ficha pendiente de archivar */}
      {archivoPendiente && (
        <div
          style={{
            border: '1px solid var(--linea)',
            borderRadius: 'var(--radio)',
            background: 'var(--papel-elevado)',
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>
                {archivoPendiente.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--tinta-suave)',
                  fontFamily: 'var(--fuente-dato)',
                  marginTop: 2,
                }}
              >
                {formatearTamano(archivoPendiente.size)}
              </div>
            </div>
            {!subiendo && (
              <button
                onClick={cancelarPendiente}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--tinta-suave)',
                  fontSize: 12,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Cancelar
              </button>
            )}
          </div>

          {!subiendo ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
                  Categoría
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: 4,
                      padding: '6px 8px',
                      border: '1px solid var(--linea)',
                      borderRadius: 'var(--radio)',
                      background: 'var(--papel)',
                      color: 'var(--tinta)',
                    }}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.valor} value={c.valor}>
                        {c.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: 'var(--tinta-suave)' }}>
                  Notas (opcional)
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: 4,
                      padding: '6px 8px',
                      border: '1px solid var(--linea)',
                      borderRadius: 'var(--radio)',
                      background: 'var(--papel)',
                      color: 'var(--tinta)',
                    }}
                  />
                </label>
              </div>

              {errorSubida && (
                <div
                  style={{
                    marginTop: 12,
                    background: '#fdf1ef',
                    border: '1px solid var(--alerta)',
                    color: 'var(--alerta)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radio)',
                    fontSize: 12,
                  }}
                >
                  {errorSubida}
                </div>
              )}

              <button
                onClick={confirmarSubida}
                style={{
                  marginTop: 14,
                  border: 'none',
                  borderRadius: 'var(--radio)',
                  background: 'var(--acento)',
                  color: '#fff',
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Archivar
              </button>
            </>
          ) : (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  height: 3,
                  borderRadius: 'var(--radio)',
                  background: 'var(--linea)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round(progreso * 100)}%`,
                    background: 'var(--acento)',
                    transition: 'width .15s ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--tinta-suave)',
                  fontFamily: 'var(--fuente-dato)',
                  marginTop: 6,
                }}
              >
                Archivando… {Math.round(progreso * 100)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ledger */}
      <div style={{ marginTop: 18 }}>
        {error && (
          <p style={{ fontSize: 13, color: 'var(--alerta)' }}>No se pudo cargar el listado: {error}</p>
        )}

        {documentos === null && !error && (
          <p style={{ fontSize: 13, color: 'var(--tinta-suave)' }}>Cargando…</p>
        )}

        {documentos !== null && documentos.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--tinta-suave)', fontStyle: 'italic' }}>
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
}: {
  documento: Documento;
  folio: number;
  esNueva: boolean;
  descargando: boolean;
  onDescargar: () => void;
}) {
  const [visible, setVisible] = useState(!esNueva);

  useEffect(() => {
    if (!esNueva) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [esNueva]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 40px 1fr auto auto',
        alignItems: 'center',
        gap: 12,
        padding: '10px 4px',
        borderBottom: '1px solid var(--linea)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-4px)',
        transition: 'opacity .25s ease, transform .25s ease',
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--tinta-suave)', fontFamily: 'var(--fuente-dato)' }}>
        N.° {String(folio).padStart(3, '0')}
      </span>

      <span
        style={{
          fontSize: 10,
          fontFamily: 'var(--fuente-dato)',
          fontWeight: 600,
          color: 'var(--acento)',
          border: '1px solid var(--acento)',
          borderRadius: 'var(--radio)',
          padding: '2px 5px',
          textAlign: 'center',
        }}
        title={CATEGORIAS.find((c) => c.valor === documento.categoria)?.etiqueta}
      >
        {CODIGOS[documento.categoria]}
      </span>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, wordBreak: 'break-word' }}>{documento.nombre}</div>
        {documento.notas && (
          <div style={{ fontSize: 11, color: 'var(--tinta-suave)', marginTop: 2 }}>{documento.notas}</div>
        )}
      </div>

      <span style={{ fontSize: 11, color: 'var(--tinta-suave)', fontFamily: 'var(--fuente-dato)', whiteSpace: 'nowrap' }}>
        {formatearTamano(documento.tamano_bytes)} · {formateadorFecha.format(new Date(documento.creado_en))}
      </span>

      <button
        onClick={onDescargar}
        disabled={descargando}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--acento)',
          fontSize: 12,
          fontWeight: 600,
          cursor: descargando ? 'default' : 'pointer',
          opacity: descargando ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {descargando ? 'Preparando…' : 'Descargar'}
      </button>
    </div>
  );
}