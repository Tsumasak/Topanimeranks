# 🚀 SYNC DO SUPABASE - GUIA COMPLETO

## ❌ ERRO: "permission denied to set parameter"

### ✅ SOLUÇÃO

O Supabase hospedado **não permite** usar `ALTER DATABASE`. Use a **tabela `app_config`** ao invés!

---

## ⚡ SOLUÇÃO RÁPIDA (3 COMANDOS)

### **1. Configure credenciais**

```sql
UPDATE app_config SET value = 'https://SEU-ID.supabase.co' WHERE key = 'supabase_url';
UPDATE app_config SET value = 'SUA-ANON-KEY' WHERE key = 'supabase_anon_key';
```

**Onde encontrar:**
- Settings → API → Project URL
- Settings → API → anon public key

---

### **2. Criar funções**

Cole o arquivo:

**`/supabase/migrations/20241027000010_sync_functions_v2.sql`**

---

### **3. Sincronizar**

```sql
SELECT * FROM sync_everything();
```

Aguarde ~10 minutos. Pronto! ✅

---

## 📚 GUIAS DISPONÍVEIS

### 🌟 **INICIANTES - COMECE AQUI:**

1. **`/SETUP_FACIL.md`** ⭐
   - Setup completo em 3 passos
   - Explicação detalhada
   - **MAIS RECOMENDADO**

2. **`/INICIO_RAPIDO.md`** ⚡
   - 5 minutos
   - Visual com diagramas
   - **MAIS RÁPIDO**

3. **`/COMANDO_UNICO.sql`** 📝
   - Copy & paste único
   - Inclui validação
   - **MAIS PRÁTICO**

---

### 🔧 **SOLUÇÃO DE PROBLEMAS:**

- **`/ERRO_MIGRATION_010.md`** - "cannot change return type"
- **`/SETUP_FACIL.md`** - "permission denied"
- **`/PASSO_A_PASSO_COMPLETO.md`** - Troubleshooting completo

---

### 📖 **REFERÊNCIA E DOCUMENTAÇÃO:**

- **`/SYNC_RAPIDO.md`** - Comandos rápidos
- **`/SUPABASE_SYNC_MANUAL.md`** - Documentação completa
- **`/QUERIES_SQL_PRONTAS.sql`** - Queries úteis
- **`/ARQUIVOS_DISPONIVEIS.md`** - Índice de tudo

---

## 🎯 QUAL ARQUIVO USAR?

```
┌─────────────────────────────────────────────┐
│ PRIMEIRA VEZ?                               │
│ ↓                                           │
│ /SETUP_FACIL.md                             │
│ ou                                          │
│ /COMANDO_UNICO.sql                          │
├─────────────────────────────────────────────┤
│ PRECISO DE VELOCIDADE?                      │
│ ↓                                           │
│ /INICIO_RAPIDO.md                           │
├─────────────────────────────────────────────┤
│ TENHO ERRO?                                 │
│ ↓                                           │
│ permission denied → /SETUP_FACIL.md         │
│ cannot change → /ERRO_MIGRATION_010.md      │
├─────────────────────────────────────────────┤
│ QUERO ENTENDER TUDO?                        │
│ ↓                                           │
│ /PASSO_A_PASSO_COMPLETO.md                  │
│ /SUPABASE_SYNC_MANUAL.md                    │
├─────────────────────────────────────────────┤
│ REFERÊNCIA RÁPIDA?                          │
│ ↓                                           │
│ /SYNC_RAPIDO.md                             │
│ /QUERIES_SQL_PRONTAS.sql                    │
└─────────────────────────────────────────────┘
```

---

## 🔑 ARQUIVOS ESSENCIAIS

### **Migrations (Execute nesta ordem):**

1. `20241027000001_initial_schema.sql` - Tabelas
2. `20241027000003_config_table.sql` - **Config (importante!)**
3. `20241027000007_add_episode_fields.sql` - Campos extras
4. `20241027000008_rename_score_fields.sql` - Renomear
5. `20241027000009_add_optimized_indexes.sql` - Índices
6. `20241027000010_sync_functions_v2.sql` - **Funções (v2 corrigida)**

### **Não use:**
- ❌ `20241027000010_sync_functions.sql` (versão antiga)

---

## 📊 FUNÇÕES DISPONÍVEIS

Depois de executar a Migration 010 V2:

```sql
-- Sync uma week específica
SELECT sync_week(1);

-- Sync todas as 13 weeks
SELECT * FROM sync_all_weeks();

-- Sync uma season
SELECT sync_season('fall', 2024);

-- Sync most anticipated
SELECT sync_anticipated();

-- Sync TUDO de uma vez
SELECT * FROM sync_everything();

-- Ver status da sincronização
SELECT * FROM sync_status();
```

---

## ✅ VERIFICAR SE FUNCIONOU

```sql
-- Status geral
SELECT * FROM sync_status();

-- Contagem de dados
SELECT 
  'Weekly Episodes' as tipo,
  COUNT(*) as total,
  COUNT(DISTINCT mal_id) as animes_unicos
FROM weekly_episodes
UNION ALL
SELECT 
  'Season Rankings',
  COUNT(*),
  COUNT(DISTINCT mal_id)
FROM season_rankings;

-- Últimos logs
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
```

**Resultado esperado:**
- ✅ 150-200 episódios semanais
- ✅ 100-150 season rankings
- ✅ Logs com status "success"

---

## 🆘 PROBLEMAS COMUNS

### 1. **"permission denied to set parameter"**
✅ Use `app_config` ao invés de `ALTER DATABASE`
📖 Ver: `/SETUP_FACIL.md`

### 2. **"cannot change return type"**
✅ Execute `DROP FUNCTION` antes
📖 Ver: `/ERRO_MIGRATION_010.md`

### 3. **"Configurações não encontradas"**
✅ Execute o UPDATE da `app_config`
📖 Ver: `/SETUP_FACIL.md`

### 4. **"extension http does not exist"**
✅ Execute `CREATE EXTENSION IF NOT EXISTS http;`

### 5. **"relation app_config does not exist"**
✅ Execute Migration 003 primeiro

---

## 🎓 PRÓXIMOS PASSOS

1. ✅ Configure o banco (este guia)
2. ✅ Sincronize dados iniciais
3. 📅 Configure cron job automático
4. 🔄 Sync semanal dos novos episódios

**Documentação do cron:** `/SUPABASE_SYNC_MANUAL.md`

---

## 📞 LINKS ÚTEIS

| Documento | Propósito |
|-----------|-----------|
| `/COMECE_AQUI.md` | Ponto de partida |
| `/SETUP_FACIL.md` | Setup em 3 passos |
| `/INICIO_RAPIDO.md` | Guia rápido |
| `/COMANDO_UNICO.sql` | Script pronto |
| `/ARQUIVOS_DISPONIVEIS.md` | Índice completo |

---

**Última atualização:** Incluída solução para erro "permission denied"

**Versão da Migration 010:** V2 (usa `app_config`)

**Status:** ✅ Testado e funcionando

---

## 🚀 COMEÇAR AGORA

Escolha uma opção:

1. **Rápido:** `/INICIO_RAPIDO.md`
2. **Completo:** `/SETUP_FACIL.md`
3. **Script:** `/COMANDO_UNICO.sql`

**Boa sorte!** 🎉
