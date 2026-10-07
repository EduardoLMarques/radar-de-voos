/**
 * A base de aeroportos vem em inglês e sem acentos. Estes mapas dão o nome em português
 * (para mostrar e para buscar). Quem não está aqui aparece com o nome original.
 * Chave: nome original sem acentos e em minúsculas.
 */
export const CIDADES_PT: Record<string, string> = {
  // Brasil
  "sao paulo": "São Paulo", brasilia: "Brasília", florianopolis: "Florianópolis", goiania: "Goiânia",
  belem: "Belém", maceio: "Maceió", "sao luis": "São Luís", vitoria: "Vitória", cuiaba: "Cuiabá",
  macapa: "Macapá", "joao pessoa": "João Pessoa", "foz do iguacu": "Foz do Iguaçu", ilheus: "Ilhéus",
  "rio de janeiro": "Rio de Janeiro", "porto seguro": "Porto Seguro", teresina: "Teresina", aracaju: "Aracaju",
  "ribeirao preto": "Ribeirão Preto", "sao jose do rio preto": "São José do Rio Preto", londrina: "Londrina",
  maringa: "Maringá", chapeco: "Chapecó", "caxias do sul": "Caxias do Sul", "juazeiro do norte": "Juazeiro do Norte",
  "campo grande": "Campo Grande", "porto velho": "Porto Velho", "rio branco": "Rio Branco", "boa vista": "Boa Vista",
  palmas: "Palmas", uberlandia: "Uberlândia", "montes claros": "Montes Claros", jericoacoara: "Jericoacoara",
  "fernando de noronha": "Fernando de Noronha", "sao jose dos campos": "São José dos Campos", navegantes: "Navegantes",
  joinville: "Joinville", "petrolina": "Petrolina", "santarem": "Santarém", "maraba": "Marabá",
  // Mundo
  lisbon: "Lisboa", porto: "Porto", london: "Londres", "new york": "Nova York", rome: "Roma", madrid: "Madri",
  milan: "Milão", munich: "Munique", geneva: "Genebra", zurich: "Zurique", brussels: "Bruxelas", amsterdam: "Amsterdã",
  athens: "Atenas", vienna: "Viena", prague: "Praga", venice: "Veneza", florence: "Florença", naples: "Nápoles",
  "mexico city": "Cidade do México", "panama city": "Cidade do Panamá", beijing: "Pequim", tokyo: "Tóquio",
  "cape town": "Cidade do Cabo", johannesburg: "Joanesburgo", istanbul: "Istambul", moscow: "Moscou",
  copenhagen: "Copenhague", stockholm: "Estocolmo", warsaw: "Varsóvia", edinburgh: "Edimburgo", bogota: "Bogotá",
  asuncion: "Assunção", montevideo: "Montevidéu", philadelphia: "Filadélfia", "new orleans": "Nova Orleans",
  seoul: "Seul", shanghai: "Xangai", berlin: "Berlim", hamburg: "Hamburgo", cologne: "Colônia", seville: "Sevilha",
  marrakech: "Marraquexe", "buenos aires": "Buenos Aires", "santiago": "Santiago", "punta cana": "Punta Cana",
  cancun: "Cancún", "san francisco": "São Francisco", "los angeles": "Los Angeles", "washington": "Washington",
  "bariloche": "Bariloche", "san carlos de bariloche": "Bariloche", cuzco: "Cusco", "faro": "Faro", funchal: "Funchal",
  "ponta delgada": "Ponta Delgada", nice: "Nice", "frankfurt": "Frankfurt", dublin: "Dublin", "dubai": "Dubai",
  "doha": "Doha", "cairo": "Cairo", "havana": "Havana", "lima": "Lima", "quito": "Quito", "caracas": "Caracas",
  "toronto": "Toronto", "montreal": "Montreal", "vancouver": "Vancouver", "sydney": "Sydney", "barcelona": "Barcelona",
  "paris": "Paris", "orlando": "Orlando", "miami": "Miami", "boston": "Boston", "chicago": "Chicago",
  "las vegas": "Las Vegas", "bangkok": "Bangcoc", "singapore": "Singapura", "hong kong": "Hong Kong",
  "new delhi": "Nova Délhi", "tel aviv": "Tel Aviv", "jerusalem": "Jerusalém", "luanda": "Luanda", "maputo": "Maputo",
  "praia": "Praia", "mendoza": "Mendoza", "cordoba": "Córdoba", "rosario": "Rosário", "punta del este": "Punta del Este",
};


/** Apelidos que também encontram a cidade. Chave: nome original sem acentos e em minúsculas. */
export const APELIDOS: Record<string, string[]> = {
  "sao paulo": ["sampa", "sp"],
  "rio de janeiro": ["rj"],
  "belo horizonte": ["bh"],
  "florianopolis": ["floripa"],
  "brasilia": ["df"],
  "new york": ["ny", "nyc", "nova iorque"],
  "los angeles": ["la"],
  "foz do iguacu": ["foz"],
};
