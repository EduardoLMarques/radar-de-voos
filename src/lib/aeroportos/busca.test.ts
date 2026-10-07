import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buscarAeroportos, prepararAeroportos, type LinhaAeroporto } from "./busca.ts";

const linhas = JSON.parse(readFileSync(new URL("../../data/aeroportos.json", import.meta.url), "utf8")) as LinhaAeroporto[];
const base = prepararAeroportos(linhas);
const buscar = (q: string) => buscarAeroportos(base, q);

test("busca pela cidade em português e oferece todos os aeroportos", () => {
  const r = buscar("sao paulo");
  assert.equal(r[0].tipo, "cidade");
  assert.equal(r[0].titulo, "São Paulo, Brasil");
  assert.ok(r[0].codigos.includes("GRU") && r[0].codigos.includes("CGH"));
});

test("aceita o nome traduzido: Lisboa, Londres, Nova York", () => {
  assert.ok(buscar("Lisboa").some((o) => o.codigos[0] === "LIS"));
  const londres = buscar("londres")[0];
  assert.equal(londres.tipo, "cidade");
  assert.ok(londres.codigos.includes("LHR") && !londres.codigos.includes("YXU"));
  assert.ok(buscar("nova york")[0].codigos.includes("JFK"));
});

test("código exato vem primeiro", () => {
  const r = buscar("gig");
  assert.deepEqual(r[0].codigos, ["GIG"]);
});

test("acha pelo nome do aeroporto e ignora textos curtos", () => {
  assert.ok(buscar("guarulhos").some((o) => o.codigos[0] === "GRU"));
  assert.deepEqual(buscar("a"), []);
});
