"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FormularioBusca } from "@/components/FormularioBusca";
import { GraficoLinha } from "@/components/GraficoLinha";
import { GraficoPorData } from "@/components/GraficoPorData";
import { ListaVoos } from "@/components/ListaVoos";
import { ResumoMenorPreco } from "@/components/ResumoMenorPreco";
import { TabelaPontos } from "@/components/TabelaPontos";
import { acompanhar, lerAcompanhadas, pararDeAcompanhar, registrarPreco, type Acompanhada } from "@/lib/acompanhamento";
import {
  formatarData, formatarDataCurta, formatarDataHoraMs, formatarDataMs, formatarPreco,
} from "@/lib/formato";
import { ROTULO_PERIODO, buscaParaParams, chaveBusca, rotuloCodigos, somarDias } from "@/lib/voos/filtros";
import type { Busca, RespostaBusca, ResultadoDia } from "@/lib/voos/tipos";

const INTERVALO_AUTO_MIN = 30;

const botaoSecundario =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-borda bg-superficie px-4 text-sm font-medium " +
  "hover:bg-superficie-hover active:bg-superficie-ativa focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-foco disabled:cursor-not-allowed disabled:bg-desabilitado disabled:text-texto-desabilitado";

function menorDia(dias: ResultadoDia[]): ResultadoDia | null {
  return dias.reduce<ResultadoDia | null>(
    (melhor, d) => (d.menorPreco !== null && (melhor === null || d.menorPreco < (melhor.menorPreco ?? Infinity)) ? d : melhor),
    null,
  );
}

const nomeRota = (b: Busca) =>
  `${b.origemNome ?? rotuloCodigos(b.origem)} → ${b.destinoNome ?? rotuloCodigos(b.destino)}`;

const descreverBusca = (b: Busca) =>
  `${nomeRota(b)} · ida ${formatarDataCurta(b.dataInicio)}` +
  (b.dataFim !== b.dataInicio ? `–${formatarDataCurta(b.dataFim)}` : "") +
  (b.diasViagem !== null ? ` · volta após ${b.diasViagem} dias` : " · só ida");

