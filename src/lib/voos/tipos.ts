/** Faixas de horário de partida que a pessoa pode escolher. */
export type Periodo = "qualquer" | "madrugada" | "manha" | "tarde" | "noite";

export type Busca = {
  origem: string; // código IATA, ex.: GRU
  destino: string; // código IATA, ex.: LIS
  dataInicio: string; // AAAA-MM-DD, primeira data de ida
  dataFim: string; // AAAA-MM-DD, última data de ida
  periodo: Periodo;
  escalasMin: number; // 0, 1 ou 2
  escalasMax: number; // 0, 1, 2 ou 3 (3 = "2 ou mais")
  diasViagem: number | null; // null = só ida; número = ida e volta com essa duração
};

export type Trecho = {
  companhia: string;
  numero: string;
  origem: string;
  destino: string;
  partida: string; // "AAAA-MM-DD HH:MM", horário local do aeroporto
  chegada: string;
  duracaoMin: number;
};

export type Voo = {
  preco: number;
  escalas: number;
  duracaoMin: number;
  companhias: string[];
  partida: string;
  chegada: string;
  trechos: Trecho[];
  conexoes: string[]; // códigos dos aeroportos de conexão
};

/** Um ponto do histórico de preços: data (ms desde 1970) e preço. */
export type PontoHistorico = { data: number; preco: number };

export type ResultadoDia = {
  data: string; // data de ida (AAAA-MM-DD)
  voos: Voo[]; // já filtrados e ordenados do mais barato para o mais caro
  menorPreco: number | null;
  nivelPreco: "baixo" | "tipico" | "alto" | null;
  faixaTipica: [number, number] | null;
  historico: PontoHistorico[];
  erro: string | null;
};

export type RespostaBusca = {
  busca: Busca;
  dias: ResultadoDia[];
  consultadoEm: string; // ISO
  exemplo: boolean; // true quando não há chave da API e os preços são de exemplo
};
