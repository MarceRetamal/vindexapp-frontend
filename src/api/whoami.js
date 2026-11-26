import { pedido } from './http';
export function whoami() {
    return pedido('/whoami');
}
// Se completa en el arranque (main.tsx), junto con el estudio: la sesión ya está resuelta cuando se dibuja el panel.
let usuarioActual = null;
let estudioActual = null;
let enDemostracion = false;
export function setSesion(usuario, estudio, demo = false) {
    usuarioActual = usuario;
    estudioActual = estudio;
    enDemostracion = demo;
}
export function sesionActual() {
    return { usuario: usuarioActual, estudio: estudioActual, demo: enDemostracion };
}
