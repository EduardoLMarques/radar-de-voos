// Gera src/data/aeroportos.json a partir da base do OurAirports (pacote airports-json, domínio público).
// Fica só com aeroportos que têm código IATA e voos comerciais regulares.
// Rode com: npm run gerar:aeroportos
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const lista = require("airports-json/data/airports.json");

const vistos = new Set();
const aeroportos = lista
  .filter((a) => a.scheduled_service === "yes" && /^[A-Z]{3}$/.test(a.iata_code ?? ""))
  .filter((a) => !vistos.has(a.iata_code) && vistos.add(a.iata_code))
  // [código, nome, cidade, país (ISO), 1 se for aeroporto grande]
  .map((a) => [a.iata_code, a.name.trim(), (a.municipality || a.name).trim(), a.iso_country, a.type === "large_airport" ? 1 : 0])
  .sort((x, y) => x[0].localeCompare(y[0]));

writeFileSync(new URL("../src/data/aeroportos.json", import.meta.url), JSON.stringify(aeroportos));
console.log(`${aeroportos.length} aeroportos gravados.`);
