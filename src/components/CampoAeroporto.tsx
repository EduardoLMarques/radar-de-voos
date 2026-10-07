"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { OpcaoAeroporto } from "@/lib/aeroportos/busca";

export type AeroportoEscolhido = { codigos: string; rotulo: string };

type Props = {
  id: string;
  rotulo: string;
  placeholder: string;
  valor: AeroportoEscolhido | null;
  onEscolher: (valor: AeroportoEscolhido | null) => void;
  erro?: string;
};

const ESPERA_MS = 200;

/**
 * Campo com sugestões (padrão "combobox" de acessibilidade): a pessoa digita a cidade,
 * o aeroporto, o código ou o país e escolhe na lista com o mouse, o toque ou o teclado.
 */
export function CampoAeroporto({ id, rotulo, placeholder, valor, onEscolher, erro }: Props) {
  const [texto, setTexto] = useState(valor?.rotulo ?? "");
  const [opcoes, setOpcoes] = useState<OpcaoAeroporto[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativa, setAtiva] = useState(-1);
  const [estado, setEstado] = useState<"parado" | "carregando" | "erro">("parado");
  const idLista = useId();
  const pedido = useRef(0);

  // Busca as sugestões um instante depois que a pessoa para de digitar.
  useEffect(() => {
    if (!aberto) return;
    const q = texto.trim();
    const id = ++pedido.current;
    if (q.length < 2) return; // a lista nem aparece com menos de 2 letras
    const t = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/aeroportos?q=${encodeURIComponent(q)}`);
        const json = (await resp.json()) as { opcoes: OpcaoAeroporto[] };
        if (id !== pedido.current) return;
        setOpcoes(json.opcoes);
        setAtiva(json.opcoes.length ? 0 : -1);
        setEstado("parado");
      } catch {
        if (id === pedido.current) setEstado("erro");
      }
    }, ESPERA_MS);
    return () => clearTimeout(t);
  }, [texto, aberto]);

  function escolher(o: OpcaoAeroporto) {
    onEscolher({ codigos: o.codigos.join(","), rotulo: o.rotulo });
    setTexto(o.rotulo);
    setAberto(false);
  }

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!aberto) {
        setAberto(true);
        setEstado("carregando");
      }
      else setAtiva((i) => Math.min(opcoes.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtiva((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && aberto && opcoes[ativa]) {
      e.preventDefault();
      escolher(opcoes[ativa]);
    } else if (e.key === "Escape" && aberto) {
      e.preventDefault();
      setAberto(false);
    }
  }

  const mostrarLista = aberto && texto.trim().length >= 2;
  const idErro = `${id}-erro`;
  const idAjuda = `${id}-ajuda`;

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-texto">
        {rotulo}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-expanded={mostrarLista}
        aria-controls={idLista}
        aria-activedescendant={mostrarLista && ativa >= 0 ? `${idLista}-${ativa}` : undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : idAjuda}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
          setEstado("carregando");
          if (valor) onEscolher(null); // mudou o texto: a escolha anterior deixa de valer
        }}
        onFocus={(e) => e.target.select()}
        onBlur={() => {
          setAberto(false);
          // Saiu do campo sem escolher: se a primeira sugestão bate exatamente com o código digitado, fica com ela.
          const exata = opcoes.find((o) => o.codigos.length === 1 && o.codigos[0] === texto.trim().toUpperCase());
          if (!valor && exata) escolher(exata);
        }}
        onKeyDown={teclado}
        className="min-h-11 w-full rounded-lg border border-borda bg-superficie px-3 text-base text-texto
          placeholder:text-texto-secundario hover:bg-superficie-hover focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-foco aria-invalid:border-erro"
      />
      {erro ? (
        <p id={idErro} className="mt-1 text-sm text-erro">{erro}</p>
      ) : (
        <p id={idAjuda} className="sr-only">Digite a cidade, o aeroporto ou o código e escolha na lista.</p>
      )}

      {mostrarLista && (
        <ul
          id={idLista}
          role="listbox"
          aria-label={`Sugestões para ${rotulo.toLowerCase()}`}
          // Evita que o clique na lista tire o foco do campo antes de escolher.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-lg border border-borda bg-superficie py-1 shadow-lg"
        >
          {estado === "carregando" && opcoes.length === 0 && (
            <li className="px-3 py-3 text-sm text-texto-secundario">Procurando…</li>
          )}
          {estado === "erro" && (
            <li className="px-3 py-3 text-sm text-erro">Não foi possível carregar os aeroportos. Tente digitar de novo.</li>
          )}
          {estado === "parado" && opcoes.length === 0 && (
            <li className="px-3 py-3 text-sm text-texto-secundario">
              Nenhum aeroporto encontrado para “{texto.trim()}”. Tente o nome da cidade.
            </li>
          )}
          {opcoes.map((o, i) => (
            <li
              key={`${o.tipo}-${o.codigos.join()}`}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={i === ativa}
              onClick={() => escolher(o)}
              onMouseMove={() => setAtiva(i)}
              className={`flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 ${i === ativa ? "bg-superficie-hover" : ""}`}
            >
              <span
                className={`tabular w-14 shrink-0 rounded py-0.5 text-center text-xs font-semibold ${
                  o.tipo === "cidade" ? "bg-destaque text-sobre-destaque" : "bg-realce text-texto"
                }`}
              >
                {o.tipo === "cidade" ? "Todos" : o.codigos[0]}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base text-texto">{o.titulo}</span>
                <span className="block truncate text-sm text-texto-secundario">{o.detalhe}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
