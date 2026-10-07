# Radar de Voos

Acompanha preços de passagens aéreas e mostra o histórico de preço de um destino.

- **Menor preço** do período, com data, horário, companhia e escalas.
- **Busca por cidade:** digite a cidade (em português ou inglês), o aeroporto, o código ou o país e escolha na lista. Em cidades com mais de um aeroporto dá para buscar em todos de uma vez.
- **Filtros:** origem, destino, intervalo de datas de ida (até 7 dias), só ida ou ida e volta, horário de partida e escalas mínimas e máximas.
- **Gráfico por data:** o menor preço de cada dia do intervalo. Toque numa data para ver os voos dela.
- **Histórico de preço** da rota nos últimos ~60 dias (dados do Google Flights).
- **Acompanhar:** guarda a busca no navegador e registra o menor preço a cada consulta. Com "Atualizar sozinho", consulta de novo a cada 30 minutos enquanto a página está aberta.

## Dados

Os preços vêm do Google Flights pela [SerpApi](https://serpapi.com/google-flights-api).
Cada data do intervalo gasta uma consulta da cota (o plano grátis tem um limite mensal).
Respostas iguais ficam guardadas por 15 minutos para economizar. O botão "Atualizar agora" ignora esse cache.

Sem a chave, o app mostra **preços de exemplo** (inventados), só para ver a tela funcionando.

## Rodar

```bash
cp .env.example .env.local   # e cole sua chave em SERPAPI_KEY
npm install
npm run dev                  # http://localhost:3000
```

Outros comandos: `npm run build`, `npm run lint`, `npm test`.

Na Vercel, cadastre `SERPAPI_KEY` em Settings → Environment Variables.

## Onde fica cada coisa

- `src/lib/voos/serpapi.ts`: conversa com a SerpApi. Se a API mudar, só este arquivo muda.
- `src/lib/aeroportos/` e `src/data/aeroportos.json`: busca de aeroportos. A base vem do OurAirports (domínio público), só com aeroportos de voo comercial; para atualizar, rode `npm run gerar:aeroportos`. Nomes de cidades em português e apelidos ficam em `nomes-pt.ts`.
- `src/lib/voos/filtros.ts`: regras de filtro e validação da busca (com testes).
- `src/app/api/voos/route.ts`: rota do servidor; a chave nunca vai para o navegador.
- `src/components/`: telas e gráficos. Tokens de design em `src/app/globals.css`.
