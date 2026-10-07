import { test } from "node:test";
import assert from "node:assert/strict";
import { datasNoIntervalo, filtrarVoos, lerBusca, paramEscalas, passaNasEscalas, somarDias } from "./filtros.ts";
import { normalizarResposta } from "./serpapi.ts";
import type { Busca, Voo } from "./tipos.ts";

const voo = (preco: number, escalas: number, partida: string): Voo => ({
  preco, escalas, partida, chegada: "", duracaoMin: 600, companhias: ["X"], trechos: [], conexoes: [],
});

test("lista as datas do intervalo, inclusive", () => {
  assert.deepEqual(datasNoIntervalo("2026-12-30", "2027-01-02"), ["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
  assert.equal(somarDias("2026-02-27", 3), "2026-03-02");
});

test("escalas: max 3 quer dizer sem limite", () => {
  assert.equal(passaNasEscalas(voo(1, 4, ""), 1, 3), true);
  assert.equal(passaNasEscalas(voo(1, 0, ""), 1, 3), false);
  assert.equal(passaNasEscalas(voo(1, 2, ""), 0, 1), false);
  assert.deepEqual([0, 1, 2, 3].map(paramEscalas), [1, 2, 3, 0]);
});

test("filtra por horário e escalas e ordena pelo preço", () => {
  const voos = [voo(900, 1, "2026-11-01 07:00"), voo(500, 0, "2026-11-01 22:00"), voo(700, 0, "2026-11-01 09:30")];
  const r = filtrarVoos(voos, { periodo: "manha", escalasMin: 0, escalasMax: 3 });
  assert.deepEqual(r.map((v) => v.preco), [700, 900]);
  const diretos = filtrarVoos(voos, { periodo: "qualquer", escalasMin: 0, escalasMax: 0 });
  assert.deepEqual(diretos.map((v) => v.preco), [500, 700]);
});

test("valida a busca", () => {
  const ok = lerBusca(new URLSearchParams("origem=gru&destino=lis&dataInicio=2026-11-01&dataFim=2026-11-03"), "2026-10-07");
  assert.ok("busca" in ok && ok.busca.origem === "GRU" && ok.busca.diasViagem === null);
  const longo = lerBusca(new URLSearchParams("origem=GRU&destino=LIS&dataInicio=2026-11-01&dataFim=2026-11-20"), "2026-10-07");
  assert.ok("erro" in longo);
  const passado = lerBusca(new URLSearchParams("origem=GRU&destino=LIS&dataInicio=2026-10-01"), "2026-10-07");
  assert.ok("erro" in passado);
  const escalas = lerBusca(new URLSearchParams("origem=GRU&destino=LIS&dataInicio=2026-11-01&escalasMin=2&escalasMax=1"), "2026-10-07");
  assert.ok("erro" in escalas);
});

test("normaliza a resposta da API", () => {
  const busca: Busca = {
    origem: "GRU", destino: "LIS", dataInicio: "2026-11-01", dataFim: "2026-11-01",
    periodo: "qualquer", escalasMin: 0, escalasMax: 3, diasViagem: null,
  };
  const r = normalizarResposta({
    best_flights: [{
      price: 3200, total_duration: 700, layovers: [{ id: "MAD" }],
      flights: [
        { airline: "Iberia", flight_number: "IB 1", departure_airport: { id: "GRU", time: "2026-11-01 18:00" }, arrival_airport: { id: "MAD", time: "2026-11-02 08:00" }, duration: 600 },
        { airline: "Iberia", flight_number: "IB 2", departure_airport: { id: "MAD", time: "2026-11-02 10:00" }, arrival_airport: { id: "LIS", time: "2026-11-02 10:20" }, duration: 80 },
      ],
    }],
    other_flights: [{ price: 2900, flights: [{ airline: "TAP", departure_airport: { id: "GRU", time: "2026-11-01 23:00" }, arrival_airport: { id: "LIS", time: "2026-11-02 12:00" }, duration: 600 }] }],
    price_insights: { price_level: "low", typical_price_range: [3000, 4000], price_history: [[1759000000, 3500]] },
  }, busca, "2026-11-01");
  assert.equal(r.menorPreco, 2900);
  assert.equal(r.voos[1].escalas, 1);
  assert.deepEqual(r.voos[1].conexoes, ["MAD"]);
  assert.equal(r.nivelPreco, "baixo");
  assert.equal(r.historico[0].data, 1759000000000);
});
