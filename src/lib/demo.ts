/**
 * Modo demostración: el panel manda `X-Vindex-Demo: 1` y el servidor pasa la sesión al estudio ficticio. Se guarda en
 * sessionStorage a propósito: al cerrar la pestaña se sale solo y no se queda la demostración puesta por descuido.
 */
const CLAVE = 'vindex-demo';

export function demoActiva(): boolean {
  try {
    return sessionStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

export function entrarEnDemo(): void {
  try {
    sessionStorage.setItem(CLAVE, '1');
  } catch {
    // Sin almacenamiento no se puede entrar: el servidor seguiría con la sesión normal.
  }
  window.location.assign('/');
}

export function salirDeDemo(): void {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // Nada que limpiar.
  }
  window.location.assign('/');
}
