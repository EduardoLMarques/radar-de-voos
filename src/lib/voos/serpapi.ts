/**
 * Conexão com a SerpApi (Google Flights). Todo o formato da API fica neste arquivo:
 * se a API mudar, só ele precisa ser ajustado.
 * Documentação: https://serpapi.com/google-flights-api
 */
import { filtrarVoos, HORAS_PERIODO, paramEscalas, somarDias } from "./filtros.ts";
import type { Busca, PontoHistorico, ResultadoDia, Trecho, Voo } from "./tipos.ts";

type AeroportoApi = { id?: string; time?: string };
type TrechoApi = {
  departure_airport?: AeroportoApi;
  arrival_airport?: AeroportoApi;
  duration?: number;
  airline?: string;
  flight_number?: string;
};
type OpcaoApi = {
  flights?: TrechoApi[];
  layovers?: { id?: string }[];
  total_duration?: number;
  price?: number;
};
type RespostaApi = {
  error?: string;
  best_flights?: OpcaoApi[];
  other_flights?: OpcaoApi[];
  price_insights?: {
    lowest_price?: number;
    price_level?: string;
    typical_price_range?: [number, number];
    price_history?: [number, number][];
  };
};

const NIVEL: Record<string, ResultadoDia["nivelPreco"]> = { low: "baixo", typical: "tipico", high: "alto" };

export function montarUrl(busca: Busca, data: string, chave: string, semCache: boolean): string {
  const p = new URLSearchParams({
    engine: "google_flights",
    departure_id: busca.origem,
    arrival_id: busca.destino,
    outbound_date: data,
    currency: "BRL",
    hl: "pt-BR",
    gl: "br",
    adults: "1",
    stops: String(paramEscalas(busca.escalasMax)),
    api_key: chave,
  });
  if (busca.diasViagem === null) {
    p.set("type", "2"); // só ida
  } else {
    p.set("type", "1"); // ida e volta
    p.set("return_date", somarDias(data, busca.diasViagem));
  }
  if (busca.periodo !== "qualquer") {
    const [de, ate] = HORAS_PERIODO[busca.periodo];
    p.set("outbound_times", `${de},${ate}`);
  }
  if (semCache) p.set("no_cache", "true");
  return `https://serpapi.com/search.json?${p}`;
}

function normalizarOpcao(o: OpcaoApi): Voo | null {
  const trechosApi = o.flights ?? [];
  if (typeof o.price !== "number" || trechosApi.length === 0) return null;
  const trechos: Trecho[] = trechosApi.map((t) => ({
    companhia: t.airline ?? "Companhia não informada",
    numero: t.flight_number ?? "",
    origem: t.departure_airport?.id ?? "",
    destino: t.arrival_airport?.id ?? "",
    partida: t.departure_airport?.time ?? "",
    chegada: t.arrival_airport?.time ?? "",
    duracaoMin: t.duration ?? 0,
  }));
  return {
    preco: o.price,
    escalas: trechos.length - 1,
    duracaoMin: o.total_duration ?? trechos.reduce((s, t) => s + t.duracaoMin, 0),
    companhias: [...new Set(trechos.map((t) => t.companhia))],
    partida: trechos[0].partida,
    chegada: trechos[trechos.length - 1].chegada,
    trechos,
    conexoes: (o.layovers ?? []).map((l) => l.id ?? "").filter(Boolean),
  };
}

/** Transforma a resposta da API no formato do app, já com os filtros aplicados. */
export function normalizarResposta(json: RespostaApi, busca: Busca, data: string): ResultadoDia {
  const todos = [...(json.best_flights ?? []), ...(json.other_flights ?? [])]
    .map(normalizarOpcao)
    .filter((v): v is Voo => v !== null);
  const voos = filtrarVoos(todos, busca);
  const insights = json.price_insights;
  const historico: PontoHistorico[] = (insights?.price_history ?? [])
    .filter((p) => Array.isArray(p) && p.length === 2)
    // A API manda o tempo em segundos.
    .map(([t, preco]) => ({ data: t < 1e12 ? t * 1000 : t, preco }));
  return {
    data,
    voos,
    menorPreco: voos[0]?.preco ?? null,
    nivelPreco: NIVEL[insights?.price_level ?? ""] ?? null,
    faixaTipica: insights?.typical_price_range ?? null,
    historico,
    erro: null,
  };
}

export async function buscarDia(busca: Busca, data: string, chave: string, semCache: boolean): Promise<ResultadoDia> {
  const vazio: ResultadoDia = {
    data, voos: [], menorPreco: null, nivelPreco: null, faixaTipica: null, historico: [], erro: null,
  };
  try {
    const resp = await fetch(montarUrl(busca, data, chave, semCache), {
      // Guarda a resposta por 15 minutos para não gastar a cota da API à toa.
      ...(semCache ? { cache: "no-store" as const } : { next: { revalidate: 900 } }),
      signal: AbortSignal.timeout(30_000),
    });
    const json = (await resp.json()) as RespostaApi;
    if (json.error) {
      // "Sem resultados" não é um erro: só não há voos nessa data.
      if (/hasn't returned any results/i.test(json.error)) return vazio;
      return { ...vazio, erro: traduzirErro(json.error, resp.status) };
    }
    if (!resp.ok) return { ...vazio, erro: traduzirErro("", resp.status) };
    return normalizarResposta(json, busca, data);
  } catch {
    return { ...vazio, erro: "Não foi possível falar com o serviço de passagens. Tente de novo em instantes." };
  }
}

function traduzirErro(mensagem: string, status: number): string {
  if (status === 401 || /invalid api key/i.test(mensagem)) return "A chave da SerpApi não é válida. Confira a variável SERPAPI_KEY.";
  if (status === 429 || /run out of searches|limit/i.test(mensagem)) return "A cota de buscas da SerpApi acabou neste mês.";
  return "O serviço de passagens não respondeu como esperado. Tente de novo em instantes.";
}
