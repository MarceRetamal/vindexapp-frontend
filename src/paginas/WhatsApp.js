import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertTriangleIcon, ArrowLeftIcon, BotIcon, CheckCheckIcon, CheckIcon, ClockIcon, FileTextIcon, ImageIcon, LibraryIcon, MicIcon, PaperclipIcon, PencilIcon, PlusIcon, SearchIcon, SendIcon, Trash2Icon, UserPlusIcon, VideoIcon, XIcon, } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { api, apiPlantillas, CATEGORIAS_DOCUMENTO, CATEGORIAS_PLANTILLA, } from '../api/whatsapp';
import { api as apiClientes } from '../api/cliente';
import { api as apiExpedientes } from '../api/expedientes';
import { sesionActual } from '../api/whoami';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { completarPlantilla, nombreDePila, pendientes } from '../lib/plantillas';
const botonPrincipal = 'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-50';
const botonFantasma = 'rounded-sharp border border-white/10 bg-white/[0.03] text-silver hover:border-silver-deep hover:text-white';
const campo = 'h-9 w-full rounded-sharp border border-white/10 bg-black/30 px-2.5 text-[13px] text-white outline-none focus:border-silver-deep';
const REFRESCO_MS = 10_000;
const VENTANA_SEG = 24 * 3600;
const FILTROS = [
    { valor: 'todas', texto: 'Todas' },
    { valor: 'sin_leer', texto: 'Sin leer' },
    { valor: 'esperan', texto: 'Esperan respuesta' },
    { valor: 'urgentes', texto: 'Urgentes' },
    { valor: 'clientes', texto: 'Clientes' },
];
// ---------------------------------------------------------------------------------------------------------------
// Utilidades de presentación
// ---------------------------------------------------------------------------------------------------------------
function horaCorta(ts) {
    return new Date(ts * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
function cuandoLista(ts) {
    if (!ts)
        return '';
    const d = new Date(ts * 1000);
    const hoy = new Date();
    if (d.toDateString() === hoy.toDateString())
        return horaCorta(ts);
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === ayer.toDateString())
        return 'Ayer';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}
function etiquetaDia(ts) {
    const d = new Date(ts * 1000);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === hoy.toDateString())
        return 'Hoy';
    if (d.toDateString() === ayer.toDateString())
        return 'Ayer';
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function nombreDe(c) {
    if (c.cliente_apellido)
        return `${c.cliente_apellido}, ${c.cliente_nombre ?? ''}`.trim();
    return c.nombre_completo || c.nombre_perfil || `+${c.telefono}`;
}
function iniciales(texto) {
    const palabras = texto.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
    if (palabras.length === 0)
        return '#';
    return ((palabras[0]?.[0] ?? '') + (palabras.length > 1 ? (palabras[palabras.length - 1]?.[0] ?? '') : '')).toUpperCase();
}
function estadoDe(c) {
    if (c.es_propio)
        return { texto: 'Número del estudio', clase: 'text-text-gray-light', punto: 'bg-text-gray-light' };
    if (c.estado === 'humano')
        return { texto: 'La atendés vos', clase: 'text-silver', punto: 'bg-silver' };
    if (c.estado === 'derivado')
        return { texto: 'Espera respuesta', clase: 'text-warning', punto: 'bg-warning' };
    return { texto: 'Con el asistente', clase: 'text-silver-deep', punto: 'bg-silver-deep' };
}
function temaDe(c) {
    if (!c.area || c.area === 'Otro tema')
        return null;
    const area = c.area.charAt(0).toLowerCase() + c.area.slice(1);
    return c.subtema ? `${area} (${c.subtema.toLowerCase()})` : area;
}
function horasDeVentana(c) {
    if (!c.ultima_entrante_ts)
        return null;
    const resta = VENTANA_SEG - (Date.now() / 1000 - c.ultima_entrante_ts);
    return resta > 0 ? resta / 3600 : null;
}
function Avatar({ texto, chico }) {
    return (_jsx("span", { "aria-hidden": "true", className: `grid shrink-0 place-items-center rounded-full border border-silver/25 bg-gradient-to-br from-graphite-raised to-structural-black font-bold tracking-wide text-silver ${chico ? 'h-9 w-9 text-[11px]' : 'h-11 w-11 text-[13px]'}`, children: iniciales(texto) }));
}
function Chip({ activo, onClick, children }) {
    return (_jsx("button", { type: "button", onClick: onClick, "aria-pressed": activo, className: `h-7 shrink-0 rounded-full border px-3 text-[12px] transition-colors ${activo ? 'border-silver/60 bg-silver/15 text-white' : 'border-white/10 text-silver-deep hover:border-silver-deep hover:text-silver'}`, children: children }));
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
    const [lista, setLista] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('todas');
    const [error, setError] = useState(null);
    const [gestionar, setGestionar] = useState(false);
    const cargarLista = useCallback(() => {
        api
            .listar(busqueda.trim())
            .then((d) => {
            setLista(d.conversaciones);
            setError(null);
        })
            .catch((e) => setError(e.message));
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
    const abrir = (tel) => setParams(tel ? { tel } : {});
    return (_jsxs("div", { className: "fondo-vidrio rounded-lg border border-white/[0.04] p-4 sm:p-6", children: [_jsxs("header", { className: "mb-6 flex flex-wrap items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Hoy \u00B7 Canal directo" }), _jsx("h1", { className: "mt-1.5 text-[28px] font-black leading-tight tracking-tight text-white sm:text-[32px]", children: "WhatsApp" }), _jsx("p", { className: "mt-1 max-w-xl text-sm text-silver-deep", children: "Consultas y clientes del n\u00FAmero del estudio. El asistente toma los datos; cuando respond\u00E9s vos, se retira." })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(Indicador, { valor: cuentas.sin_leer, texto: "sin leer" }), _jsx(Indicador, { valor: cuentas.esperan, texto: "esperan respuesta", destacado: cuentas.esperan > 0 }), _jsx(Indicador, { valor: cuentas.urgentes, texto: "urgentes", destacado: cuentas.urgentes > 0 }), _jsxs(Button, { variant: "ghost", className: `${botonFantasma} h-9 px-3 text-xs`, onClick: () => setGestionar(true), children: [_jsx(LibraryIcon, { className: "mr-1.5 h-4 w-4", strokeWidth: 1.6, "aria-hidden": "true" }), "Respuestas predeterminadas"] })] })] }), error && _jsx(ErrorBanner, { message: error }), _jsxs("div", { className: "grid gap-4 lg:h-[calc(100vh-15rem)] lg:min-h-[560px] lg:grid-cols-[340px_minmax(0,1fr)]", children: [_jsxs("aside", { className: `${actual ? 'hidden lg:flex' : 'flex'} vidrio min-h-0 min-w-0 flex-col overflow-hidden`, "aria-label": "Conversaciones", children: [_jsxs("div", { className: "border-b border-white/[0.06] p-3", children: [_jsxs("div", { className: "flex h-10 items-center gap-2 rounded-sharp border border-white/10 bg-black/30 px-3 focus-within:border-silver-deep", children: [_jsx(SearchIcon, { className: "h-4 w-4 shrink-0 text-silver-deep", strokeWidth: 1.6, "aria-hidden": "true" }), _jsx("input", { type: "search", value: busqueda, onChange: (e) => setBusqueda(e.target.value), placeholder: "Nombre, cliente o tel\u00E9fono", "aria-label": "Buscar conversaci\u00F3n", className: "sin-contorno min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-text-gray-light" })] }), _jsx("div", { className: "-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1", children: FILTROS.map((f) => (_jsx(Chip, { activo: filtro === f.valor, onClick: () => setFiltro(f.valor), children: f.texto }, f.valor))) })] }), _jsx("div", { className: "min-h-0 flex-1 overflow-y-auto", children: lista === null ? (_jsx("p", { className: "p-4 text-sm text-text-gray-light", children: "Cargando\u2026" })) : visibles.length === 0 ? (_jsx("p", { className: "p-6 text-center text-sm text-text-gray-light", children: lista.length === 0 ? 'Todavía no hay conversaciones. Aparecen apenas alguien escribe al número del estudio.' : 'Ninguna conversación con este filtro.' })) : (_jsx("ul", { children: visibles.map((c) => (_jsx(FilaConversacion, { c: c, activa: actual === c.telefono, onAbrir: () => abrir(c.telefono) }, c.telefono))) })) })] }), _jsx("section", { className: `${actual ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-col`, "aria-label": "Conversaci\u00F3n", children: actual ? (_jsx(Chat, { telefono: actual, onVolver: () => abrir(null), onCambio: cargarLista, onGestionar: () => setGestionar(true) }, actual)) : (_jsx("div", { className: "vidrio grid flex-1 place-items-center p-10 text-center", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Bandeja" }), _jsx("p", { className: "mt-2 text-sm text-silver-deep", children: "Eleg\u00ED una conversaci\u00F3n para leerla y responder." })] }) })) })] }), _jsx(GestorPlantillas, { abierto: gestionar, onCerrar: () => setGestionar(false) })] }));
}
function Indicador({ valor, texto, destacado }) {
    return (_jsxs("span", { className: `vidrio-claro inline-flex h-9 items-center gap-1.5 px-3 text-xs ${destacado ? 'text-white' : 'text-silver-deep'}`, children: [_jsx("span", { className: `text-[15px] font-black tabular-nums ${destacado ? 'text-warning' : 'text-silver'}`, children: valor }), texto] }));
}
function FilaConversacion({ c, activa, onAbrir }) {
    const est = estadoDe(c);
    const nombre = nombreDe(c);
    return (_jsx("li", { children: _jsxs("button", { type: "button", onClick: onAbrir, "aria-current": activa, className: `flex w-full items-start gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${activa ? 'bg-silver/[0.08] shadow-[inset_2px_0_0_var(--color-silver)]' : ''}`, children: [_jsx(Avatar, { texto: nombre, chico: true }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-baseline justify-between gap-2", children: [_jsx("span", { className: `truncate text-sm ${c.no_leidos > 0 ? 'font-black text-white' : 'font-bold text-white/90'}`, children: nombre }), _jsx("span", { className: `shrink-0 text-[11px] tabular-nums ${c.no_leidos > 0 ? 'text-silver' : 'text-text-gray-light'}`, children: cuandoLista(c.ultimo_ts) })] }), _jsx("p", { className: "mt-0.5 truncate text-[13px] text-silver-deep", children: c.ultimo_texto }), _jsxs("div", { className: "mt-1.5 flex items-center justify-between gap-2 text-[11px]", children: [_jsxs("span", { className: `inline-flex items-center gap-1.5 ${est.clase}`, children: [_jsx("span", { className: `h-1.5 w-1.5 rounded-full ${est.punto}`, "aria-hidden": "true" }), est.texto, c.urgente ? _jsx("span", { className: "ml-1 rounded-sharp border border-warning/50 px-1 text-[10px] font-bold uppercase tracking-wider text-warning", children: "Urgente" }) : null] }), c.no_leidos > 0 && (_jsx("span", { className: "rounded-full bg-silver px-1.5 text-[11px] font-black text-structural-black", "aria-label": `${c.no_leidos} sin leer`, children: c.no_leidos }))] }), (c.area || c.expediente_caratula) && (_jsx("p", { className: "mt-1 truncate text-[11px] text-text-gray-light", children: c.expediente_caratula ?? c.area }))] })] }) }));
}
// ---------------------------------------------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------------------------------------------
function Chat({ telefono, onVolver, onCambio, onGestionar }) {
    const [conv, setConv] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [error, setError] = useState(null);
    const [ficha, setFicha] = useState(false);
    const fondo = useRef(null);
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
            .catch((e) => setError(e.message));
    }, [telefono]);
    useEffect(() => {
        cargar();
        const t = window.setInterval(cargar, REFRESCO_MS);
        return () => window.clearInterval(t);
    }, [cargar]);
    async function asistente(activo) {
        try {
            await api.asistente(telefono, activo);
            cargar();
            onCambio();
        }
        catch (err) {
            setError(err.message);
        }
    }
    const grupos = useMemo(() => {
        const salida = [];
        for (const m of mensajes) {
            const dia = etiquetaDia(m.ts);
            const ultimoGrupo = salida[salida.length - 1];
            if (ultimoGrupo?.dia === dia)
                ultimoGrupo.mensajes.push(m);
            else
                salida.push({ dia, mensajes: [m] });
        }
        return salida;
    }, [mensajes]);
    if (!conv)
        return _jsx("div", { className: "vidrio flex-1 p-6", children: error ? _jsx(ErrorBanner, { message: error }) : _jsx("p", { className: "text-sm text-text-gray-light", children: "Cargando\u2026" }) });
    const conAsistente = conv.estado !== 'humano' && conv.estado !== 'derivado';
    const est = estadoDe(conv);
    const horas = horasDeVentana(conv);
    const nombre = nombreDe(conv);
    const refrescar = () => {
        cargar();
        onCambio();
    };
    return (_jsxs("div", { className: `grid min-h-0 flex-1 gap-4 ${ficha ? 'xl:grid-cols-[minmax(0,1fr)_300px]' : ''} 2xl:grid-cols-[minmax(0,1fr)_320px]`, children: [_jsxs("div", { className: "vidrio flex min-h-[70vh] min-w-0 flex-col overflow-hidden lg:min-h-0", children: [_jsxs("header", { className: "flex items-center gap-3 border-b border-white/[0.06] px-4 py-3", children: [_jsx("button", { type: "button", onClick: onVolver, className: "text-silver-deep hover:text-white lg:hidden", "aria-label": "Volver a la lista", children: _jsx(ArrowLeftIcon, { className: "h-5 w-5", strokeWidth: 1.6 }) }), _jsx(Avatar, { texto: nombre }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-[15px] font-black text-white", children: nombre }), _jsxs("p", { className: "flex flex-wrap items-center gap-x-2 text-xs text-text-gray-light", children: [_jsxs("span", { className: "tabular-nums", children: ["+", conv.telefono] }), _jsxs("span", { className: `inline-flex items-center gap-1 ${est.clase}`, children: [_jsx("span", { className: `h-1.5 w-1.5 rounded-full ${est.punto}`, "aria-hidden": "true" }), est.texto] }), _jsx(Ventana, { horas: horas })] })] }), !conv.es_propio && (_jsxs(Button, { variant: "ghost", className: `${botonFantasma} h-8 px-2.5 text-xs`, onClick: () => void asistente(!conAsistente), title: conAsistente ? 'El asistente deja de responder en esta conversación' : 'El asistente vuelve a saludar en el próximo mensaje', children: [_jsx(BotIcon, { className: "h-4 w-4 sm:mr-1.5", strokeWidth: 1.6, "aria-hidden": "true" }), _jsx("span", { className: "hidden sm:inline", children: conAsistente ? 'Retirar asistente' : 'Reactivar asistente' })] })), _jsx(Button, { variant: "ghost", className: `${botonFantasma} h-8 px-2.5 text-xs 2xl:hidden ${ficha ? 'border-silver-deep text-white' : ''}`, onClick: () => setFicha((v) => !v), "aria-pressed": ficha, children: "Ficha" })] }), _jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6", children: [grupos.map((g) => (_jsxs("div", { children: [_jsx("div", { className: "my-4 flex justify-center", children: _jsx("span", { className: "vidrio-claro px-3 py-0.5 text-[11px] capitalize text-silver", children: g.dia }) }), _jsx("ul", { className: "flex flex-col gap-1.5", children: g.mensajes.map((m) => (_jsx(Burbuja, { m: m, conv: conv, onGuardado: cargar }, m.id))) })] }, g.dia))), _jsx("div", { ref: fondo })] }), error && (_jsx("div", { className: "px-4 pb-2", children: _jsx(ErrorBanner, { message: error }) })), _jsx(Compositor, { conv: conv, onEnviado: refrescar, onError: setError, onGestionar: onGestionar })] }), _jsx("div", { className: `${ficha ? 'block' : 'hidden'} min-h-0 overflow-y-auto 2xl:block`, children: _jsx(PanelFicha, { conv: conv, onCambio: refrescar }) })] }));
}
function Ventana({ horas }) {
    if (horas === null)
        return (_jsxs("span", { className: "inline-flex items-center gap-1 text-warning", title: "Pasaron m\u00E1s de 24 horas desde el \u00FAltimo mensaje de esta persona", children: [_jsx(ClockIcon, { className: "h-3 w-3", strokeWidth: 1.8, "aria-hidden": "true" }), "Ventana de 24 h cerrada"] }));
    const texto = horas >= 1 ? `${Math.floor(horas)} h` : `${Math.max(1, Math.round(horas * 60))} min`;
    return (_jsxs("span", { className: `inline-flex items-center gap-1 ${horas < 3 ? 'text-warning' : 'text-silver-deep'}`, title: "Tiempo que queda para responder con texto libre (WhatsApp lo permite hasta 24 horas despu\u00E9s del \u00FAltimo mensaje de la persona)", children: [_jsx(ClockIcon, { className: "h-3 w-3", strokeWidth: 1.8, "aria-hidden": "true" }), "Quedan ", texto, " para responder"] }));
}
function iconoAdjunto(m) {
    const t = m.tipo ?? '';
    if (t === 'image' || t === 'sticker')
        return ImageIcon;
    if (t === 'audio')
        return MicIcon;
    if (t === 'video')
        return VideoIcon;
    return FileTextIcon;
}
function EstadoEnvio({ estado }) {
    if (!estado)
        return null;
    if (estado.startsWith('error'))
        return _jsx(AlertTriangleIcon, { className: "h-3.5 w-3.5 text-warning", strokeWidth: 2, "aria-label": estado });
    if (estado === 'read')
        return _jsx(CheckCheckIcon, { className: "h-3.5 w-3.5 text-silver", strokeWidth: 2, "aria-label": "Le\u00EDdo" });
    if (estado === 'delivered')
        return _jsx(CheckCheckIcon, { className: "h-3.5 w-3.5 text-silver-deep", strokeWidth: 2, "aria-label": "Entregado" });
    return _jsx(CheckIcon, { className: "h-3.5 w-3.5 text-silver-deep", strokeWidth: 2, "aria-label": "Enviado" });
}
function Burbuja({ m, conv, onGuardado }) {
    const [imagen, setImagen] = useState(null);
    const [abriendo, setAbriendo] = useState(false);
    const [guardar, setGuardar] = useState(false);
    const [error, setError] = useState(null);
    const entrante = m.direccion === 'in';
    const auto = m.tipo === 'auto';
    const esImagen = (m.tipo === 'image' || m.tipo === 'sticker') && m.tiene_adjunto === 1;
    const fallo = m.estado?.startsWith('error');
    const Icono = iconoAdjunto(m);
    // Las imágenes se muestran en miniatura apenas se ve el mensaje (URL firmada de 5 minutos).
    useEffect(() => {
        if (!esImagen)
            return;
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
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setAbriendo(false);
        }
    }
    // El texto de un adjunto es "[imagen] leyenda": la etiqueta ya la dice el ícono.
    const leyenda = m.tiene_adjunto ? (m.texto ?? '').replace(/^\[[^\]]+\]\s*/, '') : m.texto;
    const texto = leyenda && leyenda !== m.media_nombre ? leyenda : null;
    return (_jsx("li", { className: `flex ${entrante ? 'justify-start' : 'justify-end'}`, children: _jsxs("div", { className: `max-w-[85%] px-3.5 py-2 sm:max-w-[70%] ${entrante
                ? 'rounded-[14px] rounded-tl-sm border border-white/[0.07] bg-graphite-raised/80'
                : auto
                    ? 'rounded-[14px] rounded-tr-sm border border-dashed border-silver/20 bg-white/[0.03]'
                    : 'rounded-[14px] rounded-tr-sm border border-silver/20 bg-gradient-to-br from-silver/[0.16] to-silver/[0.06]'} ${fallo ? 'border-warning/50' : ''}`, children: [auto && (_jsxs("p", { className: "mb-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-silver-deep", children: [_jsx(BotIcon, { className: "h-3 w-3", strokeWidth: 2, "aria-hidden": "true" }), "Asistente"] })), imagen && (_jsx("button", { type: "button", onClick: () => void ver(), className: "mb-1.5 block overflow-hidden rounded-md border border-white/10", children: _jsx("img", { src: imagen, alt: texto || 'Imagen recibida', className: "max-h-64 w-auto object-cover", loading: "lazy" }) })), m.tiene_adjunto === 1 && !imagen && (_jsxs("button", { type: "button", onClick: () => void ver(), disabled: abriendo, className: "mb-1 flex w-full items-center gap-2.5 rounded-md border border-white/10 bg-black/25 px-2.5 py-2 text-left hover:border-silver-deep", children: [_jsx(Icono, { className: "h-5 w-5 shrink-0 text-silver", strokeWidth: 1.5, "aria-hidden": "true" }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[13px] text-white", children: m.media_nombre ?? (m.tipo === 'audio' ? 'Audio' : m.tipo === 'video' ? 'Video' : 'Archivo') }), _jsx("span", { className: "text-[11px] text-text-gray-light", children: abriendo ? 'Abriendo…' : m.tamano_bytes ? `${Math.max(1, Math.round(m.tamano_bytes / 1024))} KB · abrir` : 'Abrir' })] })] })), texto && _jsx("p", { className: "whitespace-pre-wrap break-words text-[14px] leading-relaxed text-white", children: texto }), m.tiene_adjunto === 1 && (_jsx("div", { className: "mt-1.5", children: m.documento_id ? (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-silver", children: [_jsx(CheckIcon, { className: "h-3 w-3", strokeWidth: 2, "aria-hidden": "true" }), "Guardado en el legajo"] })) : (_jsxs("button", { type: "button", onClick: () => setGuardar((v) => !v), className: "inline-flex items-center gap-1 text-[11px] text-silver-deep underline-offset-2 hover:text-white hover:underline", children: [_jsx(PaperclipIcon, { className: "h-3 w-3", strokeWidth: 2, "aria-hidden": "true" }), "Guardar en el legajo"] })) })), guardar && !m.documento_id && (_jsx(GuardarDocumento, { m: m, conv: conv, onListo: () => {
                        setGuardar(false);
                        onGuardado();
                    } })), error && _jsx("p", { role: "alert", className: "mt-1 text-xs text-warning", children: error }), _jsxs("p", { className: "mt-1 flex items-center justify-end gap-1 text-[10px] tabular-nums text-text-gray-light", children: [horaCorta(m.ts), !entrante && _jsx(EstadoEnvio, { estado: m.estado })] }), fallo && _jsx("p", { className: "text-[11px] text-warning", children: m.estado?.replace(/^error:\s*/, 'No se entregó: ') })] }) }));
}
function GuardarDocumento({ m, conv, onListo }) {
    const [expedientes, setExpedientes] = useState([]);
    const [expediente, setExpediente] = useState(conv.expediente_id ?? '');
    const [categoria, setCategoria] = useState('otro');
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    useEffect(() => {
        if (conv.cliente_id)
            apiExpedientes.listarDeCliente(conv.cliente_id).then(setExpedientes).catch(() => setExpedientes([]));
    }, [conv.cliente_id]);
    if (!conv.cliente_id)
        return _jsx("p", { className: "mt-2 text-xs text-text-gray-light", children: "Primero vincul\u00E1 la conversaci\u00F3n con un cliente (en la ficha)." });
    async function confirmar() {
        setGuardando(true);
        setError(null);
        try {
            await api.guardarDocumento(m.id, expediente ? { expediente_id: expediente, categoria } : { cliente_id: conv.cliente_id, categoria });
            onListo();
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setGuardando(false);
        }
    }
    return (_jsxs("div", { className: "mt-2 flex flex-col gap-2 border-t border-white/10 pt-2", children: [_jsxs("select", { value: expediente, onChange: (e) => setExpediente(e.target.value), className: campo, "aria-label": "Expediente", children: [_jsx("option", { value: "", children: "Documentos del cliente (sin expediente)" }), expedientes.map((x) => (_jsx("option", { value: x.id, children: x.caratula }, x.id)))] }), _jsx("select", { value: categoria, onChange: (e) => setCategoria(e.target.value), className: campo, "aria-label": "Categor\u00EDa", children: CATEGORIAS_DOCUMENTO.map((c) => (_jsx("option", { value: c.valor, children: c.texto }, c.valor))) }), _jsx(Button, { className: `${botonPrincipal} h-8`, onClick: () => void confirmar(), disabled: guardando, children: guardando ? 'Guardando…' : 'Guardar' }), error && _jsx("p", { role: "alert", className: "text-xs text-warning", children: error })] }));
}
// ---------------------------------------------------------------------------------------------------------------
// Compositor con respuestas predeterminadas
// ---------------------------------------------------------------------------------------------------------------
function Compositor({ conv, onEnviado, onError, onGestionar }) {
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [paleta, setPaleta] = useState(false);
    const [usada, setUsada] = useState(null);
    const area = useRef(null);
    const faltan = pendientes(texto);
    const cerrada = horasDeVentana(conv) === null;
    function elegir(p) {
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
            if (!el)
                return;
            el.focus();
            const i = completo.indexOf('[');
            const f = i >= 0 ? completo.indexOf(']', i) : -1;
            if (i >= 0 && f > i)
                el.setSelectionRange(i, f + 1);
            else
                el.setSelectionRange(completo.length, completo.length);
        });
    }
    function siguientePendiente() {
        const el = area.current;
        if (!el)
            return;
        const desde = el.selectionEnd ?? 0;
        let i = texto.indexOf('[', desde);
        if (i < 0)
            i = texto.indexOf('[');
        const f = i >= 0 ? texto.indexOf(']', i) : -1;
        if (i >= 0 && f > i) {
            el.focus();
            el.setSelectionRange(i, f + 1);
        }
    }
    async function enviar(e) {
        e.preventDefault();
        if (!texto.trim() || faltan.length > 0)
            return;
        setEnviando(true);
        try {
            await api.responder(conv.telefono, texto.trim());
            if (usada)
                apiPlantillas.usar(usada).catch(() => undefined);
            setTexto('');
            setUsada(null);
            onError(null);
            onEnviado();
        }
        catch (err) {
            onError(err.message);
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsxs("div", { className: "relative border-t border-white/[0.06] p-3", children: [paleta && _jsx(PaletaRespuestas, { onElegir: elegir, onCerrar: () => setPaleta(false), onGestionar: onGestionar }), cerrada && (_jsxs("p", { className: "mb-2 flex items-start gap-1.5 text-xs text-warning", children: [_jsx(ClockIcon, { className: "mt-0.5 h-3.5 w-3.5 shrink-0", strokeWidth: 1.8, "aria-hidden": "true" }), "Pasaron m\u00E1s de 24 horas desde el \u00FAltimo mensaje de esta persona: WhatsApp no deja escribirle texto libre hasta que vuelva a escribir."] })), faltan.length > 0 && (_jsxs("div", { className: "mb-2 flex flex-wrap items-center gap-1.5", children: [_jsx("span", { className: "text-[11px] text-silver-deep", children: "Complet\u00E1 antes de enviar:" }), faltan.map((f) => (_jsx("button", { type: "button", onClick: siguientePendiente, className: "rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] text-warning hover:bg-warning/20", children: f }, f)))] })), _jsxs("form", { onSubmit: (e) => void enviar(e), className: "flex items-end gap-2", children: [_jsx(Button, { type: "button", variant: "ghost", className: `${botonFantasma} h-11 w-11 shrink-0 p-0`, onClick: () => setPaleta((v) => !v), "aria-label": "Respuestas predeterminadas", "aria-expanded": paleta, title: "Respuestas predeterminadas (o escrib\u00ED / al principio)", children: _jsx(LibraryIcon, { className: "h-[18px] w-[18px]", strokeWidth: 1.6 }) }), _jsx("textarea", { ref: area, value: texto, onChange: (e) => {
                            const v = e.target.value;
                            if (v === '/') {
                                setPaleta(true);
                                setTexto('');
                                return;
                            }
                            setTexto(v);
                            if (!v)
                                setUsada(null);
                        }, onKeyDown: (e) => {
                            if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 760) {
                                e.preventDefault();
                                e.currentTarget.form?.requestSubmit();
                            }
                            if (e.key === 'Tab' && faltan.length > 0) {
                                e.preventDefault();
                                siguientePendiente();
                            }
                        }, rows: Math.min(8, Math.max(2, texto.split('\n').length)), maxLength: 4096, placeholder: "Escrib\u00ED tu respuesta, o / para usar una respuesta predeterminada", "aria-label": "Respuesta", className: "min-h-[44px] flex-1 resize-none rounded-[12px] border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-text-gray-light focus:border-silver-deep" }), _jsx(Button, { type: "submit", className: `${botonPrincipal} h-11 w-11 shrink-0 p-0`, disabled: enviando || !texto.trim() || faltan.length > 0, "aria-label": "Enviar", children: _jsx(SendIcon, { className: "h-4 w-4", strokeWidth: 1.8 }) })] })] }));
}
function PaletaRespuestas({ onElegir, onCerrar, onGestionar }) {
    const [plantillas, setPlantillas] = useState(null);
    const [categoria, setCategoria] = useState('todas');
    const [q, setQ] = useState('');
    const [error, setError] = useState(null);
    useEffect(() => {
        apiPlantillas
            .listar()
            .then((d) => setPlantillas(d.plantillas))
            .catch((e) => setError(e.message));
    }, []);
    useEffect(() => {
        const cerrar = (e) => e.key === 'Escape' && onCerrar();
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
    return (_jsxs("div", { className: "vidrio absolute bottom-full left-3 right-3 z-20 mb-2 flex max-h-[60vh] flex-col overflow-hidden !bg-graphite/95", role: "dialog", "aria-label": "Respuestas predeterminadas", children: [_jsxs("div", { className: "flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5", children: [_jsx(SearchIcon, { className: "h-4 w-4 text-silver-deep", strokeWidth: 1.6, "aria-hidden": "true" }), _jsx("input", { autoFocus: true, value: q, onChange: (e) => setQ(e.target.value), placeholder: "Buscar respuesta", "aria-label": "Buscar respuesta", className: "sin-contorno min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-text-gray-light", onKeyDown: (e) => {
                            if (e.key === 'Enter' && filtradas[0]) {
                                e.preventDefault();
                                onElegir(filtradas[0]);
                            }
                        } }), _jsx("button", { type: "button", onClick: onGestionar, className: "text-[12px] text-silver-deep hover:text-white", children: "Administrar" }), _jsx("button", { type: "button", onClick: onCerrar, "aria-label": "Cerrar", className: "text-silver-deep hover:text-white", children: _jsx(XIcon, { className: "h-4 w-4", strokeWidth: 1.8 }) })] }), _jsxs("div", { className: "flex gap-1.5 overflow-x-auto border-b border-white/[0.06] px-3 py-2", children: [_jsx(Chip, { activo: categoria === 'todas', onClick: () => setCategoria('todas'), children: "Todas" }), CATEGORIAS_PLANTILLA.filter((c) => presentes.has(c.valor)).map((c) => (_jsx(Chip, { activo: categoria === c.valor, onClick: () => setCategoria(c.valor), children: c.texto }, c.valor)))] }), _jsxs("ul", { className: "min-h-0 flex-1 overflow-y-auto p-1.5", children: [error && _jsx("li", { className: "p-3 text-sm text-warning", children: error }), plantillas === null && !error && _jsx("li", { className: "p-3 text-sm text-text-gray-light", children: "Cargando\u2026" }), plantillas !== null && filtradas.length === 0 && _jsx("li", { className: "p-3 text-sm text-text-gray-light", children: "No hay respuestas con ese criterio." }), filtradas.map((p) => (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => onElegir(p), className: "w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06]", children: [_jsxs("span", { className: "flex items-baseline justify-between gap-2", children: [_jsx("span", { className: "text-[13px] font-bold text-white", children: p.titulo }), _jsx("span", { className: "text-[10px] uppercase tracking-[0.12em] text-silver-deep", children: CATEGORIAS_PLANTILLA.find((c) => c.valor === p.categoria)?.texto })] }), _jsx("span", { className: "mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-silver-deep", children: p.texto })] }) }, p.id)))] })] }));
}
// ---------------------------------------------------------------------------------------------------------------
// Administración de respuestas predeterminadas
// ---------------------------------------------------------------------------------------------------------------
const VACIA = { titulo: '', categoria: 'otra', texto: '' };
function GestorPlantillas({ abierto, onCerrar }) {
    const [plantillas, setPlantillas] = useState([]);
    const [editando, setEditando] = useState(null);
    const [datos, setDatos] = useState(VACIA);
    const [error, setError] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const cargar = useCallback(() => {
        apiPlantillas
            .listar()
            .then((d) => setPlantillas(d.plantillas))
            .catch((e) => setError(e.message));
    }, []);
    useEffect(() => {
        if (abierto)
            cargar();
        else {
            setEditando(null);
            setError(null);
        }
    }, [abierto, cargar]);
    function editar(p) {
        setEditando(p ? p.id : 'nueva');
        setDatos(p ? { titulo: p.titulo, categoria: p.categoria, texto: p.texto } : VACIA);
        setError(null);
    }
    async function guardar(e) {
        e.preventDefault();
        setGuardando(true);
        setError(null);
        try {
            if (editando === 'nueva')
                await apiPlantillas.crear(datos);
            else if (editando)
                await apiPlantillas.editar(editando, datos);
            setEditando(null);
            cargar();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setGuardando(false);
        }
    }
    async function borrar(p) {
        if (!window.confirm(`¿Borrar la respuesta "${p.titulo}"?`))
            return;
        try {
            await apiPlantillas.borrar(p.id);
            cargar();
        }
        catch (err) {
            setError(err.message);
        }
    }
    const porCategoria = CATEGORIAS_PLANTILLA.map((c) => ({ ...c, items: plantillas.filter((p) => p.categoria === c.valor) })).filter((g) => g.items.length > 0);
    return (_jsx(Dialog, { open: abierto, onOpenChange: (o) => !o && onCerrar(), children: _jsxs(DialogContent, { className: "vidrio max-h-[88vh] overflow-y-auto border-white/10 bg-graphite/90 sm:max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx("p", { className: "eyebrow", children: "WhatsApp" }), _jsx(DialogTitle, { className: "text-xl font-black text-white", children: "Respuestas predeterminadas" }), _jsxs("p", { className: "text-[13px] leading-relaxed text-silver-deep", children: [_jsx("span", { className: "text-silver", children: '{nombre}' }), ", ", _jsx("span", { className: "text-silver", children: '{tema}' }), " y ", _jsx("span", { className: "text-silver", children: '{abogado}' }), " se completan solos. Lo que va entre corchetes, como ", _jsx("span", { className: "text-silver", children: "[monto]" }), " o ", _jsx("span", { className: "text-silver", children: "[fecha]" }), ", lo complet\u00E1s antes de enviar: el sistema no deja mandar el mensaje con corchetes pendientes."] })] }), error && _jsx(ErrorBanner, { message: error }), editando ? (_jsxs("form", { onSubmit: (e) => void guardar(e), className: "flex flex-col gap-3", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-[1fr_180px]", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs text-silver-deep", children: ["T\u00EDtulo", _jsx("input", { className: campo, value: datos.titulo, onChange: (e) => setDatos({ ...datos, titulo: e.target.value }), maxLength: 80, required: true })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs text-silver-deep", children: ["Categor\u00EDa", _jsx("select", { className: campo, value: datos.categoria, onChange: (e) => setDatos({ ...datos, categoria: e.target.value }), children: CATEGORIAS_PLANTILLA.map((c) => (_jsx("option", { value: c.valor, children: c.texto }, c.valor))) })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs text-silver-deep", children: ["Texto", _jsx("textarea", { className: "min-h-[180px] w-full resize-y rounded-sharp border border-white/10 bg-black/30 px-3 py-2 text-sm leading-relaxed text-white outline-none focus:border-silver-deep", value: datos.texto, onChange: (e) => setDatos({ ...datos, texto: e.target.value }), maxLength: 4000, required: true })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "submit", className: `${botonPrincipal} h-9 px-4`, disabled: guardando, children: guardando ? 'Guardando…' : 'Guardar' }), _jsx(Button, { type: "button", variant: "ghost", className: `${botonFantasma} h-9 px-4`, onClick: () => setEditando(null), disabled: guardando, children: "Cancelar" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex justify-end", children: _jsxs(Button, { className: `${botonPrincipal} h-9 px-4`, onClick: () => editar(null), children: [_jsx(PlusIcon, { className: "mr-1.5 h-4 w-4", strokeWidth: 2, "aria-hidden": "true" }), "Nueva respuesta"] }) }), porCategoria.length === 0 && _jsx("p", { className: "py-6 text-center text-sm text-text-gray-light", children: "No hay respuestas cargadas." }), porCategoria.map((g) => (_jsxs("section", { children: [_jsx("p", { className: "eyebrow mb-2", children: g.texto }), _jsx("ul", { className: "flex flex-col gap-2", children: g.items.map((p) => (_jsxs("li", { className: "vidrio-claro flex items-start gap-3 p-3", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("p", { className: "text-[13px] font-bold text-white", children: [p.titulo, p.usos > 0 && _jsxs("span", { className: "ml-2 text-[11px] font-normal text-text-gray-light", children: ["usada ", p.usos, " ", p.usos === 1 ? 'vez' : 'veces'] })] }), _jsx("p", { className: "mt-1 line-clamp-3 whitespace-pre-wrap text-[12px] leading-relaxed text-silver-deep", children: p.texto })] }), _jsx("button", { type: "button", onClick: () => editar(p), className: "text-silver-deep hover:text-white", "aria-label": `Editar ${p.titulo}`, children: _jsx(PencilIcon, { className: "h-4 w-4", strokeWidth: 1.6 }) }), _jsx("button", { type: "button", onClick: () => void borrar(p), className: "text-silver-deep hover:text-warning", "aria-label": `Borrar ${p.titulo}`, children: _jsx(Trash2Icon, { className: "h-4 w-4", strokeWidth: 1.6 }) })] }, p.id))) })] }, g.valor)))] }))] }) }));
}
// ---------------------------------------------------------------------------------------------------------------
// Ficha
// ---------------------------------------------------------------------------------------------------------------
function DatoFicha({ etiqueta, valor }) {
    if (!valor)
        return null;
    return (_jsxs("div", { className: "py-1.5", children: [_jsx("dt", { className: "text-[10px] uppercase tracking-[0.14em] text-text-gray-light", children: etiqueta }), _jsx("dd", { className: "mt-0.5 text-[13px] text-white", children: valor })] }));
}
function PanelFicha({ conv, onCambio }) {
    const [clientes, setClientes] = useState(null);
    const [expedientes, setExpedientes] = useState([]);
    const [error, setError] = useState(null);
    const [ocupado, setOcupado] = useState(false);
    useEffect(() => {
        apiClientes.listarClientes().then(setClientes).catch(() => setClientes([]));
    }, []);
    useEffect(() => {
        if (conv.cliente_id)
            apiExpedientes.listarDeCliente(conv.cliente_id).then(setExpedientes).catch(() => setExpedientes([]));
        else
            setExpedientes([]);
    }, [conv.cliente_id]);
    const ordenados = useMemo(() => (clientes ?? []).slice().sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es')), [clientes]);
    async function hacer(f) {
        setOcupado(true);
        setError(null);
        try {
            await f();
            onCambio();
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setOcupado(false);
        }
    }
    let respuestas = [];
    try {
        respuestas = JSON.parse(conv.respuestas ?? '[]');
    }
    catch {
        respuestas = [];
    }
    const c = conv;
    return (_jsxs("aside", { className: "flex flex-col gap-4", "aria-label": "Ficha y v\u00EDnculos", children: [_jsxs("section", { className: "vidrio p-4", children: [_jsx("p", { className: "eyebrow", children: "Legajo" }), _jsxs("div", { className: "mt-3 flex flex-col gap-2", children: [_jsxs("select", { value: conv.cliente_id ?? '', disabled: ocupado || clientes === null, onChange: (e) => void hacer(() => api.vincular(conv.telefono, { cliente_id: e.target.value || null })), className: campo, "aria-label": "Cliente", children: [_jsx("option", { value: "", children: "Sin cliente vinculado" }), ordenados.map((cl) => (_jsxs("option", { value: cl.id, children: [cl.apellido, ", ", cl.nombre] }, cl.id)))] }), conv.cliente_id ? (_jsxs(_Fragment, { children: [_jsxs("select", { value: conv.expediente_id ?? '', disabled: ocupado, onChange: (e) => void hacer(() => api.vincular(conv.telefono, { expediente_id: e.target.value || null })), className: campo, "aria-label": "Expediente", children: [_jsx("option", { value: "", children: "Sin expediente" }), expedientes.map((x) => (_jsx("option", { value: x.id, children: x.caratula }, x.id)))] }), _jsxs("div", { className: "flex flex-wrap gap-3 text-xs", children: [_jsx(Link, { to: `/clientes/${conv.cliente_id}`, className: "text-silver underline-offset-2 hover:underline", children: "Abrir cliente" }), conv.expediente_id && (_jsx(Link, { to: `/expedientes/${conv.expediente_id}`, className: "text-silver underline-offset-2 hover:underline", children: "Abrir expediente" }))] })] })) : (!conv.es_propio && (_jsxs(Button, { variant: "ghost", className: `${botonFantasma} h-9 text-xs`, disabled: ocupado, onClick: () => void hacer(() => api.crearCliente(conv.telefono)), children: [_jsx(UserPlusIcon, { className: "mr-1.5 h-4 w-4", strokeWidth: 1.6, "aria-hidden": "true" }), "Crear cliente con estos datos"] }))), error && _jsx("p", { role: "alert", className: "text-xs text-warning", children: error })] })] }), (conv.ficha || conv.relato) && (_jsxs("section", { className: "vidrio p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "eyebrow", children: "Ficha del asistente" }), conv.urgente ? _jsx("span", { className: "rounded-sharp border border-warning/50 px-1.5 text-[10px] font-bold uppercase tracking-wider text-warning", children: "Urgente" }) : null] }), _jsxs("dl", { className: "mt-2 divide-y divide-white/[0.05]", children: [_jsx(DatoFicha, { etiqueta: "Nombre", valor: c.nombre_completo }), _jsx(DatoFicha, { etiqueta: "DNI", valor: c.dni }), _jsx(DatoFicha, { etiqueta: "Localidad", valor: c.localidad }), _jsx(DatoFicha, { etiqueta: "Email", valor: c.email }), _jsx(DatoFicha, { etiqueta: "Motivo", valor: c.motivo_cliente }), _jsx(DatoFicha, { etiqueta: "Tema", valor: conv.area ? conv.area + (conv.subtema ? ` · ${conv.subtema}` : '') : null }), respuestas.map((r) => (_jsx(DatoFicha, { etiqueta: r.p, valor: r.r }, r.p))), _jsx(DatoFicha, { etiqueta: "Causa iniciada", valor: c.causa }), _jsx(DatoFicha, { etiqueta: "Lugar en la causa", valor: c.causa_rol }), _jsx(DatoFicha, { etiqueta: "Juzgado", valor: c.juzgado }), _jsx(DatoFicha, { etiqueta: "Expediente", valor: c.expediente_texto }), _jsx(DatoFicha, { etiqueta: "Abogado actual", valor: c.abogado_actual }), _jsx(DatoFicha, { etiqueta: "Audiencia o plazo", valor: c.vencimiento })] }), conv.relato && (_jsxs("div", { className: "mt-3 border-t border-white/[0.06] pt-3", children: [_jsx("p", { className: "text-[10px] uppercase tracking-[0.14em] text-text-gray-light", children: "Relato" }), _jsx("p", { className: "mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-silver", children: conv.relato })] }))] }))] }));
}
