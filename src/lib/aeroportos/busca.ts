/** Busca de aeroportos por código, cidade, nome do aeroporto ou país. Roda no servidor. */
import { APELIDOS, CIDADES_PT } from "./nomes-pt.ts";

/** [código IATA, nome do aeroporto, cidade, país (código ISO), 1 se for grande], como vem de src/data/aeroportos.json */
export type LinhaAeroporto = [string, string, string, string, number];

const paisPt = new Intl.DisplayNames(["pt-BR"], { type: "region" });
const paisEn = new Intl.DisplayNames(["en"], { type: "region" });
const nomePais = (nomes: Intl.DisplayNames, iso: string) => {
  try {
    return nomes.of(iso) ?? iso;
  } catch {
    return iso;
  }
};

export type OpcaoAeroporto = {
  tipo: "cidade" | "aeroporto";
  codigos: string[];
  titulo: string; // o que aparece em destaque na lista
  detalhe: string; // a linha de baixo
  rotulo: string; // o texto que fica no campo depois de escolher
};

type Aeroporto = {
  codigo: string;
  nome: string;
  cidade: string; // já em português quando há tradução
  pais: string;
  grande: boolean;
  brasil: boolean;
  grupo: string; // cidade + país (London da Inglaterra ≠ London do Canadá)
  buscaCidade: string[];
  buscaNome: string;
  buscaPais: string[];
};

export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function prepararAeroportos(linhas: LinhaAeroporto[]): Aeroporto[] {
  return linhas
    .map(([codigo, nome, cidade, iso, grande]) => {
      const cidadeN = normalizar(cidade);
      const cidadePt = CIDADES_PT[cidadeN] ?? cidade;
      const pais = nomePais(paisPt, iso);
      return {
        codigo,
        nome,
        cidade: cidadePt,
        pais,
        grande: grande === 1,
        brasil: iso === "BR",
        grupo: `${cidadeN}|${iso}`,
        buscaCidade: [...new Set([cidadeN, normalizar(cidadePt), ...(APELIDOS[cidadeN] ?? [])])],
        buscaNome: normalizar(nome),
        buscaPais: [...new Set([normalizar(pais), normalizar(nomePais(paisEn, iso))])],
      };
    })
    // Aeroportos grandes primeiro: é a ordem em que aparecem dentro de cada cidade.
    .sort((a, b) => Number(b.grande) - Number(a.grande));
}

function pontuar(a: Aeroporto, q: string, qCodigo: string): number {
  if (a.codigo === qCodigo) return 100;
  let p = 0;
  for (const c of a.buscaCidade) {
    if (c === q) p = Math.max(p, 90);
    else if (c.startsWith(q)) p = Math.max(p, 70);
    else if (q.length >= 3 && c.includes(` ${q}`)) p = Math.max(p, 50);
  }
  if (q.length >= 3) {
    if (a.buscaNome.startsWith(q)) p = Math.max(p, 45);
    else if (a.buscaNome.includes(` ${q}`)) p = Math.max(p, 35);
  }
  if (q.length >= 4 && a.buscaPais.some((c) => c === q || c.startsWith(q))) p = Math.max(p, 20);
  return p;
}

const LIMITE_OPCOES = 12;

export function buscarAeroportos(aeroportos: Aeroporto[], texto: string): OpcaoAeroporto[] {
  const q = normalizar(texto);
  if (q.length < 2) return [];
  const qCodigo = texto.trim().toUpperCase();

  // Agrupa os aeroportos encontrados por cidade.
  const grupos = new Map<string, { pontos: number; achados: Aeroporto[] }>();
  for (const a of aeroportos) {
    const pontos = pontuar(a, q, qCodigo);
    if (!pontos) continue;
    const g = grupos.get(a.grupo) ?? { pontos: 0, achados: [] };
    g.pontos = Math.max(g.pontos, pontos);
    g.achados.push(a);
    grupos.set(a.grupo, g);
  }
  const porGrupo = new Map<string, Aeroporto[]>();
  if (grupos.size) {
    for (const a of aeroportos) if (grupos.has(a.grupo)) porGrupo.set(a.grupo, [...(porGrupo.get(a.grupo) ?? []), a]);
  }

  const ordenados = [...grupos.entries()].sort(
    ([ga, a], [gb, b]) =>
      b.pontos - a.pontos ||
      // Desempate: o público é brasileiro, então cidades do Brasil vêm antes.
      Number(b.achados[0].brasil) - Number(a.achados[0].brasil) ||
      Number(porGrupo.get(gb)!.some((x) => x.grande)) - Number(porGrupo.get(ga)!.some((x) => x.grande)) ||
      porGrupo.get(gb)!.length - porGrupo.get(ga)!.length ||
      a.achados[0].cidade.localeCompare(b.achados[0].cidade),
  );

  const opcoes: OpcaoAeroporto[] = [];
  for (const [grupo, { pontos, achados }] of ordenados) {
    const todos = porGrupo.get(grupo)!;
    const { cidade, pais } = todos[0];
    // Achou pela cidade e ela tem mais de um aeroporto: oferece "todos os aeroportos" primeiro.
    const pelaCidade = pontos >= 50 && pontos < 100;
    const lista = pelaCidade ? todos : achados;
    if (pelaCidade && todos.length > 1) {
      const codigos = todos.map((a) => a.codigo).slice(0, 7);
      opcoes.push({
        tipo: "cidade",
        codigos,
        titulo: `${cidade}, ${pais}`,
        detalhe: `Todos os aeroportos (${codigos.join(", ")})`,
        rotulo: `${cidade} (todos)`,
      });
    }
    for (const a of lista) {
      opcoes.push({
        tipo: "aeroporto",
        codigos: [a.codigo],
        titulo: `${a.cidade}, ${a.pais}`,
        detalhe: a.nome,
        rotulo: `${a.cidade} (${a.codigo})`,
      });
    }
    if (opcoes.length >= LIMITE_OPCOES) break;
  }
  return opcoes.slice(0, LIMITE_OPCOES);
}
