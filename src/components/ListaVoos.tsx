import { formatarDuracao, formatarHora, formatarPreco, rotuloEscalas } from "@/lib/formato";
import type { Voo } from "@/lib/voos/tipos";

type Props = { voos: Voo[]; idaEVolta: boolean };

const MOSTRAR = 10;

export function ListaVoos({ voos, idaEVolta }: Props) {
  return (
    <ol className="grid gap-2">
      {voos.slice(0, MOSTRAR).map((v, i) => {
        const diasDepois = v.chegada && v.partida ? diferencaDias(v.partida, v.chegada) : 0;
        return (
          <li key={i} className="grid gap-2 rounded-xl border border-borda-suave bg-superficie p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-1">
              <p className="tabular text-lg font-semibold">
                {formatarHora(v.partida)} → {formatarHora(v.chegada)}
                {diasDepois > 0 && <span className="ml-1 text-sm font-normal text-texto-secundario">(+{diasDepois} {diasDepois === 1 ? "dia" : "dias"})</span>}
              </p>
              <p className="text-sm text-texto-secundario">
                {v.companhias.join(", ")} · {formatarDuracao(v.duracaoMin)} ·{" "}
                {rotuloEscalas(v.escalas)}
                {v.conexoes.length > 0 && ` em ${v.conexoes.join(", ")}`}
              </p>
            </div>
            <p className="sm:text-right">
              <span className="tabular text-xl font-semibold">{formatarPreco(v.preco)}</span>
              {i === 0 && (
                <span className="ml-2 rounded-full bg-sucesso-fundo px-2 py-0.5 text-sm font-medium text-sucesso">Mais barato</span>
              )}
              <span className="block text-sm text-texto-secundario">{idaEVolta ? "ida e volta, por pessoa" : "só ida, por pessoa"}</span>
            </p>
          </li>
        );
      })}
      {voos.length > MOSTRAR && (
        <li className="px-1 text-sm text-texto-secundario">E mais {voos.length - MOSTRAR} opções mais caras.</li>
      )}
    </ol>
  );
}

function diferencaDias(partida: string, chegada: string): number {
  const d = (s: string) => Date.parse(`${s.slice(0, 10)}T00:00:00Z`);
  return Math.round((d(chegada) - d(partida)) / 86_400_000);
}
