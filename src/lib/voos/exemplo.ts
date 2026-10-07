/**
 * Preços de EXEMPLO, usados só quando a chave da SerpApi não está configurada.
 * Servem para ver a tela funcionando; não são preços reais.
 */
import { filtrarVoos } from "./filtros.ts";
import type { Busca, PontoHistorico, ResultadoDia, Voo } from "./tipos.ts";

const COMPANHIAS = ["LATAM", "GOL", "Azul", "TAP", "Iberia", "Air France"];
const CONEXOES = ["MAD", "LIS", "CDG", "GIG", "BSB", "PTY"];

/** Gerador de números pseudoaleatórios com semente: a mesma busca dá sempre o mesmo resultado. */
function aleatorio(semente: string) {
  let h = 2166136261;
  for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function diaDeExemplo(busca: Busca, data: string): ResultadoDia {
  const rnd = aleatorio(`${busca.origem}${busca.destino}${data}${busca.diasViagem}`);
  const base = 1500 + rnd() * 2500 * (busca.diasViagem ? 1.7 : 1);
  const voos: Voo[] = Array.from({ length: 14 }, () => {
    const escalas = Math.floor(rnd() * 3);
    const hora = Math.floor(rnd() * 24);
    const minuto = Math.floor(rnd() * 12) * 5;
    const duracaoMin = 300 + escalas * 180 + Math.floor(rnd() * 240);
    const chegadaMs = Date.parse(`${data}T${pad(hora)}:${pad(minuto)}:00Z`) + duracaoMin * 60_000;
    const chegada = new Date(chegadaMs).toISOString().slice(0, 16).replace("T", " ");
    const companhia = COMPANHIAS[Math.floor(rnd() * COMPANHIAS.length)];
    const origem = busca.origem.split(",")[0];
    const destino = busca.destino.split(",")[0];
    const possiveis = CONEXOES.filter((c) => c !== origem && c !== destino);
    const conexoes = Array.from({ length: escalas }, () => possiveis[Math.floor(rnd() * possiveis.length)]);
    const paradas = [origem, ...conexoes, destino];
    const partida = `${data} ${pad(hora)}:${pad(minuto)}`;
    return {
      preco: Math.round(base * (1.25 - escalas * 0.12 + rnd() * 0.6)),
      escalas,
      duracaoMin,
      companhias: [companhia],
      partida,
      chegada,
      conexoes,
      trechos: paradas.slice(0, -1).map((o, i) => ({
        companhia,
        numero: `${companhia.slice(0, 2).toUpperCase()} ${1000 + Math.floor(rnd() * 8000)}`,
        origem: o,
        destino: paradas[i + 1],
        partida: i === 0 ? partida : "",
        chegada: i === paradas.length - 2 ? chegada : "",
        duracaoMin: Math.round(duracaoMin / (escalas + 1)),
      })),
    };
  });
  const filtrados = filtrarVoos(voos, busca);
  const hoje = Date.parse(`${new Date().toISOString().slice(0, 10)}T12:00:00Z`);
  const historico: PontoHistorico[] = Array.from({ length: 60 }, (_, i) => ({
    data: hoje - (59 - i) * 86_400_000,
    preco: Math.round(base * (1.15 + Math.sin(i / 7) * 0.12 + (rnd() - 0.5) * 0.1 - i * 0.002)),
  }));
  const menor = filtrados[0]?.preco ?? null;
  const faixa: [number, number] = [Math.round(base * 1.05), Math.round(base * 1.4)];
  return {
    data,
    voos: filtrados,
    menorPreco: menor,
    nivelPreco: menor === null ? null : menor < faixa[0] ? "baixo" : menor > faixa[1] ? "alto" : "tipico",
    faixaTipica: faixa,
    historico,
    erro: null,
  };
}
