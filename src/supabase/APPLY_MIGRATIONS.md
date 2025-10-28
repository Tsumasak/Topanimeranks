# Como Aplicar as Migrations do Supabase

## Problema: "No dates in weekData"

Se você está vendo o erro `[WeekControl] No dates in weekData, using config fallback`, isso significa que as colunas `week_start_date` e `week_end_date` não existem na tabela `weekly_episodes`.

## ⚡ Solução Rápida (Recomendada)

1. Acesse o Supabase Dashboard do seu projeto
2. Vá para **Database** > **SQL Editor**
3. Copie e cole o conteúdo do arquivo **[QUICK_FIX_DATES.sql](./QUICK_FIX_DATES.sql)**
4. Execute a query (clique em "Run")
5. Verifique se as datas aparecem na saída da query
6. Recarregue a página do site

**Pronto!** O erro deve desaparecer.

---

## Solução Detalhada: Aplicar a Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard do seu projeto
2. Vá para **Database** > **SQL Editor**
3. Copie e cole o conteúdo do arquivo `/supabase/migrations/20241028000005_add_week_dates.sql`
4. Execute a query

### Opção 2: Via CLI (se você tiver o Supabase CLI instalado)

```bash
# No diretório raiz do projeto
supabase db push
```

Ou execute a migration específica:

```bash
supabase migration up
```

## Conteúdo da Migration

```sql
-- ============================================
-- ADD WEEK DATE COLUMNS TO WEEKLY_EPISODES
-- ============================================

-- Add week_start_date and week_end_date columns
ALTER TABLE weekly_episodes
ADD COLUMN IF NOT EXISTS week_start_date DATE,
ADD COLUMN IF NOT EXISTS week_end_date DATE;

-- Update existing records to populate these dates based on week_number
-- Week 1 starts on September 29, 2025
UPDATE weekly_episodes
SET 
  week_start_date = DATE '2025-09-29' + ((week_number - 1) * 7),
  week_end_date = DATE '2025-09-29' + ((week_number - 1) * 7) + 6
WHERE week_start_date IS NULL OR week_end_date IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_episodes_dates ON weekly_episodes(week_start_date, week_end_date);

-- Add comment
COMMENT ON COLUMN weekly_episodes.week_start_date IS 'Start date of the week (Monday)';
COMMENT ON COLUMN weekly_episodes.week_end_date IS 'End date of the week (Sunday)';
```

## Verificar se a Migration Foi Aplicada

Execute no SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'weekly_episodes' 
  AND column_name IN ('week_start_date', 'week_end_date');
```

Você deve ver 2 linhas retornadas:
- `week_start_date` (DATE)
- `week_end_date` (DATE)

## Após Aplicar a Migration

1. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
2. Recarregue a página
3. O erro deve desaparecer e as datas devem aparecer corretamente

## Nota Importante

Esta migration:
- ✅ É segura e pode ser executada múltiplas vezes (usa `IF NOT EXISTS`)
- ✅ Popula automaticamente as datas para registros existentes
- ✅ Cria índices para melhorar performance
- ✅ Não apaga dados existentes
