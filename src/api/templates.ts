import { ESTUDIO_ID, pedido } from './http';

export interface Template {
  id: string;
  estudio_id: string;
  nombre: string;
  categoria: string | null;
  documento_id: string;
  creado_en: number;
}

export const api = {
  listarTemplates: (categoria?: string) => {
    const query = new URLSearchParams({ estudio_id: ESTUDIO_ID });
    if (categoria) query.set('categoria', categoria);
    return pedido<Template[]>(`/templates?${query.toString()}`);
  },
};
