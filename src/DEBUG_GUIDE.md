# Debug Guide - Top Anime Ranks

## 🐛 Debug Panel Visual (NOVO!)

### Painel Interativo de Debug

Agora você tem acesso a um **painel de debug visual** diretamente na interface do site!

**Localização**: Canto inferior direito, botão "Debug" (ícone de bug 🐛)

**Funcionalidades**:
- ✅ Ver total de episódios da semana atual e anterior
- ✅ Selecionar um anime específico para análise detalhada
- ✅ Comparar episódios lado a lado entre semanas
- ✅ Ver IDs, ranks, scores e datas de cada episódio
- ✅ Análise automática de mudanças de posição com cores

### Como Usar o Debug Panel

1. Clique no botão "**Debug**" no canto inferior direito (ao lado do botão de cache)
2. Selecione um anime da lista dropdown
3. Compare os episódios:
   - **Coluna Esquerda**: Semana atual com rankings
   - **Coluna Direita**: Semana anterior com rankings
4. Verifique a seção "**Analysis**" no final para ver:
   - 🆕 Quais episódios são NEW (não estavam na semana anterior)
   - ▲ Quais subiram e quantas posições
   - ▼ Quais desceram e quantas posições
   - = Quais mantiveram a mesma posição

### Verificando Problemas com Trend Indicator

Se um episódio está mostrando "🆕 NEW" mas deveria mostrar mudança de posição (▲ ou ▼):

1. Abra o **Debug Panel**
2. Selecione o anime em questão (ex: "Boku no Hero Academia")
3. **Verifique** se o episódio aparece em **AMBAS** as colunas:
   - Se aparecer só na esquerda → É realmente NEW ✓
   - Se aparecer em ambas → Há um problema! ⚠️
4. **Compare os dados**:
   - `ID` deve ser IGUAL em ambos (número do episódio)
   - `AnimeID` deve ser IGUAL em ambos (ID do anime no MAL)
   - `Aired` - verifique se as datas são iguais ou diferentes
5. Veja a seção "**Analysis**" para entender o que o sistema detectou

**Possíveis causas** se o episódio aparece em ambas mas é marcado como NEW:
- ❌ IDs diferentes (bug na API ou no código)
- ❌ Data de aired diferente (MAL atualizou a data)
- ❌ Cache desatualizado (limpar e recarregar)

## Sistema de Logging

Todo o sistema agora possui logging detalhado para facilitar o debug. Abra o Console do navegador (F12) para ver os logs.

### Logs do Cache (`cache.ts`)

- `[Cache] Hit: {key} (age: {hours}h)` - Dados encontrados no cache
- `[Cache] Miss: {key}` - Dados não encontrados no cache
- `[Cache] Expired: {key}` - Cache expirado (>24h)
- `[Cache] Saved: {key}` - Dados salvos no cache
- `[Cache] Cleared: {key}` - Cache limpo

### Logs de Week Data (`jikan.ts`)

- `[WeekData] Loading week {n} from cache` - Carregando semana do cache
- `[WeekData] Fetching fresh data for week {n}` - Buscando dados novos da API
- `[WeekData] Week {n} range: {start} to {end}` - Range de datas da semana
- `[WeekData] Found {n} animes in Fall 2025` - Total de animes encontrados
- `[WeekData] Processing {n} animes` - Quantos animes serão processados
- `[WeekData] Found episode in week {n}: {title} EP{n} (Score: {score})` - Episódio válido encontrado
- `[WeekData] Found future-dated episode ({days} days ahead): {title}` - Episódio com data futura (inferência)
- `[WeekData] Skipping far-future episode ({days} days ahead): {title}` - Episódio muito distante no futuro (ignorado)
- `[WeekData] Skipping episode with invalid date: {title}` - Data inválida
- `[WeekData] Total episodes found: {n}` - Total de episódios válidos
- `[WeekData] Caching {n} episodes for week {n}` - Salvando episódios no cache

### Logs de Trend Indicator (`WeekControl.tsx`) - NOVA LÓGICA! 🆕

**IMPORTANTE**: O trend indicator agora é baseado no **ANIME** (animeId), não no episódio específico!

**Lógica**:
- Week 1: Anime ID 123 → #4 (pode ser EP 5) → NEW
- Week 2: Anime ID 123 → #1 (pode ser EP 6) → ▲ 3 (anime subiu)
- Week 3: Anime ID 123 → #1 (pode ser EP 7) → = (manteve)
- Week 4: Anime ID 123 → #3 (pode ser EP 8) → ▼ 2 (desceu)

