# 🔧 Troubleshooting - Episódios Manuais Não Aparecem

## ❓ Problema: Episódio manual não está aparecendo na semana

### ✅ Checklist de Verificação:

#### 1. **Limpar o Cache do Navegador**

O cache impede que novos episódios manuais apareçam se a semana já foi carregada anteriormente.

**Opção A: Via Console do Navegador (Recomendado)**
```javascript
// Abra o DevTools (F12) e cole no Console:
localStorage.clear();
location.reload();
```

**Opção B: Via DevTools Manual**
1. Abra DevTools (F12)
2. Vá em **Application** → **Local Storage**
3. Clique com botão direito em `http://localhost` (ou seu domínio)
4. Selecione **Clear**
5. Recarregue a página (F5)

**Opção C: Incrementar CACHE_VERSION**
1. Abra `/services/jikan.ts`
2. Altere `CACHE_VERSION = 'v7_manual_episodes'` para `'v8'` (ou próximo número)
3. Salve o arquivo

---

#### 2. **Verificar Configuração do Episódio**

Abra `/data/manual-episodes.ts` e confira:

```typescript
{
  animeId: 61930,              // ✅ ID correto do MAL?
  episodeNumber: 3,             // ✅ Número correto do episódio?
  episodeTitle: "The World's Best",  // ✅ Título preenchido?
  weekNumber: 3,                // ✅ Semana correta (1-13)?
  score: 4.59                   // ✅ Score válido (número)?
}
```

**Erros Comuns:**
- ❌ `weekNumber` errado (ex: Week 3 = semana 13 Out - 19 Out 2025)
- ❌ Vírgula faltando no final do objeto (exceto último)
- ❌ `animeId` inválido (anime não existe no MAL)

---

#### 3. **Verificar Logs no Console**

Abra o Console do navegador (F12 → Console) e procure por:

**✅ Logs de Sucesso:**
```
[ManualEpisode] Found 1 manual episodes for week 3
[ManualEpisode] Processing manual episode: Anime 61930, EP3
[ManualEpisode] ✓ Created manual episode: <Nome> EP3 (4.59)
[ManualEpisode] ✓ ADDED <Nome> EP3 (manual)
```

**❌ Logs de Erro:**
```
[ManualEpisode] ✗ Failed to create manual episode for anime 61930
```
→ Significa que o anime não foi encontrado na API ou há erro no ID

```
[ManualEpisode] No manual episodes configured for week 3
```
→ Significa que `weekNumber` está errado ou arquivo não foi salvo

---

#### 4. **Confirmar que o Arquivo Foi Salvo**

1. Edite `/data/manual-episodes.ts`
2. Salve com **Ctrl+S** (ou Cmd+S no Mac)
3. Verifique se o servidor recarregou (mensagem no terminal)

---

#### 5. **Verificar Calendário de Semanas**

Confirme que está na semana correta:

| Semana | Período |
|--------|---------|
| Week 1 | 29 Set - 05 Out 2025 |
| Week 2 | 06 Out - 12 Out 2025 |
| **Week 3** | **13 Out - 19 Out 2025** |
| Week 4 | 20 Out - 26 Out 2025 |

Se o episódio 3 deveria estar na Week 2, altere:
```typescript
weekNumber: 3  →  weekNumber: 2
```

---

## 🔍 Passos de Debug Avançado

### Passo 1: Verificar Import

Abra `/services/jikan.ts` e confira se tem esta linha no topo:
```typescript
import { MANUAL_EPISODES, ManualEpisodeConfig } from '../data/manual-episodes';
```

### Passo 2: Testar Episódio Simples

Substitua o conteúdo de `MANUAL_EPISODES` por um teste básico:
```typescript
export const MANUAL_EPISODES: ManualEpisodeConfig[] = [
  {
    animeId: 5114,  // Fullmetal Alchemist Brotherhood (popular, sempre funciona)
    episodeNumber: 1,
    episodeTitle: "Test Episode",
    weekNumber: 1,
    score: 9.99
  }
];
```

1. Limpe o cache (`localStorage.clear()`)
2. Vá para Week 1
3. O episódio de teste deve aparecer em 1º lugar (score 9.99)

### Passo 3: Verificar Erro na API

Se o anime específico não carrega, teste buscar manualmente:

1. Abra: `https://api.jikan.moe/v4/anime/61930`
2. Se retornar erro 404 → anime não existe ou ID errado
3. Se retornar dados → copie o `mal_id` correto

---

## 🎯 Solução Rápida (99% dos Casos)

```javascript
// 1. Cole isto no Console do navegador (F12):
localStorage.clear();

// 2. Recarregue a página:
location.reload();

// 3. Espere carregar e verifique Week 3
```

Se mesmo assim não funcionar, há um erro no arquivo `manual-episodes.ts` (sintaxe JavaScript/TypeScript).

---

## 📞 Checklist Final

Antes de reportar um bug, confirme:

- [ ] Cache foi limpo (`localStorage.clear()`)
- [ ] Arquivo `/data/manual-episodes.ts` foi salvo
- [ ] `weekNumber` corresponde à semana correta
- [ ] `animeId` é válido (existe no MAL)
- [ ] Não há erros de sintaxe (vírgulas, chaves)
- [ ] Console não mostra erros em vermelho
- [ ] Servidor recarregou após salvar arquivo

---

## 🐛 Ainda Não Funciona?

Verifique se há **erros de sintaxe** no arquivo:

**❌ ERRADO:**
```typescript
export const MANUAL_EPISODES: ManualEpisodeConfig[] = [
  {
    animeId: 61930,
    episodeNumber: 3,
    episodeTitle: "The World's Best",
    weekNumber: 3,
    score: 4.59
  }  // ← FALTOU VÍRGULA SE HOUVER OUTRO EPISÓDIO ABAIXO!
  {
    animeId: 54857,
    episodeNumber: 1,
    //...
  }
];
```

**✅ CORRETO:**
```typescript
export const MANUAL_EPISODES: ManualEpisodeConfig[] = [
  {
    animeId: 61930,
    episodeNumber: 3,
    episodeTitle: "The World's Best",
    weekNumber: 3,
    score: 4.59
  }, // ← VÍRGULA AQUI!
  {
    animeId: 54857,
    episodeNumber: 1,
    episodeTitle: "Test",
    weekNumber: 1,
    score: 4.85
  }  // ← SEM VÍRGULA NO ÚLTIMO
];
```
