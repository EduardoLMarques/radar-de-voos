import type { Busca, Periodo, Voo } from "./tipos.ts";

/** Máximo de datas por busca. Cada data gasta uma consulta da cota da API. */
export const MAX_DIAS = 7;

/** Horas de partida (início e fim, inclusive) de cada período. */
export const HORAS_PERIODO: Record<Exclude<Periodo, "qualquer">, [number, number]> = {
  madrugada: [0, 5],
  manha: [6, 11],
  tarde: [12, 17],
  noite: [18, 23],
};

export const ROTULO_PERIODO: Record<Periodo, string> = {
  qualquer: "Qualquer horário",
  madrugada: "Madrugada (0h–6h)",
  manha: "Manhã (6h–12h)",
  tarde: "Tarde (12h–18h)",
  noite: "Noite (18h–24h)",
};

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_IATA = /^[A-Z]{3}$/;

/** Lista as datas entre início e fim, inclusive (AAAA-MM-DD). */
export function datasNoIntervalo(inicio: string, fim: string): string[] {
  const datas: string[] = [];
  const atual = new Date(`${inicio}T00:00:00Z`);
  const ultimo = new Date(`${fim}T00:00:00Z`);
  while (atual <= ultimo) {
    datas.push(atual.toISOString().slice(0, 10));
    atual.setUTCDate(atual.getUTCDate() + 1);
  }
  return datas;
}

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Hora (0–23) de um horário "AAAA-MM-DD HH:MM". */
export function horaDe(horario: string): number {
  return Number(horario.slice(11, 13));
}

export function passaNoPeriodo(voo: Voo, periodo: Periodo): boolean {
  if (periodo === "qualquer") return true;
  const [de, ate] = HORAS_PERIODO[periodo];
  const hora = horaDe(voo.partida);
  return hora >= de && hora <= ate;
}

export function passaNasEscalas(voo: Voo, min: number, max: number): boolean {
  // max 3 significa "2 ou mais": sem limite superior.
  return voo.escalas >= min && (max >= 3 || voo.escalas <= max);
}

/** Aplica os filtros de horário e escalas e ordena do mais barato para o mais caro. */
export function filtrarVoos(voos: Voo[], busca: Pick<Busca, "periodo" | "escalasMin" | "escalasMax">): Voo[] {
  return voos
    .filter((v) => passaNoPeriodo(v, busca.periodo) && passaNasEscalas(v, busca.escalasMin, busca.escalasMax))
    .sort((a, b) => a.preco - b.preco || a.duracaoMin - b.duracaoMin);
}

/**
 * Valor do parâmetro "stops" da API (Google Flights):
 * 0 = qualquer, 1 = só direto, 2 = até 1 escala, 3 = até 2 escalas.
 */
export function paramEscalas(escalasMax: number): number {
  if (escalasMax >= 3) return 0;
  return escalasMax + 1;
}

/** Valida os parâmetros da URL e devolve a busca ou uma mensagem de erro. */
export function lerBusca(params: URLSearchParams, hoje: string): { busca: Busca } | { erro: string } {
  const origem = (params.get("origem") ?? "").trim().toUpperCase();
  const destino = (params.get("destino") ?? "").trim().toUpperCase();
  const dataInicio = params.get("dataInicio") ?? "";
  const dataFim = params.get("dataFim") ?? dataInicio;
  const periodo = (params.get("periodo") ?? "qualquer") as Periodo;
  const escalasMin = Number(params.get("escalasMin") ?? 0);
  const escalasMax = Number(params.get("escalasMax") ?? 3);
  const diasTexto = params.get("diasViagem");
  const diasViagem = diasTexto ? Number(diasTexto) : null;

  if (!REGEX_IATA.test(origem)) return { erro: "Informe a origem com o código de 3 letras do aeroporto (ex.: GRU)." };
  if (!REGEX_IATA.test(destino)) return { erro: "Informe o destino com o código de 3 letras do aeroporto (ex.: LIS)." };
  if (origem === destino) return { erro: "Origem e destino precisam ser diferentes." };
  if (!REGEX_DATA.test(dataInicio) || !REGEX_DATA.test(dataFim)) return { erro: "Escolha as datas de ida." };
  if (dataInicio < hoje) return { erro: "A primeira data de ida já passou." };
  if (dataFim < dataInicio) return { erro: "A data final vem antes da inicial." };
  if (datasNoIntervalo(dataInicio, dataFim).length > MAX_DIAS)
    return { erro: `Escolha no máximo ${MAX_DIAS} dias de ida por busca.` };
  if (!(periodo in ROTULO_PERIODO)) return { erro: "Horário inválido." };
  if (![0, 1, 2].includes(escalasMin) || ![0, 1, 2, 3].includes(escalasMax))
    return { erro: "Escalas inválidas." };
  if (escalasMin > escalasMax) return { erro: "O mínimo de escalas não pode ser maior que o máximo." };
  if (diasViagem !== null && !(Number.isInteger(diasViagem) && diasViagem >= 1 && diasViagem <= 60))
    return { erro: "A duração da viagem deve ficar entre 1 e 60 dias." };

  return { busca: { origem, destino, dataInicio, dataFim, periodo, escalasMin, escalasMax, diasViagem } };
}

export function buscaParaParams(busca: Busca): URLSearchParams {
  const p = new URLSearchParams({
    origem: busca.origem,
    destino: busca.destino,
    dataInicio: busca.dataInicio,
    dataFim: busca.dataFim,
    periodo: busca.periodo,
    escalasMin: String(busca.escalasMin),
    escalasMax: String(busca.escalasMax),
  });
  if (busca.diasViagem !== null) p.set("diasViagem", String(busca.diasViagem));
  return p;
}

/** Chave estável de uma busca, para guardar o acompanhamento. */
export function chaveBusca(busca: Busca): string {
  return buscaParaParams(busca).toString();
}
