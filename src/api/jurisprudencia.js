import { pedido } from './http';
export const api = {
    buscar: (q, jurisdiccion, pagina) => pedido(`/jurisprudencia/buscar?${new URLSearchParams({ q, jurisdiccion, pagina: String(pagina) }).toString()}`),
    documento: (id) => pedido(`/jurisprudencia/documento/${encodeURIComponent(id)}`),
};
