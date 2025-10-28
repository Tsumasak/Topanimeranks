# 🚀 Quick Start - Popular Episódios

## O Problema

**Week 1 está vazia** porque o banco de dados ainda não foi populado com episódios da Jikan API.

## ✅ Solução Mais Fácil: Via Interface

### 1️⃣ Acesse a Página de Sync

Na aplicação, acesse: **`/sync`** ou clique no botão **"Go to Sync Page"** que aparece quando não há dados.

### 2️⃣ Clique em "Sync All Weeks (1-5)"

Aguarde 2-3 minutos enquanto o sistema busca os dados da Jikan API.

### 3️⃣ Recarregue a Página

Após ver "All weeks synced successfully!", recarregue a aplicação e os episódios aparecerão!

---

## 🔧 Solução Alternativa: Via SQL (Se a Interface Não Funcionar)

### 1️⃣ Execute a Migration Mais Recente

No **Supabase SQL Editor**, execute:

```sql
-- Arquivo: /supabase/migrations/20241027000006_add_week_sync_function.sql
-- (Cole o conteúdo completo deste arquivo)
```

### 2️⃣ Sincronize TODAS as Weeks de Uma Vez

No **Supabase SQL Editor**, execute:

```sql
SELECT sync_all_weeks();
```

**Aguarde 2-3 minutos** para o processo completar.

### 3️⃣ Verifique os Resultados

```sql
-- Ver episódios por semana
SELECT 
  week_number,
  COUNT(*) as total_episodes
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;
```

Resultado esperado:
```
week_number | total_episodes
------------|---------------
1           | 20-30
2           | 20-30
3           | 20-30
4           | 20-30
5           | 5-15 (atual, pode ter menos)
```

## 🎯 Resultado

Após o sync, **recarregue a página** e você verá:

✅ **HomePage** → Top 3 episódios da Week 5 (ou Week 4 se Week 5 < 3)  
✅ **TopEpisodesPage** → Todas as weeks com episódios  
✅ **Position changes** funcionando (↑↓)  
✅ **Infinite scroll** com todos os episódios  

## ⚠️ Se Algo Der Errado

### Opção Alternativa: Sync Via Frontend

1. Acesse a aplicação
2. Procure o banner "Sync Status" 
3. Clique em **"Sync Now"**
4. Aguarde alguns minutos

### Opção Manual (Week por Week)

Se `sync_all_weeks()` não funcionar, execute manualmente:

```sql
-- Week 1
SELECT trigger_manual_sync('weekly_episodes', 1);

-- Aguarde 30 segundos...

-- Week 2
SELECT trigger_manual_sync('weekly_episodes', 2);

-- Aguarde 30 segundos...

-- Week 3
SELECT trigger_manual_sync('weekly_episodes', 3);

-- Aguarde 30 segundos...

-- Week 4
SELECT trigger_manual_sync('weekly_episodes', 4);

-- Aguarde 30 segundos...

-- Week 5
SELECT trigger_manual_sync('weekly_episodes', 5);
```

## 📊 Verificar Logs

```sql
SELECT * FROM sync_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

Status `success` = funcionou! ✅  
Status `error` = veja o `error_message` para detalhes ❌

## 🔄 Automático Daqui em Diante

Depois da primeira sincronização, o **cron job** vai atualizar automaticamente a cada 10 minutos! 🎉

---

**Problemas?** Veja o guia completo em `/COMO_POPULAR_EPISODIOS.md`
