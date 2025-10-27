# 📋 CHECKLIST DE ATIVAÇÃO

## ✅ Sistema Automático - Top Anime Ranks

Use este checklist para ativar o sistema passo a passo.

---

## 🎯 FASE 1: Preparação (5 min)

### ☐ Pré-requisitos

- [ ] Tenho conta no Supabase
- [ ] Tenho o Project ID do Supabase
- [ ] Tenho Node.js instalado
- [ ] Repositório clonado localmente

### ☐ Instalar Supabase CLI

**Windows (escolha um):**
```powershell
# Opção 1: Chocolatey
choco install supabase

# Opção 2: Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Mac/Linux:**
```bash
brew install supabase/tap/supabase
```

- [ ] Supabase CLI instalado
- [ ] Comando `supabase --version` funciona

---

## 🗄️ FASE 2: Setup do Banco de Dados (5 min)

### ☐ Rodar Migration 1 (Schema)

1. [ ] Abrir **Supabase Dashboard**
2. [ ] Ir em **SQL Editor**
3. [ ] Clicar **New Query**
4. [ ] Copiar conteúdo de `/supabase/migrations/20241027000001_initial_schema.sql`
5. [ ] Colar no SQL Editor
6. [ ] Clicar **RUN**
7. [ ] Ver mensagem de sucesso ✅

**Verificação:**
```sql
SELECT * FROM weekly_episodes LIMIT 1;
```
- [ ] Query funciona (mesmo que retorne vazio)

### ☐ Rodar Migration 2 (Cron Jobs)

1. [ ] No SQL Editor, criar **New Query**
2. [ ] Copiar conteúdo de `/supabase/migrations/20241027000002_setup_cron.sql`
3. [ ] Colar no SQL Editor
4. [ ] Clicar **RUN**
5. [ ] Ver mensagens de sucesso ✅

**Verificação:**
```sql
SELECT * FROM cron.job;
```
- [ ] Mostra 3 jobs agendados

---

## 🚀 FASE 3: Deploy Edge Functions (5 min)

### ☐ Opção A: Script Automático (Recomendado)

**Windows PowerShell:**
```powershell
.\setup-auto-sync.ps1
```

**Mac/Linux:**
```bash
chmod +x setup-auto-sync.sh
./setup-auto-sync.sh
```

- [ ] Script executado com sucesso
- [ ] Functions deployadas

### ☐ Opção B: Manual

```bash
# 1. Login
supabase login

# 2. Link projeto (substitua SEU_PROJECT_ID)
supabase link --project-ref SEU_PROJECT_ID

# 3. Deploy sync-anime-data
supabase functions deploy sync-anime-data

# 4. Deploy server
supabase functions deploy server
```

- [ ] Login realizado
- [ ] Projeto linkado
- [ ] `sync-anime-data` deployada
- [ ] `server` deployada

**Verificação:**
```bash
supabase functions list
```
- [ ] Mostra: `sync-anime-data`
- [ ] Mostra: `server`

---

## 🔄 FASE 4: Primeiro Sync (10 min)

### ☐ Opção A: Aguardar Sync Automático

- [ ] Esperar 10 minutos
- [ ] Cron job fará o sync automaticamente

### ☐ Opção B: Trigger Manual (Mais Rápido)

**No SQL Editor:**
```sql
SELECT
  net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-anime-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := jsonb_build_object('sync_type', 'weekly_episodes')
  );
