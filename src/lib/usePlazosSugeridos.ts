import { useEffect, useRef, useState } from 'react';
import { apiPlazos, type SugerenciaPlazo } from '../api/novedades';

const POR_LOTE = 50;

/**
 * Pide la propuesta de plazo de las novedades que se están mostrando, una sola vez por novedad y en lotes de 50.
 * Es un agregado: si falla, la pantalla se muestra igual y simplemente no hay propuestas.
 */
export function usePlazosSugeridos(novedades: { id: string }[]): Record<string, SugerenciaPlazo> {
  const [sugerencias, setSugerencias] = useState<Record<string, SugerenciaPlazo>>({});
  const pedidas = useRef(new Set<string>());
  const clave = novedades.map((n) => n.id).join(',');

  useEffect(() => {
    const faltan = novedades.map((n) => n.id).filter((id) => !pedidas.current.has(id));
    if (faltan.length === 0) return;
    faltan.forEach((id) => pedidas.current.add(id));
    for (let i = 0; i < faltan.length; i += POR_LOTE) {
      apiPlazos
        .plazosSugeridos(faltan.slice(i, i + POR_LOTE))
        .then((r) => setSugerencias((actual) => ({ ...actual, ...r.sugerencias })))
        .catch(() => undefined);
    }
    // Reacciona solo a que cambie el conjunto de ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return sugerencias;
}
