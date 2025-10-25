# 🔍 Como Encontrar Episódios Faltantes

## 📋 Visão Geral

Esta ferramenta analisa automaticamente quais animes estavam na **Week 2** mas **não aparecem na Week 3**, sugerindo que provavelmente lançaram novos episódios que não estão disponíveis na API.

---

## 🚀 Método 1: Interface Visual (Recomendado)

### Passo 1: Acessar a Ferramenta

Navegue até: **`/missing-episodes`**

Ou acesse diretamente: `http://localhost:5173/missing-episodes`

### Passo 2: Clicar em "Analisar"

1. Clique no botão **"Analisar Week 2 vs Week 3"**
2. Aguarde enquanto o sistema carrega os dados (pode levar alguns segundos)
3. Os resultados aparecerão automaticamente

### Passo 3: Revisar os Resultados

Você verá uma lista como:

```
⚠️ Encontrados 5 episódios potencialmente faltantes:

1. Tsuma, Shougakusei ni Naru
   → Anime ID: 61930
   → Último episódio: EP2 (Score: 4.54)
   → Sugestão: EP3 (Score estimado: 4.59)

2. Demon Slayer Season 4
   → Anime ID: 51009
   → Último episódio: EP7 (Score: 8.85)
   → Sugestão: EP8 (Score estimado: 8.82)
```

### Passo 4: Copiar o Código

1. Clique no botão **"Copiar Código"**
2. O código será copiado para a área de transferência

### Passo 5: Colar no manual-episodes.ts

1. Abra `/data/manual-episodes.ts`
2. Cole o código copiado **dentro do array** `MANUAL_EPISODES`
3. **IMPORTANTE:** Substitua os títulos genéricos pelos títulos reais

### Passo 6: Obter Títulos Reais

Para cada anime, clique em **"Ver no MAL →"** para abrir a página do MyAnimeList.

Exemplo:
- Acesse: `https://myanimelist.net/anime/61930`
- Vá na aba **"Episodes"**
- Encontre o episódio 3
- Copie o título real: "The World's Best"

Substitua no código:
```typescript
episodeTitle: "Episode 3", // ❌ ANTES
episodeTitle: "The World's Best", // ✅ DEPOIS
```

### Passo 7: Salvar e Limpar Cache

1. Salve o arquivo (`Ctrl+S` ou `Cmd+S`)
2. Limpe o cache do navegador:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

---

## 🖥️ Método 2: Console do Navegador

### Opção A: Script Direto

1. Abra o Console (F12)
2. Cole este código:

```javascript
// Importar funções
import { findMissingEpisodes, generateManualEpisodesCode } from '/data/find-missing-episodes.ts';

// Analisar
await findMissingEpisodes();

// Ou gerar código direto
await generateManualEpisodesCode();
```

### Opção B: Função Global

Se configurado, execute simplesmente:

```javascript
await findMissingEpisodes();
```

---

## 📊 Como Funciona

### Lógica da Análise

1. **Carrega Week 2:** Busca todos os episódios que estavam na semana anterior
2. **Carrega Week 3:** Busca todos os episódios da semana atual
3. **Compara:** Identifica animes que "sumiram" entre as semanas
4. **Sugere:** Assume que o próximo episódio (EP anterior + 1) deveria existir

### Estimativa de Score

O score é estimado com base no episódio anterior:
- Score anterior ± 0.05 (pequena variação aleatória)
- Nunca menor que 0 ou maior que 10

**Exemplo:**
- EP2 tinha score 4.54
- EP3 sugerido: 4.59 (pode ser 4.49 a 4.59)

### Por que Animes "Desaparecem"?

Razões comuns:
1. **API lenta:** Jikan ainda não tem dados do episódio novo
2. **Episódio não pontuado:** Usuários ainda não avaliaram
3. **Atraso de transmissão:** Episódio saiu mas não foi indexado
4. **Hiatus:** Anime pausou (menos comum)

---

## ✅ Checklist de Uso

Antes de adicionar episódios manuais:

- [ ] Executei a análise e vi os resultados
- [ ] Copiei o código gerado
- [ ] Abri cada link "Ver no MAL" para verificar
- [ ] Substitui TODOS os títulos genéricos pelos reais
- [ ] Verifiquei que o episódio realmente existe
- [ ] Salvei o arquivo `manual-episodes.ts`
- [ ] Limpei o cache do navegador
- [ ] Recarreguei a página

