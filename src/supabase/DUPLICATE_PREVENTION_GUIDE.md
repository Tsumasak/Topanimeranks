# 🛡️ Guia de Prevenção de Duplicatas

## 📋 Problema Identificado

Animes estavam sendo salvos em **seasons incorretas** na tabela `season_rankings` devido a:

1. **API do MAL retornando dados conflitantes**
   - Ex: Dr. Stone Part 3 aparece em `/seasons/2026/winter` mas tem `aired_from: "2026-04-01"` (Abril = Spring)

2. **Código forçando season/year**
   - O sync anterior forçava todos os animes retornados pela API a serem da season solicitada
   - Não validava se a data `aired_from` realmente correspondia àquela season

3. **Duplicatas criadas**
   - Mesmo anime aparecia em múltiplas seasons (ex: Winter 2026 E Spring 2026)
   - Dados conflitantes entre `season_rankings` e `anticipated_animes`

## ✅ Solução Implementada

### 1. **Validação de Data no Sync** (`sync-season.tsx`)

Adicionada função `validateSeasonMatch()` que:
- Verifica se `aired_from` corresponde à season solicitada
- Mapeia mês → season:
  - Janeiro-Março = Winter
  - Abril-Junho = Spring
  - Julho-Setembro = Summer
  - Outubro-Dezembro = Fall
- **Pula animes "Not yet aired"** com data incorreta
- Registra avisos no log quando encontra inconsistências

**Exemplo de log:**
```
⚠️  PULANDO Dr. Stone Part 3: aired_from=2026-04-01 (month=4, year=2026) não corresponde a winter 2026
```

### 2. **Script de Limpeza** (`CLEANUP_SEASON_DUPLICATES.sql`)

Script SQL em 6 passos para:
1. ✅ Identificar duplicatas
2. ✅ Identificar registros inválidos (season/year não corresponde ao aired_from)
3. ✅ Deletar registros inválidos
4. ✅ Identificar duplicatas sem aired_from
5. ✅ Deletar duplicatas sem aired_from (mantém apenas o mais recente)
6. ✅ Verificação final (deve retornar 0 duplicatas)

## 🚀 Como Usar

### **Passo 1: Limpar Duplicatas Existentes**

1. Acesse o **SQL Editor** do Supabase
2. Abra o arquivo `/supabase/CLEANUP_SEASON_DUPLICATES.sql`
3. Execute cada query **na ordem**, revisando os resultados antes de deletar

**⚠️ IMPORTANTE**: Execute as queries de DELETE apenas DEPOIS de revisar os resultados das queries de SELECT!

### **Passo 2: Re-sync com Validação**

Agora que o código tem validação, você pode rodar o sync novamente:

#### Via Browser (GET endpoint):
```
https://[seu-projeto].supabase.co/functions/v1/make-server-c1d1bfd8/sync-season/winter/2026
```

#### Via Admin Sync:
1. Acesse a página Admin Sync
2. Selecione "Winter 2026"
3. Clique em "Sync Season"

### **Passo 3: Verificar Resultados**

Execute no SQL Editor:
```sql
-- Ver todos os animes de Winter 2026
SELECT 
  anime_id,
  title_english,
  season,
  year,
  aired_from,
  status
FROM season_rankings
WHERE season = 'winter' AND year = 2026
ORDER BY members DESC;

-- Verificar se há duplicatas
SELECT 
  anime_id,
  title_english,
  COUNT(*) as count
FROM season_rankings
GROUP BY anime_id, title_english
HAVING COUNT(*) > 1;
```

## 📊 Regras de Sync Atualizadas

### ✅ **season_rankings** (via `sync-season.tsx`):
- Apenas animes cuja **data** corresponde à season solicitada
- Animes "Not yet aired" são **validados** antes de inserir
- Se aired_from não corresponder → **PULA** (não insere)
- Logs detalhados de animes pulados

### ✅ **anticipated_animes** (via `sync-upcoming.tsx`):
- Preserva season/year originais da API
- Não força season/year
- Mantém animes sem season definida (`null`)

## 🎯 Resultado Esperado

Depois da limpeza e re-sync:

1. ✅ **Sem duplicatas** - Cada anime aparece apenas 1x na `season_rankings` por season/year
2. ✅ **Season correta** - Animes apenas na season correspondente ao `aired_from`
3. ✅ **Dados consistentes** - `anticipated_animes` e `season_rankings` sem conflitos
4. ✅ **Logs claros** - Avisos quando API retorna dados inconsistentes

## 🔍 Monitoramento

Adicione esta query aos seus favoritos para monitorar duplicatas:

```sql
-- Monitoramento diário de duplicatas
SELECT 
  'season_rankings' as table_name,
  anime_id,
  title_english,
  COUNT(*) as count,
  STRING_AGG(season || ' ' || year::text, ', ') as seasons
FROM season_rankings
GROUP BY anime_id, title_english
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'anticipated_animes' as table_name,
  anime_id,
  title_english,
  COUNT(*) as count,
  STRING_AGG(COALESCE(season, 'null') || ' ' || COALESCE(year::text, 'null'), ', ') as seasons
FROM anticipated_animes
GROUP BY anime_id, title_english
HAVING COUNT(*) > 1

ORDER BY count DESC;
```

## 📝 Notas Importantes

1. **Animes "Currently Airing"** não são validados (apenas "Not yet aired")
2. **Animes sem aired_from** não são validados (mas duplicatas são removidas mantendo o mais recente)
3. **MAL API pode mudar dados** - Execute limpeza periodicamente se necessário
4. **Backups automáticos** do Supabase são mantidos por 7 dias

## 🆘 Troubleshooting

**P: Anime ainda aparece em season errada após sync**
- R: Execute o script de limpeza ANTES de rodar o sync novamente

**P: Anime sumiu após limpeza**
- R: Verifique se ele está em outra season ou na tabela `anticipated_animes`

**P: Sync pulou muitos animes**
- R: Isso é esperado! Significa que a validação está funcionando. Verifique os logs para ver quais foram pulados e por quê.

**P: Como reverter se algo der errado?**
- R: Supabase mantém backups automáticos. Use o Dashboard → Database → Backups para restaurar.
