import { formatarPreco } from "@/lib/formato";

type Props = { titulo: string; linhas: { rotulo: string; preco: number | null }[] };

/** Versão em tabela de um gráfico, para quem prefere ler os números. */
export function TabelaPontos({ titulo, linhas }: Props) {
  return (
    <details className="mt-3 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-texto-secundario hover:bg-superficie-hover focus-visible:outline-2 focus-visible:outline-foco">
        Ver em tabela
      </summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-borda-suave">
        <table className="w-full">
          <caption className="sr-only">{titulo}</caption>
          <thead className="sticky top-0 bg-superficie">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium">Data</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Preço</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-t border-borda-suave">
                <td className="px-3 py-2">{l.rotulo}</td>
                <td className="tabular px-3 py-2 text-right">{l.preco === null ? "Sem voos" : formatarPreco(l.preco)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
