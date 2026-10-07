import { datasNoIntervalo, lerBusca } from "@/lib/voos/filtros";
import { diaDeExemplo } from "@/lib/voos/exemplo";
import { buscarDia } from "@/lib/voos/serpapi";
import type { RespostaBusca } from "@/lib/voos/tipos";

function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lido = lerBusca(params, hojeEmSaoPaulo());
  if ("erro" in lido) return Response.json({ erro: lido.erro }, { status: 400 });

  const { busca } = lido;
  const datas = datasNoIntervalo(busca.dataInicio, busca.dataFim);
  const chave = process.env.SERPAPI_KEY;
  const semCache = params.get("atualizar") === "1";

  const dias = chave
    ? await Promise.all(datas.map((d) => buscarDia(busca, d, chave, semCache)))
    : datas.map((d) => diaDeExemplo(busca, d));

  const resposta: RespostaBusca = { busca, dias, consultadoEm: new Date().toISOString(), exemplo: !chave };
  return Response.json(resposta);
}
