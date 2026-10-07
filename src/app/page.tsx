import { connection } from "next/server";
import { RadarDeVoos } from "@/components/RadarDeVoos";

export default async function Home() {
  // A página depende da data de hoje, então é montada a cada visita (e não uma vez só no build).
  await connection();
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return <RadarDeVoos hoje={hoje} />;
}