**Logs**:
- `[TrendIndicator] {anime}: NEW (no previous week data)` - Anime novo na semana 1
- `[TrendIndicator] {anime}: NEW (anime not in previous week)` - Anime não estava na semana anterior
- `[TrendIndicator] {anime}: #{rank} (was #{prevRank}, change: +/-{n})` - Mudança de posição do ANIME
- `  → Current: EP{n} (Score: {score})` - Episódio atual
- `  → Previous: EP{n} (Score: {score})` - Episódio da semana anterior

**Exemplo de log completo**:
```
[TrendIndicator] Boku no Hero Academia: #1 (was #4, change: +3)
  → Current: EP6 (Score: 4.85)
  → Previous: EP5 (Score: 4.72)
```

### Logs de Loading (`WeekControl.tsx`) - NOVO! 🆕

Quando você troca de semana, veja no console:
```
========== LOADING WEEK 2 ==========
[WeekControl] Week 2 loaded: 45 episodes
[WeekControl] Top 5 episodes:
  #1 Boku no Hero Academia EP1 (ID: 1, AnimeID: 38408)
  #2 One Piece EP1150 (ID: 1150, AnimeID: 21)
  ...
[WeekControl] Loading previous week 1 for comparison...
[WeekControl] Previous week 1 loaded: 38 episodes
[WeekControl] Previous week top 5:
  #1 Dan Da Dan EP5 (ID: 5, AnimeID: 58080)
  #2 Bleach EP35 (ID: 35, AnimeID: 41467)
  ...
========================================
```

## Regras de Filtragem de Episódios

### 0. FILTRO DE MEMBROS (CRÍTICO) ⭐
**Apenas animes com 20.000+ membros no MAL são processados**
❌ Animes com menos de 20k membros são **SEMPRE ignorados**

💡 **Por que meu anime não aparece?**
Verifique se o anime tem pelo menos 20.000 membros no MAL. Exemplo: `Sawaranaide Kotesashi-kun` pode não aparecer se tiver menos de 20k membros.

### 0.5. REGRA CRÍTICA: UM EPISÓDIO POR ANIME (NOVO!) 🎯
**Cada anime pode aparecer APENAS UMA VEZ por semana**

Se um anime lançou múltiplos episódios na mesma semana:
- ✅ Apenas o episódio com **MAIOR SCORE** é mantido
- ❌ Todos os outros episódios do mesmo anime são ignorados

**Exemplo**:
```
Semana 2:
- Saigo EP2 (Score: 4.36) ❌ Ignorado
- Saigo EP4 (Score: 4.48) ✅ Mantido (maior score)
```

**Logs no Console**:
```
[Dedup] Adding Saigo EP2 (Score: 4.36, Aired: 10/8/2025)
[Dedup] ⚠️ REPLACING Saigo EP2 (4.36) with EP4 (4.48) - HIGHER SCORE
  → Old aired: 10/8/2025
  → New aired: 10/10/2025
[WeekData] After deduplication: 45 unique animes (was 52 episodes)
```

### 0.6. ALINHAMENTO DE DATAS - CRÍTICO! ⚠️

**IMPORTANTE**: As datas estão alinhadas para FALL 2025:

- **Week 1**: September 29 - October 5, 2025
- **Week 2**: October 6-12, 2025
- **Week 3**: October 13-19, 2025
- **Week 4**: October 20-26, 2025

**Season**: FALL 2025 (Setembro - Dezembro 2025)

**Base Date**: `2025-09-29` (confirmado em `/services/jikan.ts`)

Isso significa que estamos buscando episódios que realmente aired em Setembro-Outubro 2025, da season Fall 2025 do MAL.

### 1. Data N/A
❌ Episódios sem data (`aired: null`) são **SEMPRE ignorados**

**Log**: `[WeekData] Week N - Skipping {anime} EPN: NO AIRED DATE`

### 2. Data Inválida
❌ Episódios com datas inválidas são ignorados

**Log**: `[WeekData] Week N - Skipping {anime} EPN: INVALID DATE`

### 3. Data Dentro da Semana - REGRA ESTRITA! 🎯

**NOVA LÓGICA**: Episódio deve estar EXATAMENTE dentro do range da semana

✅ **ACEITO**: `weekStart <= episodeDate <= weekEnd`
❌ **REJEITADO**: Qualquer data fora deste range

**Logs detalhados**:
```
[WeekData] Week 2 - Checking Yasei EP4:
  → Aired: 2025-10-08 (10/8/2025)
  → Week: 10/6/2025 to 10/12/2025
  → Days from week start: 2.0
  → Days from week end: -4.0
  ✓ ACCEPTED: Episode is within week 2
```

OU se rejeitado:
```
[WeekData] Week 1 - Checking Yasei EP4:
  → Aired: 2025-10-08 (10/8/2025)
  → Week: 9/29/2025 to 10/5/2025
  → Days from week start: 9.0
  → Days from week end: 3.0
  ✗ REJECTED: Episode aired AFTER week 1 (3.0 days too late)
```

