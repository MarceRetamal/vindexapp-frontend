import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { MenuIcon, PlayIcon, SearchIcon, XIcon } from 'lucide-react';
import { api as demoApi } from '../api/demo';
import { api as novedadesApi, EVENTO_NOVEDADES } from '../api/novedades';
import { sesionActual } from '../api/whoami';
import { entrarEnDemo } from '../lib/demo';
import { iniciales } from '../lib/fechas';
import { EVENTO_PALETA, GRUPOS, SECCIONES } from '../navegacion';
import { BannerDemo } from './BannerDemo';
import { ErrorBoundary } from './ErrorBoundary';
import { Isotipo, Wordmark } from './Marca';
import { PaletaComandos } from './PaletaComandos';
const abrirPaleta = () => window.dispatchEvent(new Event(EVENTO_PALETA));
const ATAJO = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
export function Layout() {
    const location = useLocation();
    const shouldReduceMotion = useReducedMotion();
    const [novedadesPendientes, setNovedadesPendientes] = useState(0);
    const [menuAbierto, setMenuAbierto] = useState(false);
    // En el celular el menú es un panel que se abre y se cierra: al elegir una sección se cierra solo.
    useEffect(() => {
        setMenuAbierto(false);
    }, [location.pathname]);
    // Con el panel abierto: Escape lo cierra y la página de atrás no se desplaza.
    useEffect(() => {
        if (!menuAbierto)
            return;
        const alTeclear = (e) => {
            if (e.key === 'Escape')
                setMenuAbierto(false);
        };
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', alTeclear);
        return () => {
            document.body.style.overflow = overflowAnterior;
            window.removeEventListener('keydown', alTeclear);
        };
    }, [menuAbierto]);
    // La cantidad de novedades pendientes se refresca al cambiar de pantalla y cuando la bandeja avisa un cambio.
    useEffect(() => {
        let vigente = true;
        const refrescar = () => {
            novedadesApi
                .obtenerResumen()
                .then((r) => {
                if (vigente)
                    setNovedadesPendientes(r.pendientes);
            })
                .catch(() => {
                // Si falla, el menú queda sin indicador: no es motivo para molestar al usuario.
            });
        };
        refrescar();
        window.addEventListener(EVENTO_NOVEDADES, refrescar);
        return () => {
            vigente = false;
            window.removeEventListener(EVENTO_NOVEDADES, refrescar);
        };
    }, [location.pathname]);
    const { usuario, estudio, demo } = sesionActual();
    const [estadoDemo, setEstadoDemo] = useState(null);
    const [preparandoDemo, setPreparandoDemo] = useState(false);
    const [errorDemo, setErrorDemo] = useState(null);
    // Si el usuario puede mostrar la demostración, el menú ofrece el acceso. Si falla, simplemente no se ofrece.
    useEffect(() => {
        demoApi.estado().then(setEstadoDemo).catch(() => setEstadoDemo(null));
    }, []);
    async function abrirDemostracion() {
        if (estadoDemo?.existe)
            return entrarEnDemo();
        setPreparandoDemo(true);
        setErrorDemo(null);
        try {
            await demoApi.restablecer();
            entrarEnDemo();
        }
        catch (e) {
            setErrorDemo(e instanceof Error ? e.message : 'No se pudo preparar la demostración.');
            setPreparandoDemo(false);
        }
    }
    const menu = (_jsxs(_Fragment, { children: [_jsx("div", { className: "px-6 pt-8 pb-6 max-md:pt-6 max-md:pb-4", children: _jsxs("div", { className: "flex items-center gap-3.5", children: [_jsx(Isotipo, { tamano: 44 }), _jsx(Wordmark, {})] }) }), _jsx("div", { className: "px-3 pb-5", children: _jsxs("button", { type: "button", onClick: abrirPaleta, className: "superficie flex w-full items-center gap-3 px-3 py-2.5 text-sm text-text-gray-light transition-colors hover:border-silver-deep hover:text-silver", children: [_jsx(SearchIcon, { className: "h-[18px] w-[18px]", strokeWidth: 1.6 }), "Buscar", _jsx("kbd", { className: "ml-auto rounded-sm border border-line px-1.5 py-0.5 font-sans text-[10px] text-silver-deep max-md:hidden", children: ATAJO })] }) }), _jsx("nav", { className: "flex flex-1 flex-col gap-5 pb-4", "aria-label": "Secciones", children: GRUPOS.map((grupo) => (_jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsx("div", { className: "eyebrow px-6 pb-1.5 text-[10px] text-text-gray-light", children: grupo }), SECCIONES.filter((s) => s.grupo === grupo).map((s) => {
                            const Icono = s.icono;
                            return (_jsx(NavLink, { to: s.ruta, end: s.ruta === '/', className: ({ isActive }) => `group relative mx-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors max-md:py-3 ${isActive ? 'bg-graphite-raised font-bold text-white' : 'font-normal text-silver hover:bg-white/[0.03] hover:text-white'}`, children: ({ isActive }) => (_jsxs(_Fragment, { children: [isActive && _jsx("span", { className: "absolute -left-3 bottom-2 top-2 w-[3px] rounded-r bg-gradient-to-b from-silver via-silver-deep to-silver" }), _jsx(Icono, { className: `h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-silver' : 'text-silver-deep group-hover:text-silver'}`, strokeWidth: 1.6 }), s.etiqueta, s.ruta === '/novedades' && novedadesPendientes > 0 && (_jsx("span", { className: "ml-auto min-w-5 rounded-full border border-warning/70 bg-warning/10 px-1.5 text-center font-mono text-[11px] leading-5 text-warning", "aria-label": `${novedadesPendientes} novedades pendientes`, children: novedadesPendientes }))] })) }, s.ruta));
                        })] }, grupo))) }), usuario && (_jsxs("div", { className: "border-t border-line", children: [!demo && estadoDemo?.puede_gestionar && (_jsxs("div", { className: "px-3 pt-4", children: [_jsxs("button", { type: "button", onClick: abrirDemostracion, disabled: preparandoDemo, className: "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] text-silver-deep transition-colors hover:bg-white/[0.03] hover:text-white disabled:opacity-60", children: [_jsx(PlayIcon, { className: "h-[18px] w-[18px] shrink-0", strokeWidth: 1.6 }), preparandoDemo ? 'Preparando la demostración…' : estadoDemo.existe ? 'Ver la demostración' : 'Preparar la demostración'] }), errorDemo && _jsx("p", { className: "px-3 pt-1 text-[11px] text-warning", children: errorDemo })] })), _jsxs("div", { className: "flex items-center gap-3 px-6 py-5", children: [_jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-silver-deep/60 bg-graphite text-xs font-bold tracking-wider text-silver", "aria-hidden": "true", children: iniciales(usuario.nombre, usuario.apellido) }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "truncate text-[13px] font-bold text-white", children: [usuario.nombre, " ", usuario.apellido] }), _jsx("div", { className: `truncate text-[11px] ${demo ? 'font-bold text-silver' : 'text-text-gray-light'}`, children: estudio?.nombre ?? 'Estudio jurídico' })] })] })] }))] }));
    return (_jsxs("div", { className: "flex min-h-screen bg-structural-black", children: [_jsx("aside", { className: "hidden md:flex w-[248px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-line bg-structural-black flex-col", children: menu }), _jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [demo && _jsx(BannerDemo, {}), _jsxs("header", { className: "md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-structural-black px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Isotipo, { tamano: 32 }), _jsx(Wordmark, { className: "scale-90 origin-left" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: abrirPaleta, "aria-label": "Buscar", className: "flex h-11 w-11 items-center justify-center rounded-sharp border border-line text-silver hover:text-white", children: _jsx(SearchIcon, { className: "h-5 w-5" }) }), _jsx("button", { type: "button", onClick: () => setMenuAbierto(true), "aria-label": "Abrir el men\u00FA", "aria-expanded": menuAbierto, className: "flex h-11 w-11 items-center justify-center rounded-sharp border border-line text-silver hover:text-white", children: _jsx(MenuIcon, { className: "h-5 w-5" }) })] })] }), _jsx("main", { className: `flex-1 min-w-0 w-full ${location.pathname === '/whatsapp' ? 'max-w-none' : 'max-w-[1180px]'} px-4 py-6 sm:px-6 md:px-12 md:py-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]`, children: _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: shouldReduceMotion ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: shouldReduceMotion ? undefined : { opacity: 0, y: -8 }, transition: { duration: shouldReduceMotion ? 0 : 0.18 }, children: _jsx(ErrorBoundary, { resetKey: location.pathname, children: _jsx(Outlet, {}) }) }, location.pathname) }) })] }), _jsx(PaletaComandos, {}), menuAbierto && (_jsxs("div", { className: "md:hidden fixed inset-0 z-40", children: [_jsx("button", { type: "button", "aria-label": "Cerrar el men\u00FA", onClick: () => setMenuAbierto(false), className: "absolute inset-0 bg-black/70" }), _jsxs("aside", { role: "dialog", "aria-modal": "true", "aria-label": "Men\u00FA", className: "absolute left-0 top-0 bottom-0 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto border-r border-line bg-structural-black pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]", children: [_jsx("button", { type: "button", onClick: () => setMenuAbierto(false), "aria-label": "Cerrar el men\u00FA", className: "absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-sharp border border-line text-silver hover:text-white", children: _jsx(XIcon, { className: "h-5 w-5" }) }), menu] })] }))] }));
}
