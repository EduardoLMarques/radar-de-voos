const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const moedaCompacta = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export const formatarPreco = (v: number) => moeda.format(v);
export const formatarPrecoCurto = (v: number) => `R$ ${moedaCompacta.format(v)}`;

/** "2026-11-12" → "qui., 12 de nov." */
export function formatarData(data: string, comAno = false): string {
  return new Date(`${data}T12:00:00Z`).toLocaleDateString("pt-BR", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC", ...(comAno ? { year: "numeric" } : {}),
  });
}

/** "2026-11-12" → "12/11" */
export const formatarDataCurta = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;

export const formatarDataMs = (ms: number) =>
  new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });

export const formatarDataHoraMs = (ms: number) =>
  new Date(ms).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** "2026-11-12 08:35" → "08:35" */
export const formatarHora = (horario: string) => horario.slice(11, 16);

export function formatarDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export const rotuloEscalas = (n: number) => (n === 0 ? "Direto" : n === 1 ? "1 escala" : `${n} escalas`);