⚠️ **REMOVIDO**: A regra de inferência de datas futuras foi REMOVIDA. Agora apenas episódios que realmente aired na semana são aceitos.

---

## 🐛 Problema: Mesmo Episódio em Múltiplas Semanas

**Sintoma**: 
```
Week 1: Yasei EP4 (★ 4.38)
Week 2: Yasei EP4 (★ 4.38)  ← MESMO episódio!
Week 3: Yasei EP3 (★ 4.45)
Week 4: Yasei EP4 (★ 4.38)  ← MESMO episódio de novo!
```

**Causas Possíveis**:

### Causa 1: API do MAL Retorna Data Errada
A API pode retornar `aired: null` ou uma data incorreta para o episódio.

**Como Verificar**:
```
[WeekData] Week 1 - Checking Yasei no Last Boss EP4:
  → Aired: 2025-10-02 (10/2/2025)  ← Verificar se está correto
  → Week: 9/29/2025 to 10/5/2025
  ✓ ACCEPTED
```

### Causa 2: Cache Desatualizado
O cache pode ter dados antigos de quando a lógica estava diferente.

**Solução**: Limpe COMPLETAMENTE o cache (botão roxo "Clear All Cache")

### Causa 3: Episódios Sem Data
Se `aired: null`, a lógica pode falhar.

**Verificar logs**:
```
[WeekData] Week N - Skipping Yasei EP4: NO AIRED DATE
```

### Causa 4: Múltiplos Episódios na Mesma Semana
Se um anime realmente lançou EP3 e EP4 na mesma semana, a deduplicação deve manter apenas o maior score.

**Verificar logs**:
```
[Dedup] Adding Yasei EP3 (Score: 4.45, Aired: 10/15/2025)
[Dedup] ⚠️ REPLACING Yasei EP3 (4.45) with EP4 (4.48) - HIGHER SCORE
```

---

### 4. Score
✅ Episódios **SEM score** são aceitos, mas:
- Vão para o final da lista (após ordenação)
- Aparecem com "★ N/A" no card

## Sistema de Infinite Scroll

- **Início**: Mostra 12 episódios
- **Auto-carregamento**: Carrega +12 episódios automaticamente ao scrollar
- **Sem limite**: Todos os episódios válidos são mostrados progressivamente

## Performance

- **Animes processados**: Todos com 20k+ membros (sem limite numérico)
- **Cache**: 24 horas
- **Rate Limit**: 1 segundo entre requisições à API Jikan

## Limpar Cache

### Método 1: Botão na Interface (RECOMENDADO) ⭐

Clique no **botão roxo de refresh** (RotateCcw) no canto inferior direito da tela:
- Aparece junto com os botões do Instagram e Scroll to Top
- Clique uma vez → Confirme → Recarrega automaticamente com dados frescos

### Método 2: Console do Navegador

No Console do navegador (F12):

```javascript
// Limpar todo o cache de anime (recomendado)
localStorage.clear();

// Ou limpar apenas cache de anime (mantém outras configurações)
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('jikan_') || key.startsWith('anime_')) {
    localStorage.removeItem(key);
  }
});

// Ou limpar apenas uma semana específica
localStorage.removeItem('anime_week_4');
```

## Troubleshooting

### Week 4 está vazia

1. Verifique os logs no console
2. Procure por mensagens tipo:
   - `[WeekData] Total episodes found: 0` → Nenhum episódio encontrado
   - `[WeekData] Skipping episode...` → Veja o motivo (data, score, etc)
3. Limpe o cache e recarregue

### Episódios não aparecem

1. **PRIMEIRO**: Verifique se o anime tem **20.000+ membros** no MAL
2. Verifique se o episódio tem data válida no MAL
3. Verifique se a data está no range correto da semana
4. Se a data for futura, verifique se está dentro de 7 dias

### Como verificar um anime específico

No Console:
```javascript
// Ver todos os animes da season com seus membros
const data = await fetch('https://api.jikan.moe/v4/seasons/2025/fall').then(r => r.json());
console.log(data.data.map((a, i) => `${i+1}. ${a.title} - ${a.members.toLocaleString()} members (ID: ${a.mal_id})`));

// Verificar membros de um anime específico
const anime = await fetch('https://api.jikan.moe/v4/anime/61142').then(r => r.json());
console.log(`${anime.data.title}: ${anime.data.members.toLocaleString()} members`);

// Verificar episódios de um anime
const eps = await fetch('https://api.jikan.moe/v4/anime/61142/episodes').then(r => r.json());
console.log(eps.data);
```

### Verificar filtro de 20k membros em ação

Nos logs do console, procure por:
```
[WeekData] After 20k+ members filter: X animes (filtered out Y)
[WeekData] Checking anime: Title (XXX members)
```
