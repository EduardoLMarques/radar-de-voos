"use client";

import { useState, type FormEvent } from "react";
import { AEROPORTOS } from "@/lib/aeroportos";
import { MAX_DIAS, ROTULO_PERIODO, datasNoIntervalo, somarDias } from "@/lib/voos/filtros";
import type { Busca, Periodo } from "@/lib/voos/tipos";

type Props = {
  inicial: Busca;
  hoje: string;
  carregando: boolean;
  onBuscar: (busca: Busca) => void;
};

const campo =
  "min-h-11 w-full rounded-lg border border-borda bg-superficie px-3 text-base text-texto " +
  "hover:bg-superficie-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco " +
  "disabled:bg-desabilitado disabled:text-texto-desabilitado aria-invalid:border-erro";
const rotulo = "mb-1 block text-sm font-medium text-texto";

const OPCOES_MIN = [0, 1, 2];
const OPCOES_MAX = [0, 1, 2, 3];
const nomeEscalas = (n: number, max = false) =>
  n === 0 ? "Nenhuma (direto)" : max && n === 3 ? "Sem limite" : n === 1 ? "1 escala" : "2 escalas";

export function FormularioBusca({ inicial, hoje, carregando, onBuscar }: Props) {
  const [f, setF] = useState(inicial);
  const [tentou, setTentou] = useState(false);
  const definir = <K extends keyof Busca>(k: K, v: Busca[K]) => setF((atual) => ({ ...atual, [k]: v }));

  const erros: Partial<Record<keyof Busca, string>> = {};
  if (!/^[A-Z]{3}$/.test(f.origem)) erros.origem = "Use o código de 3 letras do aeroporto, ex.: GRU.";
  if (!/^[A-Z]{3}$/.test(f.destino)) erros.destino = "Use o código de 3 letras do aeroporto, ex.: LIS.";
  else if (f.destino === f.origem) erros.destino = "O destino precisa ser diferente da origem.";
  if (!f.dataInicio || f.dataInicio < hoje) erros.dataInicio = "Escolha uma data de hoje em diante.";
  if (!f.dataFim || f.dataFim < f.dataInicio) erros.dataFim = "A data final não pode vir antes da inicial.";
  else if (datasNoIntervalo(f.dataInicio, f.dataFim).length > MAX_DIAS)
    erros.dataFim = `No máximo ${MAX_DIAS} dias por busca (cada dia gasta uma consulta).`;
  if (f.escalasMin > f.escalasMax) erros.escalasMin = "O mínimo não pode passar do máximo.";
  if (f.diasViagem !== null && !(f.diasViagem >= 1 && f.diasViagem <= 60)) erros.diasViagem = "Entre 1 e 60 dias.";
  const valido = Object.keys(erros).length === 0;
  const erro = (k: keyof Busca) => (tentou ? erros[k] : undefined);

  function enviar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);
    if (valido) onBuscar(f);
  }

  const msgErro = (k: keyof Busca) =>
    erro(k) ? (
      <p id={`erro-${k}`} className="mt-1 text-sm text-erro">
        {erro(k)}
      </p>
    ) : null;
  const aria = (k: keyof Busca) => ({
    "aria-invalid": erro(k) ? true : undefined,
    "aria-describedby": erro(k) ? `erro-${k}` : undefined,
  });

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 rounded-2xl bg-superficie p-4 sm:p-6" aria-label="Buscar voos">
      <datalist id="aeroportos">
        {AEROPORTOS.map((a) => (
          <option key={a.codigo} value={a.codigo}>
            {a.nome}
          </option>
        ))}
      </datalist>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="origem" className={rotulo}>De onde</label>
          <input
            id="origem" list="aeroportos" autoComplete="off" maxLength={3} placeholder="GRU"
            className={`${campo} uppercase`} value={f.origem} {...aria("origem")}
            onChange={(e) => definir("origem", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
          />
          {msgErro("origem")}
        </div>
        <div>
          <label htmlFor="destino" className={rotulo}>Para onde</label>
          <input
            id="destino" list="aeroportos" autoComplete="off" maxLength={3} placeholder="LIS"
            className={`${campo} uppercase`} value={f.destino} {...aria("destino")}
            onChange={(e) => definir("destino", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
          />
          {msgErro("destino")}
        </div>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium text-texto">
          Datas de ida <span className="font-normal text-texto-secundario">(até {MAX_DIAS} dias)</span>
        </legend>
        <div>
          <label htmlFor="dataInicio" className={rotulo}>A partir de</label>
          <input
            id="dataInicio" type="date" min={hoje} className={campo} value={f.dataInicio} {...aria("dataInicio")}
            onChange={(e) => {
              const v = e.target.value;
              setF((a) => ({ ...a, dataInicio: v, dataFim: !a.dataFim || a.dataFim < v ? v : a.dataFim }));
            }}
          />
          {msgErro("dataInicio")}
        </div>
        <div>
          <label htmlFor="dataFim" className={rotulo}>Até</label>
          <input
            id="dataFim" type="date" min={f.dataInicio || hoje}
            max={f.dataInicio ? somarDias(f.dataInicio, MAX_DIAS - 1) : undefined}
            className={campo} value={f.dataFim} {...aria("dataFim")}
            onChange={(e) => definir("dataFim", e.target.value)}
          />
          {msgErro("dataFim")}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-texto">Tipo de viagem</legend>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {[
            { v: false, t: "Só ida" },
            { v: true, t: "Ida e volta" },
          ].map((o) => (
            <label key={o.t} className="flex min-h-11 cursor-pointer items-center gap-2 text-base">
              <input
                type="radio" name="tipo" className="size-5 accent-destaque"
                checked={(f.diasViagem !== null) === o.v}
                onChange={() => definir("diasViagem", o.v ? 7 : null)}
              />
              {o.t}
            </label>
          ))}
          {f.diasViagem !== null && (
            <div className="flex items-center gap-2">
              <label htmlFor="diasViagem" className="text-base">Volta depois de</label>
              <input
                id="diasViagem" type="number" min={1} max={60} inputMode="numeric"
                className={`${campo} w-20`} value={f.diasViagem} {...aria("diasViagem")}
                onChange={(e) => definir("diasViagem", e.target.value === "" ? 0 : Number(e.target.value))}
              />
              <span className="text-base">dias</span>
            </div>
          )}
        </div>
        {msgErro("diasViagem")}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="periodo" className={rotulo}>Horário de partida</label>
          <select
            id="periodo" className={campo} value={f.periodo}
            onChange={(e) => definir("periodo", e.target.value as Periodo)}
          >
            {(Object.keys(ROTULO_PERIODO) as Periodo[]).map((p) => (
              <option key={p} value={p}>{ROTULO_PERIODO[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="escalasMin" className={rotulo}>Escalas: mínimo</label>
          <select
            id="escalasMin" className={campo} value={f.escalasMin} {...aria("escalasMin")}
            onChange={(e) => definir("escalasMin", Number(e.target.value))}
          >
            {OPCOES_MIN.map((n) => <option key={n} value={n}>{nomeEscalas(n)}</option>)}
          </select>
          {msgErro("escalasMin")}
        </div>
        <div>
          <label htmlFor="escalasMax" className={rotulo}>Escalas: máximo</label>
          <select
            id="escalasMax" className={campo} value={f.escalasMax}
            onChange={(e) => definir("escalasMax", Number(e.target.value))}
          >
            {OPCOES_MAX.map((n) => <option key={n} value={n}>{nomeEscalas(n, true)}</option>)}
          </select>
        </div>
      </div>

      <button
        type="submit" disabled={carregando} aria-busy={carregando}
        className="min-h-12 rounded-lg bg-destaque px-6 text-base font-semibold text-sobre-destaque hover:bg-destaque-hover
          active:bg-destaque-ativo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco
          disabled:cursor-not-allowed disabled:bg-desabilitado disabled:text-texto-desabilitado sm:justify-self-start"
      >
        {carregando ? "Buscando preços…" : "Buscar menor preço"}
      </button>
    </form>
  );
}
