# 📊 Como Popular o Banco de Dados

## ✅ Status Atual

Você completou o **setup das tabelas** com sucesso! 🎉

**MAS:** As tabelas estão **vazias** e o site ainda carrega dados direto do Jikan API.

---

## 🎯 O Que Você Precisa Fazer

Para que o site use o **cache do Supabase** (super rápido ⚡), você precisa **popular as tabelas** com dados.

---

## 🚀 Método 1: Sincronização Automática (RECOMENDADO)

### **Passo 1: Deploy da Edge Function**

A Edge Function `sync-anime-data` foi criada para sincronizar dados automaticamente.

**Arquivo:** `/supabase/functions/sync-anime-data/index.ts`

#### **Como fazer deploy:**

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Login no Supabase
supabase login

# 3. Link com seu projeto
supabase link --project-ref SEU_PROJECT_ID

# 4. Deploy da função
supabase functions deploy sync-anime-data
```

### **Passo 2: Chamar a Edge Function manualmente**

Após o deploy, você pode chamar a função para sincronizar dados:

```bash
# Sincronizar episódios da semana 1
curl -X POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/sync-anime-data' \
  -H 'Authorization: Bearer SUA_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "sync_type": "weekly_episodes",
    "week_number": 1
  }'

# Sincronizar animes da temporada
curl -X POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/sync-anime-data' \
  -H 'Authorization: Bearer SUA_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "sync_type": "season_rankings",
    "season": "fall",
    "year": 2025
  }'

# Sincronizar animes mais aguardados
curl -X POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/sync-anime-data' \
  -H 'Authorization: Bearer SUA_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "sync_type": "anticipated"
  }'
```

### **Passo 3: Configurar Cron Job (Opcional)**

Para sincronização automática a cada 10 minutos:

**Arquivo já criado:** `/supabase/migrations/20241027000002_setup_cron.sql`

Execute este SQL no **SQL Editor do Supabase**:

```sql
-- Criar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job para sincronizar semana atual (a cada 10 minutos)
SELECT cron.schedule(
  'sync-current-week',
  '*/10 * * * *',
  $$ SELECT net.http_post(
      url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/sync-anime-data',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer SUA_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{"sync_type": "weekly_episodes", "week_number": 1}'::jsonb
  ) $$
);

-- Job para sincronizar animes aguardados (1x por dia)
SELECT cron.schedule(
  'sync-anticipated',
  '0 0 * * *',
  $$ SELECT net.http_post(
      url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/sync-anime-data',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer SUA_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{"sync_type": "anticipated"}'::jsonb
  ) $$
);
```

---

## 🛠️ Método 2: Popular Manualmente via SQL

Se você não quiser fazer deploy da Edge Function, pode inserir dados manualmente:

### **Exemplo de INSERT:**

```sql
-- Inserir um episódio manualmente
INSERT INTO weekly_episodes (
  anime_id,
  episode_number,
  episode_id,
  anime_title,
  anime_image_url,
  score,
  members,
  type,
  week_number,
  week_start_date,
  week_end_date,
  position_in_week
) VALUES (
  57025,
  1,
  '57025_1',
  'Dan Da Dan',
  'https://cdn.myanimelist.net/images/anime/1462/144841l.jpg',
  8.5,
  150000,
  'TV',
  1,
  '2025-09-29',
  '2025-10-05',
  1
);
```

**Mas isso é trabalhoso!** Use o Método 1.

---

## 🔄 Método 3: Deixar o Site Popular Automaticamente (ATUAL)

**Como funciona agora:**

1. Site tenta buscar do Supabase
2. Se não encontrar, busca do Jikan API
3. Dados são salvos no **localStorage** (não no Supabase)

**Problema:** Não aproveita o cache do Supabase.

**Solução:** Use Método 1 ou 2.

---

## ✨ Depois de Popular

Quando você popular as tabelas:

### **O Que Vai Acontecer:**

✅ Site carrega **INSTANTANEAMENTE** (dados do Supabase)  
✅ Sem loading de "Processing 6/39 animes..."  
✅ Sem chamadas lentas para Jikan API  
✅ Performance 100x mais rápida  
✅ Menos chance de rate limit  

### **Como Verificar:**

1. Vá para o **Supabase Dashboard**
2. Navegue para **Table Editor**
3. Abra a tabela `weekly_episodes`
4. Você deve ver linhas com dados

---

## 📋 Resumo Rápido

```
1. Setup das tabelas        ✅ FEITO
2. Popular as tabelas        ⏳ VOCÊ ESTÁ AQUI
3. Site usando cache         ⏳ Depois do passo 2
```

---

## 🆘 Precisa de Ajuda?

### **Opção A: Usando o site mesmo**
O site continua funcionando normalmente, mas sempre vai buscar do Jikan API (lento).

### **Opção B: Popular o banco**
Siga o **Método 1** acima para aproveitar o cache e ter performance máxima.

---

## 🎁 Comandos Úteis

```bash
# Ver logs da Edge Function
supabase functions logs sync-anime-data

# Verificar tabelas no banco
supabase db pull

# Resetar tabelas (CUIDADO!)
# Execute no SQL Editor:
TRUNCATE TABLE weekly_episodes CASCADE;
TRUNCATE TABLE season_rankings CASCADE;
TRUNCATE TABLE anticipated_animes CASCADE;
```

---

**Última atualização:** Sistema modificado para usar Supabase como cache principal