```

- [ ] Query executada
- [ ] Aguardar 2-3 minutos

**Verificação:**
```sql
-- Ver se dados foram sincronizados
SELECT COUNT(*) FROM weekly_episodes;
SELECT COUNT(*) FROM season_rankings;
SELECT COUNT(*) FROM anticipated_animes;
```

- [ ] `weekly_episodes` > 0
- [ ] `season_rankings` > 0
- [ ] `anticipated_animes` > 0

**Ver logs:**
```sql
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
```

- [ ] Logs mostram status 'success'

---

## 🌐 FASE 5: Testar o Site (2 min)

### ☐ Rodar Frontend

```bash
npm install  # Se ainda não rodou
npm run dev
```

- [ ] Servidor iniciou
- [ ] Abrir http://localhost:5173

### ☐ Verificar Carregamento

- [ ] Página Home carrega rápido (< 2s)
- [ ] Não mostra banner de "No data available"
- [ ] Mostra episódios da semana
- [ ] Mostra animes antecipados
- [ ] Navegação entre páginas é rápida

### ☐ Verificar Console (DevTools)

- [ ] Não há chamadas para `jikan.moe`
- [ ] Só há chamadas para Supabase
- [ ] Logs mostram: `[SupabaseService] ✓ Found X episodes`

---

## 🎯 FASE 6: Monitoramento (Opcional)

### ☐ Verificar Cron Jobs Rodando

```sql
-- Ver histórico de execuções do cron
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

- [ ] Cron jobs estão executando a cada 10 minutos

### ☐ Verificar Logs de Sync

```sql
-- Ver últimos syncs
SELECT 
  sync_type,
  status,
  items_synced,
  duration_ms,
  created_at
FROM sync_logs
ORDER BY created_at DESC
LIMIT 10;
```

- [ ] Syncs ocorrendo regularmente
- [ ] Status = 'success'
- [ ] items_synced > 0

### ☐ Verificar Performance

```sql
-- Ver duração média dos syncs
SELECT 
  sync_type,
  AVG(duration_ms) as avg_ms,
  COUNT(*) as total_syncs
FROM sync_logs
WHERE status = 'success'
GROUP BY sync_type;
```

- [ ] Duração aceitável (< 60000ms = 1 min)

---

## ✅ CHECKLIST FINAL

### Sistema Completo Ativo

- [ ] ✅ Migrations rodadas
- [ ] ✅ Cron jobs configurados
- [ ] ✅ Edge Functions deployadas
- [ ] ✅ Dados sincronizados
- [ ] ✅ Site carregando rápido
- [ ] ✅ Sem chamadas ao Jikan
- [ ] ✅ Sync automático funcionando

### Performance Validada

- [ ] ⚡ Home page: < 2s
- [ ] ⚡ Ranks page: < 2s
- [ ] ⚡ Most Anticipated: < 2s
- [ ] ⚡ Navegação: < 1s

### Documentação Lida

- [ ] 📖 Li `/🚀_INÍCIO_RÁPIDO.md`
- [ ] 📖 Li `/✅_SISTEMA_PRONTO.md`
- [ ] 📖 Sei onde está `/🎯_SISTEMA_AUTOMÁTICO.md` (para consulta)

---

## 🎉 TUDO MARCADO?

### **PARABÉNS! Sistema 100% Ativo!** 🚀

Agora você tem:
- ✅ Sync automático a cada 10 minutos
- ✅ Navegação instantânea
- ✅ Zero chamadas ao Jikan
- ✅ Sistema totalmente automatizado

**Aproveite seu site ultra-rápido!** ⚡

---

## 🆘 Algo Deu Errado?

### **Documentação de Troubleshooting:**

Veja `/🎯_SISTEMA_AUTOMÁTICO.md` seção "🚨 TROUBLESHOOTING"

### **Problemas Comuns:**

**1. Cron job não roda**
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

**2. Edge Function não funciona**
```bash
supabase functions logs sync-anime-data --follow
```

**3. Dados não aparecem**
```sql
-- Force sync manual
SELECT net.http_post(...);
```

---

## 📞 Precisa de Ajuda?

- **Guia Rápido:** `/🚀_INÍCIO_RÁPIDO.md`
- **Documentação:** `/🎯_SISTEMA_AUTOMÁTICO.md`
- **Resumo:** `/✅_SISTEMA_PRONTO.md`
- **Este Checklist:** `/📋_CHECKLIST_ATIVAÇÃO.md`

**Me chame de volta se precisar!** 🙋‍♂️

---

**Versão:** 1.0  
**Data:** 27 de Outubro de 2025  
**Sistema:** Top Anime Ranks - Sync Automático
