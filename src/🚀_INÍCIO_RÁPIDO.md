# 🚀 INÍCIO RÁPIDO - Sistema Automático

## ✨ O Que Você Tem Agora

**✅ Cron Job Automático** → Atualiza dados a cada 10 minutos  
**✅ Frontend Ultra-Rápido** → Nunca chama Jikan API  
**✅ Cache Permanente** → Dados no Supabase  
**✅ Zero Manutenção** → Tudo automático  

---

## 🎯 Como Ativar (3 Passos)

### **Passo 1: Rodar Migrations** (5 minutos)

1. Vá no **Supabase Dashboard** → **SQL Editor**
2. Copie e cole: `/supabase/migrations/20241027000001_initial_schema.sql`
3. Clique **RUN**
4. Copie e cole: `/supabase/migrations/20241027000002_setup_cron.sql`
5. Clique **RUN**

✅ **Pronto!** Tabelas e cron job criados.

---

### **Passo 2: Deploy Edge Functions** (5 minutos)

**Opção A: Script Automático (Recomendado)**

```bash
# Windows PowerShell
.\setup-auto-sync.ps1

# Mac/Linux
chmod +x setup-auto-sync.sh
./setup-auto-sync.sh
```

**Opção B: Manual**

```bash
# 1. Login
supabase login

# 2. Link projeto (substitua SEU_PROJECT_ID)
supabase link --project-ref SEU_PROJECT_ID

# 3. Deploy functions
supabase functions deploy sync-anime-data
supabase functions deploy server
```

✅ **Pronto!** Edge functions deployadas.

---

### **Passo 3: Primeiro Sync** (10 minutos)

**Opção A: Automático (recomendado)**
- Espere 10 minutos
- O cron job fará o primeiro sync automaticamente

**Opção B: Manual (mais rápido)**

Vá no **SQL Editor** e rode:

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

✅ **Pronto!** Dados sendo sincronizados.

---

## 🎉 Usar o Site

```bash
npm run dev
```

**Abra:** http://localhost:5173

- ✅ **Primeira visita:** Banner pedindo sync inicial
- ✅ **Após sync:** Carregamento instantâneo (< 1s)
- ✅ **Automaticamente:** Atualiza a cada 10 minutos

---

## 🔍 Verificar se Está Funcionando

### **1. Verificar Cron Jobs:**

```sql
SELECT * FROM cron.job;
```

Deve mostrar 3 jobs agendados.

### **2. Verificar Dados:**

```sql
SELECT COUNT(*) FROM weekly_episodes;
SELECT COUNT(*) FROM season_rankings;
SELECT COUNT(*) FROM anticipated_animes;
```

Se retornar > 0, está funcionando!

### **3. Verificar Logs:**

```sql
SELECT * FROM sync_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🆘 Problemas?

### **Cron job não está rodando**

```sql
-- Verificar se pg_cron está habilitado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Se não estiver, habilite
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### **Sem dados nas tabelas**

```sql
-- Trigger sync manualmente
SELECT net.http_post(...); -- Ver Passo 3
```

### **Edge Function não funciona**

```bash
# Ver logs
supabase functions logs sync-anime-data --follow

# Fazer deploy novamente
supabase functions deploy sync-anime-data
```

---

## 📖 Documentação Completa

Veja `/🎯_SISTEMA_AUTOMÁTICO.md` para detalhes avançados.

---

## ⚡ Performance

**ANTES:**
- 🐌 Primeira carga: 10-30s
- 🐌 Navegação: 10-30s por página

**AGORA:**
- ⚡ Primeira carga: < 1s
- ⚡ Navegação: < 1s por página
- 🎉 Atualização: Automática a cada 10min

---

## ✅ Checklist de Ativação

- [ ] Migrations rodadas
- [ ] Edge Functions deployadas
- [ ] Primeiro sync executado
- [ ] Dados nas tabelas
- [ ] Site carregando rápido

**Tudo marcado?** 🎉 **Sistema 100% ativo!**
