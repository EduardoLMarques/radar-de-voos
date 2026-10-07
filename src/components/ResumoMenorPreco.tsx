import { formatarData, formatarDuracao, formatarHora, formatarPreco, rotuloEscalas } from "@/lib/formato";
import type { ResultadoDia } from "@/lib/voos/tipos";

const NIVEL = {
  baixo: { texto: "Preço baixo para esta rota", icone: "↓", classe: "bg-sucesso-fundo text-sucesso" },
  tipico: { texto: "Preço normal para esta rota", icone: "＝", classe: "bg-realce text-texto" },
  alto: { texto: "Preço alto para esta rota", icone: "↑", classe: "bg-aviso-fundo text-aviso" },
};

/** O número que a tela destaca: o menor preço encontrado em todo o período. */
export function ResumoMenorPreco({ dia, rota }: { dia: ResultadoDia; rota: string }) {
  const voo = dia.voos[0];
  if (!voo) return null;
  const nivel = dia.nivelPreco ? NIVEL[dia.nivelPreco] : null;
  return (
    <section aria-labelledby="titulo-menor" className="grid gap-3 rounded-2xl bg-superficie p-4 sm:p-6">
      <h2 id="titulo-menor" className="text-sm font-medium text-texto-secundario">
        Menor preço encontrado · {rota}
      </h2>
      <p className="text-5xl font-semibold tracking-tight">{formatarPreco(voo.preco)}</p>
      <p className="text-base">
        Ida em <strong className="font-semibold">{formatarData(dia.data)}</strong>, {formatarHora(voo.partida)} ·{" "}
        {voo.companhias.join(", ")} · {rotuloEscalas(voo.escalas)} · {formatarDuracao(voo.duracaoMin)}
      </p>
      {nivel && (
        <p className={`justify-self-start rounded-full px-3 py-1 text-sm font-medium ${nivel.classe}`}>
          <span aria-hidden className="mr-1">{nivel.icone}</span>
          {nivel.texto}
          {dia.faixaTipica && (
            <span className="font-normal">
              {" "}(o normal é entre {formatarPreco(dia.faixaTipica[0])} e {formatarPreco(dia.faixaTipica[1])})
            </span>
          )}
        </p>
      )}
    </section>
  );
}
