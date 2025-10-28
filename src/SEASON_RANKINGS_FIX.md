# Season Rankings Fix

## Problema Identificado

O site mostrava "No data available for Fall 2025" porque:

1. **Cron job estava sincronizando a temporada errada**: O cron estava configurado para sincronizar `winter 2025` por padrão, mas a página estava buscando `fall 2025`
2. **Múltiplas instâncias do Supabase client**: A página estava criando uma nova instância ao invés de usar a singleton
3. **Logs de debug excessivos**: Muitos logs confusos durante desenvolvimento

## Correções Aplicadas

### 1. Cron Job Atualizado (`/supabase/migrations/20241027000004_update_cron_with_config.sql`)
```sql
-- Antes (sincronizava winter 2025 por padrão):
body := jsonb_build_object(
  'sync_type', 'season_rankings'
)

-- Depois (sincroniza fall 2025 explicitamente):
body := jsonb_build_object(
  'sync_type', 'season_rankings',
  'season', 'fall',
  'year', 2025
)
```

### 2. Corrigido Múltiplas Instâncias do Supabase Client
- Removido a criação de nova instância na página
- Agora usa apenas a instância singleton de `/services/supabase.ts`

### 3. Logs de Debug Limpos
- Removidos logs excessivos durante o carregamento
- Mantidos apenas logs essenciais para monitoramento

### 4. Mensagem de Erro Melhorada
- Removido botão de "Manual Sync" (não faz sentido para usuários finais)
- Mensagem clara: "The Fall 2025 season rankings are being synced automatically"
- Botão simples de "Refresh Page"

## Como Funciona Agora

1. **Cron job roda a cada 10 minutos** sincronizando Fall 2025 automaticamente
2. **Dados são públicos** no Supabase (RLS habilitado para leitura anon)
3. **Usuários apenas visualizam** os dados já sincronizados
4. **Primeira visita pode não ter dados** - aguardar o primeiro sync do cron

## Para Desenvolvedores

Se precisar sincronizar manualmente durante desenvolvimento:

```bash
# Via curl
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/sync-anime-data \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sync_type":"season_rankings","season":"fall","year":2025}'
```

Ou via console do navegador:
```javascript
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/sync-anime-data', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sync_type: 'season_rankings',
    season: 'fall',
    year: 2025
  })
});
console.log(await response.json());
```

## Verificar Status

Para verificar se o cron está rodando:
```sql
-- Ver jobs agendados
SELECT * FROM cron.job;

-- Ver logs de sync
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;

-- Ver dados sincronizados
SELECT season, year, COUNT(*) 
FROM season_rankings 
GROUP BY season, year;
```