---

## 🎯 Exemplo Completo

### 1. Resultado da Análise

```
1. Tsuma, Shougakusei ni Naru
   → Anime ID: 61930
   → Sugestão: EP3
```

### 2. Verificar no MAL

Acesse: `https://myanimelist.net/anime/61930`

Confirme que:
- ✅ Episódio 3 existe
- ✅ Episódio 3 foi lançado na Week 3 (13-19 Out)
- ✅ Título do episódio: "The World's Best"

### 3. Adicionar ao manual-episodes.ts

```typescript
export const MANUAL_EPISODES: ManualEpisodeConfig[] = [
  {
    animeId: 61930,
    episodeNumber: 3,
    episodeTitle: "The World's Best", // ✅ Título real
    weekNumber: 3,
    score: 4.59
  },
  // outros episódios...
];
```

### 4. Limpar Cache e Verificar

```javascript
localStorage.clear();
location.reload();
```

Vá para Week 3 e confirme que o episódio aparece!

---

## ⚠️ Avisos Importantes

### 1. Verifique Sempre o MAL

**NÃO confie cegamente na análise automática!**

Sempre verifique:
- O episódio realmente existe?
- Foi lançado na semana correta?
- O título está correto?

### 2. Scores São Estimativas

Os scores sugeridos são **aproximações**. Se você sabe o score real (ex: viu no Reddit, Twitter), use o valor real.

### 3. Alguns Animes Podem Estar em Hiatus

Se um anime "desapareceu" mas NÃO tem episódio novo no MAL, ele pode estar:
- Em pausa programada
- Entre temporadas
- Cancelado

**Não adicione episódios que não existem!**

### 4. Limite de 50 Episódios

A Week 3 mostra apenas os **Top 50** episódios.

Se um anime estava em 45º na Week 2 e caiu para 52º na Week 3, ele "desaparece" mas NÃO precisa de episódio manual - só caiu no ranking.

---

## 🐛 Problemas Comuns

### "Nenhum episódio faltante encontrado"

**Possíveis causas:**
- API está rápida essa semana (tudo já foi indexado)
- Cache antigo (limpe com `localStorage.clear()`)
- Todos os animes continuaram de uma semana para outra

### "Episódio adicionado mas não aparece"

**Soluções:**
1. Limpe o cache: `localStorage.clear()`
2. Verifique `weekNumber` (deve ser 3)
3. Confira sintaxe (vírgulas, chaves)
4. Veja logs no Console (F12)

### "Score muito diferente do real"

**Solução:**
- Substitua o score estimado pelo real
- Fontes: Reddit, Twitter, MAL (quando disponível)

---

## 💡 Dicas Pro

### 1. Salve o Código Gerado

Antes de substituir títulos, salve o código em um arquivo temporário. Assim você pode reverter se algo der errado.

### 2. Adicione Comentários

```typescript
{
  animeId: 61930,
  episodeNumber: 3,
  episodeTitle: "The World's Best",
  weekNumber: 3,
  score: 4.59
}, // ← Adicionado manualmente em 2025-10-15
```

### 3. Use Batch Processing

Se há 10+ episódios faltantes:
1. Copie o código
2. Substitua todos os títulos de uma vez
3. Salve
4. Limpe cache apenas 1 vez

### 4. Monitore o Console

Sempre deixe o Console aberto (F12) para ver:
```
[ManualEpisode] ✓ ADDED Tsuma EP3 (manual)
```

---

## 📚 Recursos Adicionais

- **Documentação Principal:** `/data/COMO_USAR.md`
- **Troubleshooting:** `/data/TROUBLESHOOTING.md`
- **Script de Teste:** `/data/test-manual-episodes.ts`
- **Código de Análise:** `/data/find-missing-episodes.ts`

---

## 🎉 Resultado Final

Após seguir este guia, você terá:

✅ Identificado todos os episódios faltantes automaticamente  
✅ Adicionado episódios manuais com títulos reais  
✅ Week 3 completa e atualizada  
✅ Sistema funcionando perfeitamente  

**Tempo estimado:** 10-15 minutos para processar 5-10 episódios
