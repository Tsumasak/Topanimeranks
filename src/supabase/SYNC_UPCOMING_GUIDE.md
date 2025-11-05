# 🚀 Guia: Sincronizar Animes UPCOMING

## 📋 O que é?

Este guia explica como sincronizar animes **UPCOMING** (futuros sem season específica) do Jikan API para que apareçam na aba **"Later"** do Most Anticipated.

### Animes incluídos:
- ✅ **"Aired: 2026 to ?"** - Animes com ano mas sem season
- ✅ **"Aired: 2027 to ?"** - Animes de 2027+
- ✅ **"Aired: 2028 to ?"**, **2029**, etc.
- ✅ **"Aired: Not available"** - Sem data definida
- ✅ **Summer 2026 e além** - Seasons futuras

### Filtro automático:
- ❌ **Fall 2025** (tem tab própria)
- ❌ **Winter 2026** (tem tab própria)
- ❌ **Spring 2026** (tem tab própria)
- ⚠️ Apenas animes com **5.000+ membros**

---

## 🎯 Passo 1: Fazer Deploy da Edge Function

**Antes de rodar o sync, faça deploy:**

```bash
supabase functions deploy server
```

Isso vai:
- ✅ Atualizar a Edge Function com o novo endpoint `/sync-upcoming`
- ✅ Aplicar as correções da função `getLaterAnimes()` no frontend
- ✅ Disponibilizar o endpoint para ser chamado

---

## 🔧 Passo 2: Rodar o Sync

### Opção A: Via cURL (Terminal)

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-c1d1bfd8/sync-upcoming \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Substitua:**
- `YOUR_PROJECT_ID` pelo ID do seu projeto Supabase
- `YOUR_ANON_KEY` pela sua chave anon do Supabase

### Opção B: Via Browser (Navegador)

1. Instale a extensão **[ModHeader](https://modheader.com/)** no Chrome
2. Configure o header:
   - **Name:** `Authorization`
   - **Value:** `Bearer YOUR_ANON_KEY`
3. Acesse no navegador:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-c1d1bfd8/sync-upcoming
   ```

### Opção C: Via Console do Navegador

```javascript
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-c1d1bfd8/sync-upcoming', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 📊 Resposta Esperada

```json
{
  "success": true,
  "total": 156,
  "inserted": 156,
  "updated": 0,
  "skipped": 0,
  "errors": 0,
  "message": "Sync completed: 156 animes inserted/updated"
}
```

### Logs no Console (Supabase Functions):

```
🚀 Iniciando sync UPCOMING animes...
📊 Buscando página 1 de animes UPCOMING...
✅ Encontrados 25 animes na página 1
📊 18 animes com 5000+ membros
🔍 Processando: Dandadan Season 2
✅ Anime Dandadan Season 2 salvo com sucesso
🔍 Processando: Oshi no Ko Season 3
✅ Anime Oshi no Ko Season 3 salvo com sucesso
...
📊 RESUMO DO SYNC UPCOMING:
   Total encontrados: 156
   ✅ Inseridos/atualizados: 156
   ⏭️  Pulados: 0
   ❌ Erros: 0
```

---

## ✅ Passo 3: Verificar no Banco

```sql
-- Ver quantos animes UPCOMING foram inseridos
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN season IS NULL THEN 1 END) as sem_season,
  COUNT(CASE WHEN year >= 2026 THEN 1 END) as ano_2026_plus,
  COUNT(CASE WHEN year >= 2027 THEN 1 END) as ano_2027_plus
FROM season_rankings
WHERE status = 'Not yet aired'
  AND NOT (season = 'fall' AND year = 2025)
  AND NOT (season = 'winter' AND year = 2026)
  AND NOT (season = 'spring' AND year = 2026);
```

**Resultado esperado:**
```
total | sem_season | ano_2026_plus | ano_2027_plus
------|------------|---------------|---------------
156   | 45         | 156           | 78
```

### Ver animes específicos:

```sql
SELECT 
  anime_id,
  title_english,
  season,
  year,
  members,
  status
FROM season_rankings
WHERE status = 'Not yet aired'
  AND season IS NULL
ORDER BY members DESC
LIMIT 10;
```

---

## 🎨 Passo 4: Verificar no Site

1. **Abra o site:** `https://seu-site.vercel.app/anticipated`
2. **Clique na aba "Later"**
3. **Deve aparecer:**
   - ✅ Animes com "2026 to ?"
   - ✅ Animes com "2027 to ?"
   - ✅ Animes com "Aired: Not available"
   - ✅ Summer 2026 e seasons futuras

---

## ⏰ Automatizar (Opcional)

Se quiser rodar automaticamente a cada hora junto com o sync de Fall 2025:

### Editar `/supabase/functions/server/index.tsx`

Procure pelo cron job e adicione:

```typescript
// Cron job endpoint - runs every hour
app.post("/make-server-c1d1bfd8/cron", async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("⏰ Cron job iniciado...");
    
    // Sync Fall 2025
    await syncFall2025(supabase);
    
    // Sync UPCOMING (ADICIONAR ESTA LINHA)
    await syncUpcoming(supabase);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Cron error:", error);
    return c.json({ success: false }, 500);
  }
});
```

**⚠️ ATENÇÃO:** Isso vai fazer chamadas à Jikan API a cada hora. Não recomendado se você não precisa de updates tão frequentes.

---

## 🚨 Troubleshooting

### Erro 429 (Rate Limit)

```
❌ Erro ao buscar página 5: 429
⏳ Rate limit atingido, aguardando 5 segundos...
```

**Solução:** O código já lida com isso automaticamente, aguarda 5s e tenta novamente.

### Erro de constraint

```
duplicate key value violates unique constraint "unique_anime_season"
```

**Solução:** O código foi atualizado para verificar se o anime já existe antes de inserir. Se persistir, rode novamente.

### Nenhum anime aparece na aba "Later"

**Verifique:**

1. **SQL retorna dados?**
   ```sql
   SELECT COUNT(*) FROM season_rankings 
   WHERE status = 'Not yet aired';
   ```

2. **Frontend foi atualizado?**
   - Faça git push/merge
   - Vercel fez deploy?
   - Limpe cache do browser (Ctrl+Shift+R)

3. **Logs do browser:**
   - Abra DevTools (F12)
   - Aba Console
   - Procure por `[SupabaseService] ✅ Found X Later animes`

---

## 📝 Notas

- ⏱️ **Tempo estimado:** 5-10 minutos (depende da quantidade de animes)
- 🔄 **Rate limit:** 3 requisições/segundo (Jikan API)
- 📦 **Limite:** 10 páginas (250 animes com 5000+ membros)
- 💾 **Dados salvos em:** `season_rankings` table

---

## ✅ Checklist Completo

- [ ] Fazer deploy da Edge Function (`supabase functions deploy server`)
- [ ] Rodar sync via cURL/browser
- [ ] Verificar resposta JSON (success: true)
- [ ] Verificar SQL (animes inseridos no banco)
- [ ] Abrir site em `/anticipated`
- [ ] Clicar na aba "Later"
- [ ] Confirmar que animes aparecem
- [ ] Verificar logs do console (F12)
- [ ] (Opcional) Adicionar ao cron job para automatizar

---

**Pronto!** 🎉 Os animes UPCOMING agora vão aparecer na aba "Later".
