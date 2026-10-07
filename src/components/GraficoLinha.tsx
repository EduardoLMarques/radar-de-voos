"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { useLargura } from "@/hooks/useLargura";
import { marcasEixo } from "@/lib/escala";
import { formatarPreco, formatarPrecoCurto } from "@/lib/formato";
import type { PontoHistorico } from "@/lib/voos/tipos";

type Props = {
  pontos: PontoHistorico[];
  rotulo: string; // nome do gráfico para o leitor de tela
  formatarX: (ms: number) => string;
  /** Faixa de preço "normal" desenhada como uma banda de fundo. */
  faixa?: [number, number] | null;
  serie?: "serie-1" | "serie-2";
};

const ALTURA = 240;
const M = { topo: 16, base: 28, esq: 72, dir: 16 };

/** Linha de preço ao longo do tempo, com mira que segue o ponteiro (ou as setas do teclado). */
export function GraficoLinha({ pontos, rotulo, formatarX, faixa, serie = "serie-1" }: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  const [indice, setIndice] = useState<number | null>(null);
  if (pontos.length < 2) return null;

  const precos = pontos.map((p) => p.preco);
  const valores = faixa ? [...precos, ...faixa] : precos;
  const marcas = marcasEixo(Math.min(...valores), Math.max(...valores));
  const yMin = marcas[0];
  const yMax = marcas[marcas.length - 1];
  const t0 = pontos[0].data;
  const t1 = pontos[pontos.length - 1].data;
  const x = (t: number) => M.esq + ((t - t0) / (t1 - t0 || 1)) * (largura - M.esq - M.dir);
  const y = (v: number) => M.topo + (ALTURA - M.topo - M.base) * (1 - (v - yMin) / (yMax - yMin || 1));
  const caminho = pontos.map((p, i) => `${i ? "L" : "M"}${x(p.data).toFixed(1)},${y(p.preco).toFixed(1)}`).join(" ");
  const area = `${caminho} L${x(t1)},${y(yMin)} L${x(t0)},${y(yMin)} Z`;
  const ultimo = pontos[pontos.length - 1];
  const menor = pontos.reduce((a, b) => (b.preco < a.preco ? b : a));
  const ativo = indice !== null ? pontos[indice] : null;
  const cor = serie === "serie-1" ? "stroke-serie-1" : "stroke-serie-2";
  const preenchimento = serie === "serie-1" ? "fill-serie-1" : "fill-serie-2";

  // Marcas do eixo X: começo, meio e fim.
  const marcasX = [pontos[0], pontos[Math.floor(pontos.length / 2)], ultimo];

  function mover(e: PointerEvent<SVGSVGElement>) {
    const caixa = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - caixa.left;
    let melhor = 0;
    pontos.forEach((p, i) => {
      if (Math.abs(x(p.data) - px) < Math.abs(x(pontos[melhor].data) - px)) melhor = i;
    });
    setIndice(melhor);
  }

  function teclado(e: KeyboardEvent<SVGSVGElement>) {
    const atual = indice ?? pontos.length - 1;
    const novo =
      e.key === "ArrowLeft" ? atual - 1 : e.key === "ArrowRight" ? atual + 1 : e.key === "Home" ? 0 : e.key === "End" ? pontos.length - 1 : null;
    if (novo === null) return;
    e.preventDefault();
    setIndice(Math.max(0, Math.min(pontos.length - 1, novo)));
  }

  return (
    <div ref={ref} className="relative">
      <svg
        width={largura} height={ALTURA} tabIndex={0} role="img"
        aria-label={`${rotulo}. Use as setas para percorrer os pontos.`}
        className="block touch-pan-y rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
        onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setIndice(null)}
        onKeyDown={teclado} onFocus={() => setIndice(pontos.length - 1)} onBlur={() => setIndice(null)}
      >
        {faixa && (
          <rect
            x={M.esq} width={largura - M.esq - M.dir} y={y(faixa[1])} height={Math.max(0, y(faixa[0]) - y(faixa[1]))}
            className="fill-realce" opacity={0.6}
          />
        )}
        {marcas.map((m) => (
          <g key={m}>
            <line x1={M.esq} x2={largura - M.dir} y1={y(m)} y2={y(m)} className="stroke-borda-suave" strokeWidth={1} />
            <text x={M.esq - 8} y={y(m)} dy="0.32em" textAnchor="end" className="tabular fill-texto-secundario text-xs">
              {formatarPrecoCurto(m)}
            </text>
          </g>
        ))}
        {marcasX.map((p, i) => (
          <text
            key={i} x={x(p.data)} y={ALTURA - 8} className="fill-texto-secundario text-xs"
            textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
          >
            {formatarX(p.data)}
          </text>
        ))}
        <path d={area} className={preenchimento} opacity={0.1} />
        <path d={caminho} fill="none" className={cor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Rótulos só no menor ponto e no último (o mais recente). */}
        {[menor, ultimo].map((p, i) =>
          i === 1 && p === menor ? null : (
            <g key={i}>
              <circle cx={x(p.data)} cy={y(p.preco)} r={4} className={`${preenchimento} stroke-superficie`} strokeWidth={2} />
              <text
                x={x(p.data)} y={y(p.preco) + (i === 0 ? 18 : -10)}
                textAnchor={x(p.data) > largura - 60 ? "end" : x(p.data) < M.esq + 40 ? "start" : "middle"}
                className="tabular fill-texto text-xs font-semibold"
              >
                {i === 0 ? `menor: ${formatarPrecoCurto(p.preco)}` : formatarPrecoCurto(p.preco)}
              </text>
            </g>
          ),
        )}
        {ativo && (
          <g pointerEvents="none">
            <line x1={x(ativo.data)} x2={x(ativo.data)} y1={M.topo} y2={ALTURA - M.base} className="stroke-borda" strokeWidth={1} />
            <circle cx={x(ativo.data)} cy={y(ativo.preco)} r={5} className={`${preenchimento} stroke-superficie`} strokeWidth={2} />
          </g>
        )}
      </svg>
      {ativo && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute top-0 z-10 rounded-lg border border-borda-suave bg-superficie px-3 py-2 text-sm shadow-lg"
          style={{ left: Math.min(largura - 150, Math.max(0, x(ativo.data) + 12)), width: 150 }}
        >
          <p className="tabular font-semibold text-texto">{formatarPreco(ativo.preco)}</p>
          <p className="text-texto-secundario">{formatarX(ativo.data)}</p>
        </div>
      )}
    </div>
  );
}
