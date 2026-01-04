# 🚨 Quick Fix - 3 Duplicatas Restantes

## 📋 Status Atual

Você encontrou **3 animes duplicados** após a limpeza inicial:

| Anime ID | Título | Duplicatas Encontradas |
|----------|--------|------------------------|
| 59708 | Classroom of the Elite IV | `upcoming 9999` + `spring 2026` |
| 61316 | Re:ZERO Season 4 | `winter 2026` + `spring 2026` |
| 51553 | Witch Hat Atelier | `winter 2026` + `spring 2026` |

## 🔍 Possíveis Causas

### **Caso 1: "upcoming 9999"**
- Anime foi categorizado como "upcoming" com `year = 9999` (placeholder)
- Provavelmente aconteceu quando o anime não tinha `aired_from` definido
- Depois recebeu uma data real e foi re-categorizado como "spring 2026"
- **Solução**: Deletar o registro "upcoming 9999"

### **Caso 2: "winter 2026" + "spring 2026"**
- Mesma situação do Dr. Stone: MAL API retornou em múltiplas seasons
- Sincronizado em Winter 2026 primeiro, depois em Spring 2026
- **Solução**: Verificar `aired_from` e manter apenas o correto

## ✅ Solução Rápida

### **Opção A: Script Automático (Recomendado)**

Abra `/supabase/CLEANUP_SPECIFIC_DUPLICATES.sql` no SQL Editor e execute **NA ORDEM**:

```sql
-- 1. INVESTIGAR (ver detalhes)
PASSO 1

-- 2. IDENTIFICAR (ver quais deletar)
PASSO 2 

-- 3. REVISAR OS RESULTADOS
-- ⚠️ IMPORTANTE: Confirme que a coluna "action" está correta!

-- 4. DELETAR (remover incorretos)
PASSO 3

-- 5. DELETAR sem aired_from (se houver)
PASSO 4

-- 6. VERIFICAR (deve retornar 0 linhas)
PASSO 5

-- 7. VER RESULTADO FINAL
PASSO 6
```

### **Opção B: Delete Manual (Se você já sabe qual deletar)**

#### **Primeiro, identifique os IDs:**
```sql
SELECT 
  id,
  anime_id,
  title_english,
  season,
  year,
  aired_from
FROM season_rankings
WHERE anime_id IN (59708, 61316, 51553)
ORDER BY anime_id, season, year;
```

#### **Exemplo de resultado esperado:**
```
id         | anime_id | title_english              | season   | year | aired_from
-----------+----------+---------------------------+----------+------+--------------------
abc-123... | 59708    | Classroom of the Elite IV | upcoming | 9999 | 2026-04-15 (Abril)
def-456... | 59708    | Classroom of the Elite IV | spring   | 2026 | 2026-04-15 (Abril)
```

**Qual deletar?**
- ❌ `upcoming 9999` → DELETE (season incorreta)
- ✅ `spring 2026` → KEEP (Abril = Spring)

#### **Delete os IDs incorretos:**
```sql
-- Substitua os IDs pelos que você identificou
DELETE FROM season_rankings
WHERE id IN (
  'abc-123...',  -- Classroom of the Elite IV - upcoming 9999
  'ghi-789...',  -- Re:ZERO - season incorreta
  'jkl-012...'   -- Witch Hat Atelier - season incorreta
);
```

## 🎯 Regras de Decisão

Para decidir qual registro **MANTER**:

### **Se aired_from existe:**
```
Janeiro (1), Fevereiro (2), Março (3)       → MANTER: winter
Abril (4), Maio (5), Junho (6)              → MANTER: spring
Julho (7), Agosto (8), Setembro (9)         → MANTER: summer
Outubro (10), Novembro (11), Dezembro (12)  → MANTER: fall
```

### **Se aired_from NÃO existe:**
- Manter o registro com `updated_at` mais recente
- OU manter o com mais `members`

### **Se season = "upcoming" e year = 9999:**
- ❌ **SEMPRE DELETAR** (é um placeholder temporário)

## 🔍 Verificação Detalhada por Anime

Execute esta query para ver os detalhes:

```sql
SELECT 
  anime_id,
  title_english,
  season,
  year,
  aired_from,
  EXTRACT(MONTH FROM aired_from) as month_number,
  CASE 
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 1 AND 3 THEN 'winter'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 4 AND 6 THEN 'spring'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 7 AND 9 THEN 'summer'
    WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 10 AND 12 THEN 'fall'
  END as correct_season,
  CASE 
    WHEN season = 'upcoming' AND year = 9999 THEN '❌ DELETE'
    WHEN aired_from IS NULL THEN '❓ Check updated_at'
    WHEN season = CASE 
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 1 AND 3 THEN 'winter'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 4 AND 6 THEN 'spring'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 7 AND 9 THEN 'summer'
      WHEN EXTRACT(MONTH FROM aired_from) BETWEEN 10 AND 12 THEN 'fall'
    END THEN '✅ KEEP'
    ELSE '❌ DELETE'
  END as action
FROM season_rankings
WHERE anime_id IN (59708, 61316, 51553)
ORDER BY anime_id, season, year;
```

## ✅ Verificação Final

Após executar o delete, confirme que não há mais duplicatas:

```sql
-- Deve retornar 0 linhas
SELECT 
  anime_id,
  title_english,
  COUNT(*) as count
FROM season_rankings
WHERE anime_id IN (59708, 61316, 51553)
GROUP BY anime_id, title_english
HAVING COUNT(*) > 1;

-- Ver o que sobrou (1 registro por anime)
SELECT 
  anime_id,
  title_english,
  season,
  year,
  aired_from
FROM season_rankings
WHERE anime_id IN (59708, 61316, 51553)
ORDER BY anime_id;
```

## 📊 Resultado Esperado

Após a limpeza, você deve ter:

| Anime ID | Título | Season/Year Correto | Baseado em |
|----------|--------|---------------------|------------|
| 59708 | Classroom of the Elite IV | Verificar `aired_from` | Mês da data |
| 61316 | Re:ZERO Season 4 | Verificar `aired_from` | Mês da data |
| 51553 | Witch Hat Atelier | Verificar `aired_from` | Mês da data |

## 🆘 Se Precisar de Ajuda

**Problema**: Não sei qual deletar  
**Solução**: Execute o PASSO 2 do script automático - ele mostra a coluna "action"

**Problema**: aired_from é NULL nos dois registros  
**Solução**: Execute PASSO 4 do script automático - mantém o mais recente

**Problema**: Deletei o registro errado  
**Solução**: Supabase mantém backups por 7 dias. Dashboard → Database → Backups

## 📝 Próximo Passo

Depois de limpar essas 3 duplicatas, execute o **re-sync** para Winter 2026:

```
https://[projeto].supabase.co/functions/v1/make-server-c1d1bfd8/sync-season/winter/2026
```

Isso garantirá que não voltarão duplicatas (graças à validação implementada).
