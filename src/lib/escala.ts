/** Marcas "redondas" para o eixo Y (ex.: 2.000, 2.500, 3.000), cobrindo o intervalo [min, max]. */
export function marcasEixo(min: number, max: number, quantas = 4): number[] {
  if (min === max) {
    min = min * 0.9;
    max = max * 1.1 || 1;
  }
  const bruto = (max - min) / quantas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto) ?? bruto;
  const inicio = Math.floor(min / passo) * passo;
  const marcas: number[] = [];
  for (let v = inicio; v <= max + passo * 0.999; v += passo) marcas.push(Math.round(v));
  return marcas;
}
