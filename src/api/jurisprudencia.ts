import { pedido } from './http';

export type Jurisdiccion = 'todas' | 'buenos_aires' | 'federal' | 'nacional';

export interface ResultadoJurisprudencia {
  id: string;
  titulo: string;
  extracto: string;
  fecha: string | null;
  numero_sumario: string | null;
  tipo_tribunal: string | null;
  jurisdiccion: string | null;
  voces: string[];
  /** Página pública del sumario en SAIJ. */
  enlace: string;
}

export interface PaginaJurisprudencia {
  total: number;
  pagina: number;
  por_pagina: number;
  resultados: ResultadoJurisprudencia[];
  consulta: string;
  demora_ms: number;
}

export interface DocumentoJurisprudencia extends Omit<ResultadoJurisprudencia, 'extracto'> {
  materia: string | null;
  parrafos: string[];
}

export const api = {
  buscar: (q: string, jurisdiccion: Jurisdiccion, pagina: number) =>
    pedido<PaginaJurisprudencia>(`/jurisprudencia/buscar?${new URLSearchParams({ q, jurisdiccion, pagina: String(pagina) }).toString()}`),
  documento: (id: string) => pedido<DocumentoJurisprudencia>(`/jurisprudencia/documento/${encodeURIComponent(id)}`),
};
