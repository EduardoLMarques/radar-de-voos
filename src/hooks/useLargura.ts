"use client";

import { useEffect, useRef, useState } from "react";

/** Mede a largura de um elemento e acompanha quando ela muda (para o gráfico se ajustar à tela). */
export function useLargura<T extends HTMLElement>(inicial = 600) {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(inicial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setLargura(Math.max(260, Math.floor(e.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, largura] as const;
}
