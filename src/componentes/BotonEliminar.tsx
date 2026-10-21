import { useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { ErrorBanner } from './ErrorBanner';

/** Conteo por categoría de lo que cuelga de un cliente o expediente, tal como lo informa la API en el 409. */
export type Vinculados = Record<string, number>;

const PALABRA_CONFIRMACION = 'ELIMINAR';

/** Si el error vino de un 409 de la API con el detalle de lo vinculado, lo devuelve. */
function vinculadosDelError(e: unknown): Vinculados | null {
  const cuerpo = (e as { cuerpo?: { vinculados?: unknown } } | null)?.cuerpo;
  const v = cuerpo?.vinculados;
  if (v === null || typeof v !== 'object') return null;
  const entradas = Object.entries(v as Record<string, unknown>).filter(
    (par): par is [string, number] => typeof par[1] === 'number' && par[1] > 0,
  );
  return entradas.length > 0 ? Object.fromEntries(entradas) : null;
}

const claseBoton = 'rounded-sharp border border-line text-text-gray-light hover:text-warning hover:border-warning';

/**
 * Botón de eliminar con confirmación.
 *
 * Primero pide una confirmación simple y manda el borrado normal. Si la API responde que hay registros
 * vinculados (409), muestra qué se perdería y exige escribir ELIMINAR antes de pedir el borrado definitivo
 * con todo su contenido. Los borrados simples (una audiencia, una tarea) no pasan por el segundo paso.
 */
export function BotonEliminar({
  etiqueta = 'Eliminar',
  descripcion,
  tituloConContenido,
  alternativa,
  eliminar,
  alEliminar,
  alFallar,
  className,
}: {
  etiqueta?: string;
  /** Qué se elimina, para el mensaje de confirmación: `la audiencia "Conciliación"`. */
  descripcion: string;
  /** Título del diálogo de confirmación fuerte. */
  tituloConContenido?: string;
  /** Texto con la salida reversible (archivar, pasar a inactivo), si existe. */
  alternativa?: string;
  /** Ejecuta el borrado. `conContenido` es true solo después de la confirmación fuerte. */
  eliminar: (conContenido: boolean) => Promise<unknown>;
  alEliminar: () => void;
  /** Recibe el mensaje cuando el borrado simple falla. Si falta, se muestra con un aviso del navegador. */
  alFallar?: (mensaje: string) => void;
  className?: string;
}) {
  const [procesando, setProcesando] = useState(false);
  const [vinculados, setVinculados] = useState<Vinculados | null>(null);
  const [escrito, setEscrito] = useState('');
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null);

  function informar(mensaje: string) {
    if (alFallar) alFallar(mensaje);
    else window.alert(mensaje);
  }

  async function pedirBorrado(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar ${descripcion}? Esta acción no se puede deshacer.`)) return;
    setProcesando(true);
    try {
      await eliminar(false);
      alEliminar();
    } catch (err) {
      const hallados = vinculadosDelError(err);
      if (hallados) {
        setEscrito('');
        setErrorDialogo(null);
        setVinculados(hallados);
      } else {
        informar(err instanceof Error ? err.message : `No se pudo eliminar ${descripcion}.`);
      }
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarConContenido() {
    setProcesando(true);
    setErrorDialogo(null);
    try {
      await eliminar(true);
      setVinculados(null);
      alEliminar();
    } catch (err) {
      setErrorDialogo(err instanceof Error ? err.message : `No se pudo eliminar ${descripcion}.`);
    } finally {
      setProcesando(false);
    }
  }

  function cerrar() {
    if (procesando) return;
    setVinculados(null);
    setEscrito('');
    setErrorDialogo(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={pedirBorrado}
        disabled={procesando}
        className={className ?? claseBoton}
      >
        {procesando && !vinculados ? 'Eliminando…' : etiqueta}
      </Button>

      <Dialog open={vinculados !== null} onOpenChange={(abierto) => !abierto && cerrar()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tituloConContenido ?? 'Eliminar con todo su contenido'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm text-white">
            <p>
              {descripcion.charAt(0).toUpperCase() + descripcion.slice(1)} tiene datos vinculados. Si seguís, se
              eliminan <strong>definitivamente</strong>, junto con los archivos, y no hay forma de recuperarlos:
            </p>
            <ul className="list-disc pl-5 text-text-gray-light">
              {vinculados &&
                Object.entries(vinculados).map(([categoria, total]) => (
                  <li key={categoria}>
                    {total} {categoria}
                  </li>
                ))}
            </ul>
            {alternativa && <p className="text-text-gray-light">{alternativa}</p>}
            <label htmlFor="confirmar-eliminacion" className="text-xs text-text-gray-light">
              Para confirmar, escribí {PALABRA_CONFIRMACION}
            </label>
            <input
              id="confirmar-eliminacion"
              value={escrito}
              onChange={(e) => setEscrito(e.target.value)}
              autoComplete="off"
              className="rounded-sharp bg-graphite border border-line px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-silver"
            />
            {errorDialogo && <ErrorBanner message={errorDialogo} />}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={confirmarConContenido}
              disabled={procesando || escrito.trim().toUpperCase() !== PALABRA_CONFIRMACION}
              className="rounded-sharp bg-warning text-structural-black font-bold hover:brightness-110 disabled:opacity-50"
            >
              {procesando ? 'Eliminando…' : 'Eliminar todo definitivamente'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={cerrar}
              disabled={procesando}
              className="rounded-sharp border border-line text-text-gray-light hover:text-white"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
