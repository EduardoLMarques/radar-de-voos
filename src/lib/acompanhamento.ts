/**
 * Buscas que a pessoa escolheu acompanhar. Ficam guardadas no navegador (localStorage):
 * a cada consulta, o menor preço do período vira um ponto do histórico.
 */
import { chaveBusca } from "@/lib/voos/filtros";
import type { Busca, PontoHistorico } from "@/lib/voos/tipos";

export type Acompanhada = { chave: string; busca: Busca; pontos: PontoHistorico[] };

const CHAVE = "radar-de-voos:acompanhadas";
const MAX_PONTOS = 500;

export function lerAcompanhadas(): Acompanhada[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Acompanhada[]) : [];
  } catch {
    return [];
  }
}

function salvar(lista: Acompanhada[]): Acompanhada[] {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // Sem armazenamento (aba anônima, por exemplo): o acompanhamento vale só enquanto a página estiver aberta.
  }
  return lista;
}

export function acompanhar(lista: Acompanhada[], busca: Busca, preco: number | null): Acompanhada[] {
  const chave = chaveBusca(busca);
  if (lista.some((a) => a.chave === chave)) return lista;
  const pontos = preco === null ? [] : [{ data: Date.now(), preco }];
  return salvar([{ chave, busca, pontos }, ...lista]);
}

export function pararDeAcompanhar(lista: Acompanhada[], chave: string): Acompanhada[] {
  return salvar(lista.filter((a) => a.chave !== chave));
}

/** Registra o menor preço de uma consulta, se a busca estiver sendo acompanhada. */
export function registrarPreco(lista: Acompanhada[], busca: Busca, preco: number): Acompanhada[] {
  const chave = chaveBusca(busca);
  if (!lista.some((a) => a.chave === chave)) return lista;
  return salvar(
    lista.map((a) => (a.chave === chave ? { ...a, pontos: [...a.pontos, { data: Date.now(), preco }].slice(-MAX_PONTOS) } : a)),
  );
}
