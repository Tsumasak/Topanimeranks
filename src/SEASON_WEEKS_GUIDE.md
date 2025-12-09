# Guia de Implementação do Sistema de Seasons e Weeks

## 📋 O que foi implementado

Foi criado um sistema completo de cálculo de `week_number` baseado em **seasons** (Winter, Spring, Summer, Fall) ao invés de weeks acumuladas desde o início do anime.

### Antes ❌
- `week_number` era calculado como semanas acumuladas desde 29/09/2025
- Episódio 1: Week 1, Episódio 10: Week 10, etc.
- Não considerava a season atual do anime

### Agora ✅
- `week_number` é calculado baseado na **season** do episódio
- Fall 2025 Week 1 = 1ª semana de Outubro 2025
- Winter 2026 Week 1 = 1ª semana de Janeiro 2026
- Cada season tem suas próprias weeks (1-15)

## 🛠️ O que foi alterado

### 1. Utilitários de Season criados
- `/utils/seasons.ts` (frontend)
- `/supabase/functions/server/season-utils.tsx` (backend)

### 2. Servidor atualizado (`/supabase/functions/server/index.tsx`)
- **Novo endpoint**: `/make-server-c1d1bfd8/fix-week-numbers`
  - Recalcula TODOS os `week_number` existentes usando o sistema de seasons
  - Baseado na data `aired_at` de cada episódio

### 3. Função de Insert atualizada (`/supabase/functions/insert-weekly-episodes/index.ts`)
- Agora usa `getEpisodeWeekNumber(airedDate)` ao criar novos episódios
- Calcula automaticamente: `season`, `year` e `weekNumber` baseado na data aired

## 🚀 Como usar

### Passo 1: Recalcular week_numbers existentes

Acesse este URL no navegador para recalcular TODOS os episódios existentes:

```
https://SEU_PROJETO_ID.supabase.co/functions/v1/make-server-c1d1bfd8/fix-week-numbers
```

Substitua `SEU_PROJETO_ID` pelo ID do seu projeto Supabase.

**O que este endpoint faz:**
1. Busca TODOS os episódios com `aired_at` não nulo
2. Para cada episódio:
   - Calcula a season (winter/spring/summer/fall) baseado na data aired
   - Calcula o year
   - Calcula o week_number dentro da season (1-15)
3. Atualiza os campos: `week_number`, `season`, `year`

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Week numbers recalculados com sucesso!",
  "total": 500,
  "updated": 500,
  "errors": 0
}
```

### Passo 2: Verificar os resultados

Abra o SQL Editor do Supabase e execute:

```sql
-- Ver alguns episódios com seus weeks e seasons
SELECT 
  anime_title_english,
  episode_number,
  aired_at,
  season,
  year,
  week_number
FROM weekly_episodes
WHERE aired_at IS NOT NULL
ORDER BY aired_at DESC
LIMIT 20;
```

**Resultado esperado:**
- Episódios de Dezembro 2025 → `fall 2025 Week 10+`
- Episódios de Outubro 2025 → `fall 2025 Week 1-4`
- Episódios de Janeiro 2026 → `winter 2026 Week 1-4`

### Passo 3: Testar novos episódios

Os episódios inseridos no futuro já usarão automaticamente o sistema de seasons.

## 📊 Como funciona o cálculo

### Seasons por mês:
```
Winter: Janeiro - Março    (months 0-2)
Spring: Abril - Junho      (months 3-5)
Summer: Julho - Setembro   (months 6-8)
Fall:   Outubro - Dezembro (months 9-11)
```

### Cálculo de Week:
1. Identifica a season baseado no mês do `aired_at`
2. Encontra a primeira segunda-feira da season
3. Calcula quantas semanas se passaram desde essa segunda-feira
4. Retorna um número de 1 a 15 (máximo por season)

### Exemplo prático:
```
Episódio aired em: 2025-12-09 (9 de Dezembro de 2025)
→ Season: fall (Outubro-Dezembro)
→ Year: 2025
→ Fall 2025 começou em: 2025-10-01 (1º de Outubro)
→ Primeira segunda-feira de Fall 2025: 2025-09-29
→ Semanas desde 29/09 até 09/12: ~10 semanas
→ Week Number: 10
```

## 🎯 Resultado final nas páginas internas

Agora os episódios mostram corretamente:

```
Aired: Dec 9, 2025 • Fall 2025 • Week 10
```

Ao invés de:

```
Aired: Dec 9, 2025 • Fall 2025 • Week 71 ❌
```

## ⚠️ Importante

1. **Execute o endpoint `/fix-week-numbers` APENAS UMA VEZ** após o deploy
2. Novos episódios já usarão o sistema automaticamente
3. Se houver problemas, verifique os logs no Supabase Functions

## 🔧 Troubleshooting

### Problema: Week numbers não mudaram
**Solução:** Verifique se executou o endpoint corretamente. Veja os logs em Supabase → Edge Functions → Logs

### Problema: Weeks ainda acumuladas
**Solução:** Limpe o cache do navegador ou force refresh (Ctrl+Shift+R)

### Problema: Erro 500 ao chamar o endpoint
**Solução:** Verifique se as credenciais do Supabase estão configuradas corretamente

## ✅ Checklist de validação

- [ ] Executei `/fix-week-numbers` e recebi status 200
- [ ] Verifico no SQL que episódios de Dezembro 2025 mostram `fall 2025 Week 10+`
- [ ] Verifico no SQL que episódios de Outubro 2025 mostram `fall 2025 Week 1-4`
- [ ] Página interna do anime mostra "Fall 2025 • Week 10" corretamente
- [ ] Novos episódios inseridos já usam o sistema de seasons automaticamente
