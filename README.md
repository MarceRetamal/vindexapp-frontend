# vindexapp-frontend

Panel de gestión de VINDEX LEGAL (React, Vite, react-router y Tailwind). Se sirve como sitio estático desde un Worker de Cloudflare y habla con `vindexapp-api` en el mismo dominio (`https://panel.vindexlegal.com.ar`).

## Desarrollo

- `npm ci` instala las dependencias.
- `npm run dev` levanta el panel en `http://localhost:5173` (usa `VITE_API_URL`, por defecto `http://localhost:8787`).
- `npm run build` verifica los tipos y genera `dist/`.

## Despliegue

El Worker `vindexapp-frontend` está conectado a este repositorio con Workers Builds: cada cambio que llega a la rama `main` se compila (`npm run build`) y se despliega solo (`npx wrangler deploy`). No hace falta correr nada a mano.

El resultado se ve en Cloudflare, en Workers y Pages, `vindexapp-frontend`, pestaña Deployments. Si después de un despliegue el navegador sigue mostrando la versión anterior, recargar con Ctrl + F5.

`npm run deploy` queda como alternativa manual (requiere `npx wrangler login`).
