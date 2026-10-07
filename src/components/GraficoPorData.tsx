"use client";

import { useState } from "react";
import { useLargura } from "@/hooks/useLargura";
import { marcasEixo } from "@/lib/escala";
import { formatarData, formatarDataCurta, formatarPreco, formatarPrecoCurto } from "@/lib/formato";
import type { ResultadoDia } from "@/lib/voos/tipos";

type Props = {
  dias: ResultadoDia[];
  selecionada: string;
  onSelecionar: (data: string) => void;
};

const ALTURA = 220;
const M = { topo: 24, base: 28, esq: 72, dir: 8 };

/** Colunas com o menor preço de cada data de ida. Clicar numa coluna mostra os voos daquela data. */
export function GraficoPorData({ dias, selecionada, onSelecionar }: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  const [foco, setFoco] = useState<string | null>(null);
  const precos = dias.map((d) => d.menorPreco).filter((p): p is number => p !== null);
  if (precos.length === 0) return null;

  const minimo = Math.min(...precos);
  const marcas = marcasEixo(0, Math.max(...precos));
  const topoEixo = marcas[marcas.length - 1];
  const areaAlt = ALTURA - M.topo - M.base;
  const y = (v: number) => M.topo + areaAlt * (1 - v / topoEixo);
  const faixa = (largura - M.esq - M.dir) / dias.length;
  const barra = Math.min(24, faixa * 0.6);
  const ativo = dias.find((d) => d.data === foco);

  return (
    <div ref={ref} className="relative">
      <svg width={largura} height={ALTURA} role="group" aria-label="Menor preço por data de ida" className="block">
        {marcas.map((m) => (
          <g key={m}>
            <line x1={M.esq} x2={largura - M.dir} y1={y(m)} y2={y(m)} className="stroke-borda-suave" strokeWidth={1} />
            <text x={M.esq - 8} y={y(m)} dy="0.32em" textAnchor="end" className="tabular fill-texto-secundario text-xs">
              {formatarPrecoCurto(m)}
            </text>
          </g>
        ))}
        {dias.map((d, i) => {
          const cx = M.esq + faixa * (i + 0.5);
          const sel = d.data === selecionada;
          const rotulo =
            d.menorPreco === null
              ? `${formatarData(d.data)}: ${d.erro ? "erro na busca" : "sem voos com esses filtros"}`
              : `${formatarData(d.data)}: a partir de ${formatarPreco(d.menorPreco)}${d.menorPreco === minimo ? ", o menor preço" : ""}`;
          return (
            <g
              key={d.data}
              role="button"
              tabIndex={0}
              aria-label={rotulo}
              aria-pressed={sel}
              className="cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-foco"
              onClick={() => onSelecionar(d.data)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelecionar(d.data);
                }
              }}
              onPointerEnter={() => setFoco(d.data)}
              onPointerLeave={() => setFoco(null)}
              onFocus={() => setFoco(d.data)}
              onBlur={() => setFoco(null)}
            >
              {/* Área de toque maior que a barra, com fundo quando selecionada. */}
              <rect
                x={cx - faixa / 2 + 1} y={M.topo - 20} width={faixa - 2} height={areaAlt + 20 + M.base}
                rx={6} strokeWidth={2}
                className={sel ? "fill-realce stroke-transparent" : "fill-transparent stroke-transparent hover:fill-superficie-hover"}
              />
              {d.menorPreco !== null ? (
                <>
                  <path
                    d={colunaArredondada(cx - barra / 2, y(d.menorPreco), barra, y(0) - y(d.menorPreco))}
                    className={d.menorPreco === minimo ? "fill-serie-1" : "fill-serie-1 opacity-60"}
                  />
                  {d.menorPreco === minimo && (
                    <text x={cx} y={y(d.menorPreco) - 6} textAnchor="middle" className="tabular fill-texto text-xs font-semibold">
                      {formatarPrecoCurto(d.menorPreco)}
                    </text>
                  )}
                </>
              ) : (
                <text x={cx} y={y(0) - 6} textAnchor="middle" className="fill-texto-secundario text-xs" aria-hidden>
                  –
                </text>
              )}
              <text
                x={cx} y={ALTURA - 8} textAnchor="middle" aria-hidden
                className={`tabular text-xs ${sel ? "fill-texto font-semibold" : "fill-texto-secundario"}`}
              >
                {formatarDataCurta(d.data)}
              </text>
            </g>
          );
        })}
        <line x1={M.esq} x2={largura - M.dir} y1={y(0)} y2={y(0)} className="stroke-borda" strokeWidth={1} />
      </svg>
      {ativo && (
        <div
          role="presentation"
          className="pointer-events-none absolute top-0 z-10 rounded-lg border border-borda-suave bg-superficie px-3 py-2 text-sm shadow-lg"
          style={{
            left: Math.min(largura - 170, Math.max(0, M.esq + faixa * (dias.indexOf(ativo) + 0.5) - 85)),
            width: 170,
          }}
        >
          <p className="tabular font-semibold text-texto">
            {ativo.menorPreco !== null ? formatarPreco(ativo.menorPreco) : ativo.erro ? "Erro na busca" : "Sem voos"}
          </p>
          <p className="text-texto-secundario">{formatarData(ativo.data)}</p>
        </div>
      )}
    </div>
  );
}

/** Coluna com o topo arredondado (4px) e a base reta. */
function colunaArredondada(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}
