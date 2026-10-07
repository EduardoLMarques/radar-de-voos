import linhas from "@/data/aeroportos.json";
import { buscarAeroportos, prepararAeroportos, type LinhaAeroporto } from "@/lib/aeroportos/busca";

// Preparada uma vez por servidor, não a cada busca.
const aeroportos = prepararAeroportos(linhas as LinhaAeroporto[]);

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(
    { opcoes: buscarAeroportos(aeroportos, q.slice(0, 60)) },
    { headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
