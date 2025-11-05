# 🔍 Weekly Episodes Sync - Debug Guide

## Como o Sistema Funciona

### 1. **Detecção Automática da Semana Atual**
- O sistema agora detecta automaticamente a semana atual baseada na data de hoje
- Week 1 começou em 29 de Setembro de 2025 (Segunda-feira)
- O cron roda **a cada hora** no minuto :00
- Se nenhum `week_number` for passado, o sistema calcula automaticamente

### 2. **Processo de Sincronização**

O sistema segue estes passos:

1. **Busca todos os animes da temporada Fall 2025**
   - Filtra apenas animes com 5.000+ membros no MAL
   - Filtra apenas animes com status "Currently Airing"

2. **Para cada anime**:
   - Busca TODOS os episódios desse anime
   - Procura por UM episódio que aired dentro da semana específica
   - Se encontrar, adiciona esse episódio à lista
   - Garante apenas 1 episódio por anime por semana

3. **Salva no banco de dados**:
   - Usa `UPSERT` com constraint `(anime_id, episode_number, week_number)`
   - Se o episódio já existe → atualiza (ex: score pode ter mudado)
   - Se o episódio NÃO existe → cria novo registro

4. **Recalcula positions**:
   - Ordena todos os episódios da semana por score
   - Atualiza as posições (rank) de cada episódio

## 🎯 Por Que Novos Episódios São Adicionados Durante a Semana

O sistema vai automaticamente adicionar novos animes à lista quando:

1. **Novo anime lança seu primeiro episódio**: 
   - Se um anime ainda não tinha episódio no início da semana, mas lança um episódio no meio da semana
   - Na próxima execução do cron (a cada hora), o sistema vai encontrar esse episódio
   - Um NOVO registro será criado no banco

2. **Episódio existente tem score atualizado**:
   - Se um episódio já está na lista, mas seu score muda
   - O sistema atualiza o registro existente
   - A posição pode mudar após recalcular rankings

## 🔧 Como Testar Manualmente

### Opção 1: Via Supabase Dashboard
```sql
-- Chamar a função de sync para a semana atual
SELECT net.http_post(
  url := (SELECT value FROM app_config WHERE key = 'supabase_url') || '/functions/v1/sync-anime-data',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
  ),
  body := jsonb_build_object('sync_type', 'weekly_episodes'),
  timeout_milliseconds := 90000
) AS request_id;

-- Verificar os logs da resposta
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 5;
```

### Opção 2: Via curl (terminal)
```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/sync-anime-data' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"sync_type": "weekly_episodes"}'
```

### Opção 3: Sync de uma semana específica
```bash
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/sync-anime-data' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"sync_type": "weekly_episodes", "week_number": 5}'
```

## 📊 Logs Importantes

Quando o sync roda, você verá logs como:

```
🚀 Sync anime data function invoked
📅 Auto-detected current week: 5 (based on date: 2025-10-27)
📅 Week 5: 2025-10-27 to 2025-11-02

🔄 Starting to process 45 airing animes for week 5...
📅 Week dates: 2025-10-27T00:00:00.000Z to 2025-11-02T23:59:59.999Z

🔍 Processing: Anime Title (ID: 12345, Members: 50000)
  📺 Found 5 episodes for Anime Title
    EP1: Episode 1 - Aired: 2025-09-29
    EP2: Episode 2 - Aired: 2025-10-06
    EP3: Episode 3 - Aired: 2025-10-13
  ✅ MATCH! EP5 aired on 2025-10-27 (within week range)
  ✅ ADDING TO LIST: Anime Title EP5 "Episode Title" (Aired: 2025-10-27, Score: 8.5)
  ➕ CREATING Anime Title (anime_id: 12345, ep: 5, week: 5)
  ✅ Created: Anime Title

📊 ============================================
📊 Week 5 Processing Summary:
📊 Total airing animes checked: 45
📊 Episodes found for this week: 15
📊 ============================================

✅ ============================================
✅ Week 5 sync completed!
✅ Total episodes in list: 15
✅ NEW episodes created: 10
✅ Existing episodes updated: 5
✅ Duration: 45000ms
✅ ============================================
```

## ❓ Troubleshooting

### Problema: Novos episódios não aparecem

1. **Verifique se o cron está rodando**:
```sql
SELECT * FROM cron.job ORDER BY jobid;
```

2. **Verifique os logs do cron**:
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

3. **Verifique as respostas HTTP**:
```sql
SELECT 
  created,
  status_code,
  content::text 
FROM net._http_response 
ORDER BY created DESC 
LIMIT 5;
```

4. **Verifique os episódios no banco**:
```sql
-- Ver todos os episódios da week 5
SELECT 
  anime_id,
  anime_title_english,
  episode_number,
  episode_score,
  position_in_week,
  aired_at,
  created_at,
  updated_at
FROM weekly_episodes
WHERE week_number = 5
ORDER BY position_in_week;
```

5. **Ver quantos episódios foram criados vs atualizados**:
```sql
-- Episódios criados hoje
SELECT COUNT(*) as created_today
FROM weekly_episodes
WHERE week_number = 5
  AND DATE(created_at) = CURRENT_DATE;

-- Episódios atualizados hoje (mas criados antes)
SELECT COUNT(*) as updated_today
FROM weekly_episodes
WHERE week_number = 5
  AND DATE(updated_at) = CURRENT_DATE
  AND DATE(created_at) < CURRENT_DATE;
```

### Problema: API do Jikan não retorna novos episódios

- A API do Jikan pode ter delay para atualizar dados
- Novos episódios podem demorar algumas horas para aparecer na API
- Verifique manualmente no MAL se o episódio já foi lançado
- O campo `aired` do episódio precisa estar dentro do range da semana

### Problema: Episódios aparecem com data incorreta

- Verifique o timezone - o sistema usa UTC
- Week 5: 2025-10-27 (Monday) to 2025-11-02 (Sunday)
- Um episódio que aired em 2025-10-28 será incluído na week 5
- Um episódio que aired em 2025-10-26 NÃO será incluído (week 4)

## ✅ Checklist de Funcionamento Correto

- [ ] Cron job está ativo e rodando a cada hora
- [ ] Week atual é detectada corretamente (week 5)
- [ ] Novos animes que lançam episódios durante a semana são adicionados
- [ ] Episódios existentes são atualizados se scores mudarem
- [ ] Apenas 1 episódio por anime por semana
- [ ] Positions são recalculadas após cada sync
- [ ] Logs mostram claramente: "NEW episodes created" vs "Existing episodes updated"
