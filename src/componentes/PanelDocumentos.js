import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { CATEGORIAS, CODIGOS, eliminarDocumento, listarDocumentos, pedirDescarga, subirDocumento, } from '../api/documentos';
import { api as templatesApi } from '../api/templates';
import { api as generadorApi } from '../api/generadorDocumentos';
import { Input } from '@/componentes/ui/input';
import { Button } from '@/componentes/ui/button';
import { ErrorBanner } from '@/componentes/ErrorBanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from '@/componentes/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/componentes/ui/select';
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
const formateadorFecha = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});
function formatearTamano(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export function PanelDocumentos({ expedienteId, clienteId }) {
    const [documentos, setDocumentos] = useState(null);
    const [error, setError] = useState(null);
    const [ultimoIdAgregado, setUltimoIdAgregado] = useState(null);
    const [archivoPendiente, setArchivoPendiente] = useState(null);
    const [categoria, setCategoria] = useState('escrito_judicial');
    const [notas, setNotas] = useState('');
    const [subiendo, setSubiendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [errorSubida, setErrorSubida] = useState(null);
    const [arrastrando, setArrastrando] = useState(false);
    const [descargandoId, setDescargandoId] = useState(null);
    const [eliminandoId, setEliminandoId] = useState(null);
    const [generadorAbierto, setGeneradorAbierto] = useState(false);
    const [templates, setTemplates] = useState(null);
    const [templateSeleccionado, setTemplateSeleccionado] = useState(null);
    const [generando, setGenerando] = useState(false);
    const [errorGenerador, setErrorGenerador] = useState(null);
    const inputArchivoRef = useRef(null);
    useEffect(() => {
        setDocumentos(null);
        setError(null);
        listarDocumentos({ expediente_id: expedienteId, cliente_id: clienteId })
            .then(setDocumentos)
            .catch((e) => setError(e.message));
    }, [expedienteId, clienteId]);
    function elegirArchivo(archivo) {
        setArchivoPendiente(archivo);
        setNotas('');
        setErrorSubida(null);
    }
    function cancelarPendiente() {
        setArchivoPendiente(null);
        setErrorSubida(null);
        if (inputArchivoRef.current)
            inputArchivoRef.current.value = '';
    }
    async function confirmarSubida() {
        if (!archivoPendiente)
            return;
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
            if (inputArchivoRef.current)
                inputArchivoRef.current.value = '';
        }
        catch (e) {
            setErrorSubida(e instanceof Error ? e.message : 'Error desconocido al archivar el documento.');
        }
        finally {
            setSubiendo(false);
        }
    }
    async function descargar(documento) {
        setDescargandoId(documento.id);
        try {
            const { url_descarga } = await pedirDescarga(documento.id);
            window.open(url_descarga, '_blank', 'noopener,noreferrer');
        }
        catch {
            setError(`No se pudo preparar la descarga de "${documento.nombre}".`);
        }
        finally {
            setDescargandoId(null);
        }
    }
    async function eliminar(documento) {
        if (!window.confirm(`¿Eliminar el documento "${documento.nombre}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        setEliminandoId(documento.id);
        try {
            await eliminarDocumento(documento.id);
            setDocumentos((actuales) => (actuales ?? []).filter((d) => d.id !== documento.id));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : `No se pudo eliminar el documento "${documento.nombre}".`);
        }
        finally {
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
            .catch((e) => setErrorGenerador(e.message));
    }
    async function generarDocumento() {
        if (!expedienteId || !templateSeleccionado)
            return;
        setGenerando(true);
        setErrorGenerador(null);
        try {
            await generadorApi.generarDocumento({
                template_id: templateSeleccionado,
                expediente_id: expedienteId,
            });
            const actualizados = await listarDocumentos({ expediente_id: expedienteId, cliente_id: clienteId });
            const nuevo = actualizados.find((d) => !documentos?.some((existente) => existente.id === d.id));
            setDocumentos(actualizados);
            if (nuevo)
                setUltimoIdAgregado(nuevo.id);
            setGeneradorAbierto(false);
        }
        catch (e) {
            setErrorGenerador(e instanceof Error ? e.message : 'Error desconocido al generar el documento.');
        }
        finally {
            setGenerando(false);
        }
    }
    return (_jsxs("section", { className: "mt-8", children: [_jsxs("div", { className: "flex items-baseline justify-between mb-3", children: [_jsx("h2", { className: "text-xs font-bold uppercase tracking-[0.2em] text-silver", children: "Documentos" }), _jsxs("div", { className: "flex items-center gap-3", children: [total > 0 && (_jsxs("span", { className: "text-xs text-text-gray-light font-mono", children: [total, " ", total === 1 ? 'ficha' : 'fichas'] })), expedienteId && (_jsx(Button, { onClick: abrirGenerador, variant: "outline", className: "rounded-sharp h-7 px-3 text-xs", children: "Generar documento" }))] })] }), expedienteId && (_jsx(Dialog, { open: generadorAbierto, onOpenChange: setGeneradorAbierto, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Generar documento" }) }), templates === null && !errorGenerador && (_jsx("p", { className: "text-sm text-text-gray-light", children: "Cargando templates\u2026" })), templates !== null && templates.length === 0 && (_jsx("p", { className: "text-sm text-text-gray-light italic", children: "No hay templates cargados todav\u00EDa." })), templates !== null && templates.length > 0 && (_jsxs(Select, { value: templateSeleccionado ?? undefined, onValueChange: (v) => setTemplateSeleccionado(v), children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Eleg\u00ED un template" }) }), _jsx(SelectContent, { children: templates.map((t) => (_jsx(SelectItem, { value: t.id, children: t.nombre }, t.id))) })] })), errorGenerador && _jsx(ErrorBanner, { message: errorGenerador }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: generarDocumento, disabled: !templateSeleccionado || generando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110", children: generando ? 'Generando…' : 'Generar' }) })] }) })), !archivoPendiente && (_jsxs("div", { onClick: () => !subiendo && inputArchivoRef.current?.click(), onDragOver: (e) => {
                    e.preventDefault();
                    if (!subiendo)
                        setArrastrando(true);
                }, onDragLeave: () => setArrastrando(false), onDrop: (e) => {
                    e.preventDefault();
                    setArrastrando(false);
                    const archivo = e.dataTransfer.files?.[0];
                    if (archivo && !subiendo)
                        elegirArchivo(archivo);
                }, className: `rounded-sharp border border-dashed px-4 py-6 text-center transition-colors ${subiendo ? 'cursor-default opacity-50' : 'cursor-pointer'} ${arrastrando ? 'border-silver bg-graphite' : 'border-line bg-graphite/60'}`, children: [_jsx("p", { className: "m-0 text-sm text-text-gray-light", children: "Arrastr\u00E1 un documento ac\u00E1, o hac\u00E9 clic para seleccionarlo" }), _jsx("input", { ref: inputArchivoRef, type: "file", onChange: (e) => {
                            const archivo = e.target.files?.[0];
                            if (archivo)
                                elegirArchivo(archivo);
                        }, className: "hidden" })] })), archivoPendiente && (_jsxs("div", { className: "superficie p-5", children: [_jsxs("div", { className: "flex justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-white break-all", children: archivoPendiente.name }), _jsx("div", { className: "text-xs text-text-gray-light font-mono mt-0.5", children: formatearTamano(archivoPendiente.size) })] }), !subiendo && (_jsx("button", { onClick: cancelarPendiente, className: "border-none bg-transparent text-text-gray-light text-xs cursor-pointer shrink-0 hover:text-white", children: "Cancelar" }))] }), !subiendo ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5", children: [_jsxs("label", { htmlFor: "doc-categoria", className: etiquetaClases, children: ["Categor\u00EDa", _jsx("select", { id: "doc-categoria", value: categoria, onChange: (e) => setCategoria(e.target.value), className: `${campoClases} block w-full mt-1 h-8 px-2.5 text-sm text-white outline-none border`, children: CATEGORIAS.map((c) => (_jsx("option", { value: c.valor, className: "bg-graphite text-white", children: c.etiqueta }, c.valor))) })] }), _jsxs("label", { htmlFor: "doc-notas", className: etiquetaClases, children: ["Notas (opcional)", _jsx(Input, { id: "doc-notas", type: "text", value: notas, onChange: (e) => setNotas(e.target.value), className: `${campoClases} block w-full mt-1` })] })] }), errorSubida && (_jsx("div", { className: "mt-3", children: _jsx(ErrorBanner, { message: errorSubida }) })), _jsx(Button, { onClick: confirmarSubida, className: "mt-3.5 rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver", children: "Archivar" })] })) : (_jsxs("div", { className: "mt-3.5", children: [_jsx("div", { className: "h-[3px] rounded-sharp bg-line overflow-hidden", children: _jsx("div", { className: "h-full bg-silver transition-[width] duration-150 ease-out", style: { width: `${Math.round(progreso * 100)}%` } }) }), _jsxs("div", { className: "text-xs text-text-gray-light font-mono mt-1.5", children: ["Archivando\u2026 ", Math.round(progreso * 100), "%"] })] }))] })), _jsxs("div", { className: "mt-4", children: [error && (_jsxs("p", { className: "text-sm text-warning", children: ["No se pudo cargar el listado: ", error] })), documentos === null && !error && (_jsx("p", { className: "text-sm text-text-gray-light", children: "Cargando\u2026" })), documentos !== null && documentos.length === 0 && (_jsxs("p", { className: "text-sm text-text-gray-light italic", children: ["Todav\u00EDa no se archiv\u00F3 ning\u00FAn documento ", expedienteId ? 'en este expediente' : 'de este cliente', "."] })), documentos !== null &&
                        documentos.map((doc, i) => (_jsx(FilaDocumento, { documento: doc, folio: documentos.length - i, esNueva: doc.id === ultimoIdAgregado, descargando: descargandoId === doc.id, onDescargar: () => descargar(doc), eliminando: eliminandoId === doc.id, onEliminar: () => eliminar(doc) }, doc.id)))] })] }));
}
function FilaDocumento({ documento, folio, esNueva, descargando, onDescargar, eliminando, onEliminar, }) {
    const [visible, setVisible] = useState(!esNueva);
    useEffect(() => {
        if (!esNueva)
            return;
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, [esNueva]);
    return (_jsxs("div", { className: "grid items-center gap-3 py-2.5 px-1 border-b border-line transition-[opacity,transform] duration-250 ease-out", style: {
            gridTemplateColumns: '44px 40px minmax(0, 1fr) auto auto auto',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(-4px)',
        }, children: [_jsxs("span", { className: "text-xs text-text-gray-light font-mono", children: ["N.\u00B0 ", String(folio).padStart(3, '0')] }), _jsx("span", { className: "text-[10px] font-mono font-semibold text-silver border border-silver rounded-sharp px-1.5 py-0.5 text-center", title: CATEGORIAS.find((c) => c.valor === documento.categoria)?.etiqueta, children: CODIGOS[documento.categoria] }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm text-white break-words", children: documento.nombre }), documento.notas && (_jsx("div", { className: "text-xs text-text-gray-light mt-0.5", children: documento.notas }))] }), _jsxs("span", { className: "text-xs text-text-gray-light font-mono whitespace-nowrap", children: [formatearTamano(documento.tamano_bytes), " \u00B7 ", formateadorFecha.format(new Date(documento.creado_en))] }), _jsx("button", { onClick: onDescargar, disabled: descargando, className: `border-none bg-transparent text-silver text-xs font-semibold whitespace-nowrap ${descargando ? 'cursor-default opacity-50' : 'cursor-pointer hover:brightness-125'}`, children: descargando ? 'Preparando…' : 'Descargar' }), _jsx("button", { onClick: onEliminar, disabled: eliminando, className: `border-none bg-transparent text-warning text-xs font-semibold whitespace-nowrap ${eliminando ? 'cursor-default opacity-50' : 'cursor-pointer hover:brightness-125'}`, children: eliminando ? 'Eliminando…' : 'Eliminar' })] }));
}
