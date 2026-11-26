import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { ErrorBanner } from './ErrorBanner';
const PALABRA_CONFIRMACION = 'ELIMINAR';
/**
 * Si el error vino de un 409 de la API que pide una confirmación más fuerte, lo informa: con el detalle de lo
 * vinculado (clientes y expedientes) o solo con la bandera `requiere_confirmacion` (presupuestos firmados).
 */
function confirmacionPedida(e) {
    const cuerpo = e?.cuerpo;
    const v = cuerpo?.vinculados;
    if (v !== null && typeof v === 'object') {
        const entradas = Object.entries(v).filter((par) => typeof par[1] === 'number' && par[1] > 0);
        if (entradas.length > 0)
            return { vinculados: Object.fromEntries(entradas) };
    }
    return cuerpo?.requiere_confirmacion === true ? { vinculados: null } : null;
}
const claseBoton = 'rounded-sharp border border-line text-text-gray-light hover:text-warning hover:border-warning';
/**
 * Botón de eliminar con confirmación.
 *
 * Primero pide una confirmación simple y manda el borrado normal. Si la API responde que hay registros
 * vinculados (409), muestra qué se perdería y exige escribir ELIMINAR antes de pedir el borrado definitivo
 * con todo su contenido. Los borrados simples (una audiencia, una tarea) no pasan por el segundo paso.
 */
export function BotonEliminar({ etiqueta = 'Eliminar', descripcion, tituloConContenido, alternativa, textoConfirmacion, eliminar, alEliminar, alFallar, className, }) {
    const [procesando, setProcesando] = useState(false);
    const [abierto, setAbierto] = useState(false);
    const [vinculados, setVinculados] = useState(null);
    const [escrito, setEscrito] = useState('');
    const [errorDialogo, setErrorDialogo] = useState(null);
    function informar(mensaje) {
        if (alFallar)
            alFallar(mensaje);
        else
            window.alert(mensaje);
    }
    async function pedirBorrado(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`¿Eliminar ${descripcion}? Esta acción no se puede deshacer.`))
            return;
        setProcesando(true);
        try {
            await eliminar(false);
            alEliminar();
        }
        catch (err) {
            const pedida = confirmacionPedida(err);
            if (pedida) {
                setEscrito('');
                setErrorDialogo(null);
                setVinculados(pedida.vinculados);
                setAbierto(true);
            }
            else {
                informar(err instanceof Error ? err.message : `No se pudo eliminar ${descripcion}.`);
            }
        }
        finally {
            setProcesando(false);
        }
    }
    async function confirmarConContenido() {
        setProcesando(true);
        setErrorDialogo(null);
        try {
            await eliminar(true);
            setAbierto(false);
            alEliminar();
        }
        catch (err) {
            setErrorDialogo(err instanceof Error ? err.message : `No se pudo eliminar ${descripcion}.`);
        }
        finally {
            setProcesando(false);
        }
    }
    function cerrar() {
        if (procesando)
            return;
        setAbierto(false);
        setVinculados(null);
        setEscrito('');
        setErrorDialogo(null);
    }
    return (_jsxs(_Fragment, { children: [_jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: pedirBorrado, disabled: procesando, className: className ?? claseBoton, children: procesando && !abierto ? 'Eliminando…' : etiqueta }), _jsx(Dialog, { open: abierto, onOpenChange: (estaAbierto) => !estaAbierto && cerrar(), children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: tituloConContenido ?? 'Eliminar con todo su contenido' }) }), _jsxs("div", { className: "flex flex-col gap-3 text-sm text-white", children: [vinculados ? (_jsxs(_Fragment, { children: [_jsxs("p", { children: [descripcion.charAt(0).toUpperCase() + descripcion.slice(1), " tiene datos vinculados. Si segu\u00EDs, se eliminan ", _jsx("strong", { children: "definitivamente" }), ", junto con los archivos, y no hay forma de recuperarlos:"] }), _jsx("ul", { className: "list-disc pl-5 text-text-gray-light", children: Object.entries(vinculados).map(([categoria, total]) => (_jsxs("li", { children: [total, " ", categoria] }, categoria))) })] })) : (_jsx("p", { children: textoConfirmacion ??
                                        `Para eliminar ${descripcion} hace falta una confirmación expresa. No hay forma de recuperarlo.` })), alternativa && _jsx("p", { className: "text-text-gray-light", children: alternativa }), _jsxs("label", { htmlFor: "confirmar-eliminacion", className: "text-xs text-text-gray-light", children: ["Para confirmar, escrib\u00ED ", PALABRA_CONFIRMACION] }), _jsx("input", { id: "confirmar-eliminacion", value: escrito, onChange: (e) => setEscrito(e.target.value), autoComplete: "off", className: "rounded-sharp bg-graphite border border-line px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-silver" }), errorDialogo && _jsx(ErrorBanner, { message: errorDialogo })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", onClick: confirmarConContenido, disabled: procesando || escrito.trim().toUpperCase() !== PALABRA_CONFIRMACION, className: "rounded-sharp bg-warning text-structural-black font-bold hover:brightness-110 disabled:opacity-50", children: procesando ? 'Eliminando…' : vinculados ? 'Eliminar todo definitivamente' : 'Eliminar definitivamente' }), _jsx(Button, { type: "button", variant: "ghost", onClick: cerrar, disabled: procesando, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Cancelar" })] })] }) })] }));
}