export function RadarDeVoos({ hoje }: { hoje: string }) {
  const [busca, setBusca] = useState<Busca | null>(null);
  const [resposta, setResposta] = useState<RespostaBusca | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dataSel, setDataSel] = useState<string | null>(null);
  const [acompanhadas, setAcompanhadas] = useState<Acompanhada[]>([]);
  const [auto, setAuto] = useState(false);
  const [chaveForm, setChaveForm] = useState(0);
  const pedido = useRef(0);
  const acompanhadasRef = useRef<Acompanhada[]>([]);

  // Lê do navegador depois de montar, para o HTML do servidor e o do navegador baterem.
  useEffect(() => {
    const lista = lerAcompanhadas();
    acompanhadasRef.current = lista;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAcompanhadas(lista);
  }, []);

  const atualizarLista = (lista: Acompanhada[]) => {
    acompanhadasRef.current = lista;
    setAcompanhadas(lista);
  };

  const buscar = useCallback(async (b: Busca, forcar = false) => {
    const id = ++pedido.current;
    setBusca(b);
    setCarregando(true);
    setErro(null);
    try {
      const params = buscaParaParams(b);
      if (forcar) params.set("atualizar", "1");
      const resp = await fetch(`/api/voos?${params}`);
      const json = await resp.json();
      if (id !== pedido.current) return; // chegou uma busca mais nova
      if (!resp.ok) {
        setErro(json.erro ?? "Não foi possível buscar agora.");
        return;
      }
      const r = json as RespostaBusca;
      setResposta(r);
      const melhor = menorDia(r.dias);
      setDataSel((atual) => (atual && r.dias.some((d) => d.data === atual) ? atual : (melhor?.data ?? r.dias[0]?.data ?? null)));
      if (melhor?.menorPreco != null && !r.exemplo) {
        atualizarLista(registrarPreco(acompanhadasRef.current, b, melhor.menorPreco));
      }
    } catch {
      if (id === pedido.current) setErro("Sem conexão com o servidor. Confira a internet e tente de novo.");
    } finally {
      if (id === pedido.current) setCarregando(false);
    }
  }, []);

  // Atualização automática enquanto a página está aberta.
  useEffect(() => {
    if (!auto || !busca) return;
    const t = setInterval(() => buscar(busca), INTERVALO_AUTO_MIN * 60_000);
    return () => clearInterval(t);
  }, [auto, busca, buscar]);

  const dias = resposta?.dias ?? [];
  const melhor = menorDia(dias);
  const diaSel = dias.find((d) => d.data === dataSel) ?? null;
  const chaveAtual = busca ? chaveBusca(busca) : null;
  const acompanhadaAtual = acompanhadas.find((a) => a.chave === chaveAtual) ?? null;
  const diasComErro = dias.filter((d) => d.erro);
  const semNenhumVoo = resposta !== null && melhor === null;
  const inicial: Busca = busca ?? {
    origem: "GRU,CGH", origemNome: "São Paulo (todos)", destino: "", dataInicio: somarDias(hoje, 30), dataFim: somarDias(hoje, 36),
    periodo: "qualquer", escalasMin: 0, escalasMax: 3, diasViagem: null,
  };

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:py-10">
      <header className="grid gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Radar de Voos</h1>
        <p className="text-base text-texto-secundario">
          Encontre o menor preço para o seu destino e veja como ele vem mudando.
        </p>
      </header>

      {acompanhadas.length > 0 && (
        <section aria-labelledby="titulo-acompanhadas" className="grid gap-2">
          <h2 id="titulo-acompanhadas" className="text-lg font-semibold">Buscas que você acompanha</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {acompanhadas.map((a) => {
              const ultimo = a.pontos.at(-1);
              const primeiro = a.pontos[0];
              const variacao = ultimo && primeiro && a.pontos.length > 1 ? ultimo.preco - primeiro.preco : null;
              return (
                <li key={a.chave} className="flex flex-wrap items-center gap-3 rounded-xl border border-borda-suave bg-superficie p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{descreverBusca(a.busca)}</p>
                    <p className="tabular text-sm text-texto-secundario">
                      {ultimo ? `Último: ${formatarPreco(ultimo.preco)} em ${formatarDataHoraMs(ultimo.data)}` : "Ainda sem preço registrado"}
                      {variacao !== null && variacao !== 0 && (
                        <span className={variacao < 0 ? "text-sucesso" : "text-aviso"}>
                          {" "}· {variacao < 0 ? "↓ caiu" : "↑ subiu"} {formatarPreco(Math.abs(variacao))}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button" className={botaoSecundario} disabled={a.busca.dataInicio < hoje}
                    onClick={() => {
                      setChaveForm((k) => k + 1);
                      setDataSel(null);
                      buscar(a.busca);
                    }}
                  >
                    {a.busca.dataInicio < hoje ? "Datas passaram" : "Abrir"}
                  </button>
                  <button
                    type="button" className={botaoSecundario}
                    aria-label={`Parar de acompanhar ${descreverBusca(a.busca)}`}
                    onClick={() => atualizarLista(pararDeAcompanhar(acompanhadasRef.current, a.chave))}
                  >
                    Remover
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <FormularioBusca
        key={chaveForm} inicial={inicial} hoje={hoje} carregando={carregando}
        onBuscar={(b) => {
          setDataSel(null);
          buscar(b);
        }}
      />

      <div aria-live="polite" className="sr-only">
        {carregando ? "Buscando preços" : resposta && melhor ? `Menor preço: ${formatarPreco(melhor.menorPreco!)}` : ""}
      </div>

      {erro && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-erro bg-erro-fundo p-4 text-erro">
          <p className="flex-1">{erro}</p>
          {busca && (
            <button type="button" className={botaoSecundario} onClick={() => buscar(busca)}>Tentar de novo</button>
          )}
        </div>
      )}

      {!resposta && !carregando && !erro && (
        <section className="rounded-2xl border border-dashed border-borda p-6 text-center text-texto-secundario">
          <p className="text-base">
            Escolha origem, destino e as datas de ida. Mostramos o voo mais barato de cada dia, o histórico de preço da rota
            e você pode acompanhar a busca para ver se o preço cai.
          </p>
        </section>
      )}

      {!resposta && carregando && (
        <p className="rounded-2xl bg-superficie p-6 text-center text-texto-secundario">
          Buscando preços dia a dia. Pode levar alguns segundos…
        </p>
      )}

      {resposta && (
        <div className={`grid gap-6 transition-opacity ${carregando ? "opacity-60" : ""}`} aria-busy={carregando}>
          {resposta.exemplo && (
            <p className="rounded-xl bg-aviso-fundo p-4 text-sm text-aviso">
              <strong className="font-semibold">Preços de exemplo.</strong> A chave da SerpApi ainda não foi configurada, então
              os valores abaixo são inventados, só para ver a tela funcionando.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-texto-secundario">
            <p className="basis-full sm:basis-auto sm:flex-1">
              {descreverBusca(busca ?? resposta.busca)} · {ROTULO_PERIODO[resposta.busca.periodo]} · consultado em{" "}
              {formatarDataHoraMs(Date.parse(resposta.consultadoEm))}
            </p>
            <button type="button" className={botaoSecundario} disabled={carregando} onClick={() => busca && buscar(busca, true)}>
              {carregando ? "Atualizando…" : "Atualizar agora"}
            </button>
            {busca && !resposta.exemplo && (
              <button
                type="button" className={botaoSecundario} aria-pressed={acompanhadaAtual !== null}
                onClick={() =>
                  atualizarLista(
                    acompanhadaAtual
                      ? pararDeAcompanhar(acompanhadasRef.current, acompanhadaAtual.chave)
                      : acompanhar(acompanhadasRef.current, busca, melhor?.menorPreco ?? null),
                  )
                }
              >
                {acompanhadaAtual ? "✓ Acompanhando" : "Acompanhar esta busca"}
              </button>
            )}
            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="checkbox" className="size-5 accent-destaque" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              Atualizar sozinho a cada {INTERVALO_AUTO_MIN} min
            </label>
          </div>

          {diasComErro.length > 0 && (
            <p role="alert" className="rounded-xl border border-erro bg-erro-fundo p-4 text-sm text-erro">
              {diasComErro.length === dias.length
                ? diasComErro[0].erro
                : `Não conseguimos os preços de ${diasComErro.map((d) => formatarDataCurta(d.data)).join(", ")}. ${diasComErro[0].erro}`}
            </p>
          )}

          {semNenhumVoo && diasComErro.length < dias.length && (
            <section className="rounded-2xl border border-dashed border-borda p-6 text-center">
              <p className="font-medium">Nenhum voo com esses filtros.</p>
              <p className="text-texto-secundario">Tente aceitar mais escalas, outro horário ou outras datas.</p>
            </section>
          )}

          {melhor && <ResumoMenorPreco dia={melhor} rota={nomeRota(busca ?? resposta.busca)} />}

          {melhor && dias.length > 1 && (
            <section aria-labelledby="titulo-por-data" className="rounded-2xl bg-superficie p-4 sm:p-6">
              <h2 id="titulo-por-data" className="text-lg font-semibold">Menor preço por data de ida</h2>
              <p className="mb-3 text-sm text-texto-secundario">Toque numa data para ver os voos dela.</p>
              <GraficoPorData dias={dias} selecionada={dataSel ?? ""} onSelecionar={setDataSel} />
              <TabelaPontos
                titulo="Menor preço por data de ida"
                linhas={dias.map((d) => ({ rotulo: formatarData(d.data), preco: d.menorPreco }))}
              />
            </section>
          )}

          {diaSel && diaSel.historico.length > 1 && (
            <section aria-labelledby="titulo-historico" className="rounded-2xl bg-superficie p-4 sm:p-6">
              <h2 id="titulo-historico" className="text-lg font-semibold">Histórico de preço</h2>
              <p className="mb-3 text-sm text-texto-secundario">
                Como o preço da ida em {formatarData(diaSel.data)} variou nos últimos {diaSel.historico.length} dias
                (dados do Google Flights).{diaSel.faixaTipica && " A faixa cinza é o preço normal da rota."}
              </p>
              <GraficoLinha
                pontos={diaSel.historico} faixa={diaSel.faixaTipica} formatarX={formatarDataMs}
                rotulo={`Histórico de preço da ida em ${formatarData(diaSel.data)}`}
              />
              <TabelaPontos
                titulo="Histórico de preço"
                linhas={diaSel.historico.map((p) => ({ rotulo: formatarDataMs(p.data), preco: p.preco }))}
              />
            </section>
          )}

          {acompanhadaAtual && (
            <section aria-labelledby="titulo-seu" className="rounded-2xl bg-superficie p-4 sm:p-6">
              <h2 id="titulo-seu" className="text-lg font-semibold">Seu acompanhamento</h2>
              <p className="mb-3 text-sm text-texto-secundario">
                O menor preço de todo o período a cada vez que você consultou esta busca.
              </p>
              {acompanhadaAtual.pontos.length > 1 ? (
                <>
                  <GraficoLinha
                    pontos={acompanhadaAtual.pontos} serie="serie-2" formatarX={formatarDataHoraMs}
                    rotulo="Menor preço a cada consulta"
                  />
                  <TabelaPontos
                    titulo="Menor preço a cada consulta"
                    linhas={acompanhadaAtual.pontos.map((p) => ({ rotulo: formatarDataHoraMs(p.data), preco: p.preco }))}
                  />
                </>
              ) : (
                <p className="text-sm">
                  O gráfico aparece a partir da segunda consulta. Volte mais tarde ou deixe “Atualizar sozinho” ligado.
                </p>
              )}
            </section>
          )}

          {diaSel && (
            <section aria-labelledby="titulo-voos" className="grid gap-3">
              <h2 id="titulo-voos" className="text-lg font-semibold">
                Voos com ida em {formatarData(diaSel.data)}
              </h2>
              {diaSel.voos.length > 0 ? (
                <ListaVoos voos={diaSel.voos} idaEVolta={resposta.busca.diasViagem !== null} />
              ) : (
                <p className="rounded-xl border border-dashed border-borda p-4 text-texto-secundario">
                  {diaSel.erro ? "Não foi possível buscar esta data." : "Nenhum voo nesta data com esses filtros."}
                </p>
              )}
            </section>
          )}
        </div>
      )}

      <footer className="pt-4 text-sm text-texto-secundario">
        Preços por pessoa, em reais, vindos do Google Flights pela SerpApi. Confirme sempre no site da companhia antes de comprar.
      </footer>
    </main>
  );
}
