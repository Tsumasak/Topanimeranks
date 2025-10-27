# 🛠️ Guia de Setup Manual do Supabase

## ❌ Problema Detectado

As tabelas do banco de dados não existem. Este é um processo normal na primeira vez que você configura o projeto.

**Erro:** `Could not find the table 'public.weekly_episodes' in the schema cache`

---

## ✅ Solução: 4 Passos Simples

### 📍 Passo 1: Acesse o Supabase Dashboard

1. Abra seu navegador
2. Acesse: `https://supabase.com/dashboard`
3. Faça login na sua conta
4. Selecione o projeto correto

---

### 📍 Passo 2: Abra o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **+ New query** no topo
3. Uma janela de editor SQL vazia será aberta

---

### 📍 Passo 3: Execute o SQL de Criação

#### 📄 **Arquivo a ser executado:**
```
/supabase/migrations/20241027000001_initial_schema.sql
```

#### 🔄 **Como fazer:**

1. **Abra o arquivo** no seu editor de código (VS Code, Cursor, etc.)
2. **Selecione TODO o conteúdo** (Ctrl+A / Cmd+A)
3. **Copie** (Ctrl+C / Cmd+C)
4. **Volte para o SQL Editor do Supabase**
5. **Cole o conteúdo** no editor (Ctrl+V / Cmd+V)
6. **Clique no botão RUN** (canto inferior direito)

#### ✅ **Resultado esperado:**

Você verá uma mensagem verde de sucesso:
```
✅ Success. No rows returned
```

E várias notificações RAISE NOTICE na parte inferior:
```
✅ Top Anime Ranks schema created successfully!
📊 Tables: weekly_episodes, season_rankings, anticipated_animes, sync_logs
🔒 RLS enabled with public read access
🚀 Ready for data synchronization!
```

---

### 📍 Passo 4: Verifique o Setup

1. **Volte para a página de Setup** da aplicação
2. **Clique no botão "Verificar Status"**
3. Se tudo estiver correto, você verá:
   - ✅ Status de sucesso
   - Lista de tabelas criadas
   - Sistema pronto para uso

---

## 📊 O que será criado?

### **Tabelas:**

1. ✅ `weekly_episodes` - Episódios semanais
2. ✅ `season_rankings` - Rankings por temporada
3. ✅ `anticipated_animes` - Animes mais aguardados
4. ✅ `sync_logs` - Logs de sincronização

### **Views:**

1. ✅ `latest_sync_status` - Status das últimas sincronizações

### **Configurações:**

- 🔒 Row Level Security (RLS) habilitado
- 👁️ Acesso público de leitura (anon role)
- 🔐 Acesso completo para service role (Edge Functions)
- ⚙️ Triggers para atualizar `updated_at` automaticamente
- 📈 Índices para queries rápidas

---

## ⚠️ Problemas Comuns

### ❌ "Permission denied"

**Solução:** Certifique-se de estar logado com a conta correta e que você é o owner do projeto.

### ❌ "Syntax error"

**Solução:** 
- Certifique-se de copiar TODO o conteúdo do arquivo
- Não deixe nada para trás
- O arquivo tem 329 linhas

### ❌ "Extension not found"

**Solução:** O Supabase já tem a extensão `uuid-ossp` habilitada por padrão. Se der erro, tente executar apenas:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 🎯 Verificação Manual

Se quiser verificar manualmente se as tabelas foram criadas:

1. No Supabase Dashboard, vá para **Table Editor**
2. Você deve ver 4 tabelas:
   - `weekly_episodes`
   - `season_rankings`
   - `anticipated_animes`
   - `sync_logs`

---

## 📚 Próximos Passos

Após o setup manual:

1. ✅ Voltar para `/setup` e clicar em "Verificar Status"
2. ✅ Sistema estará pronto para sincronização de dados
3. ✅ Você pode começar a usar a aplicação normalmente

---

## 💡 Por que o setup não é automático?

O Supabase Edge Functions **não permite** executar comandos DDL (Data Definition Language) como `CREATE TABLE` diretamente via código por questões de segurança.

Por isso, as migrations devem ser executadas manualmente via SQL Editor do Supabase Dashboard.

Isso é uma **limitação da plataforma**, não um bug da aplicação.

---

## 📞 Precisa de Ajuda?

Consulte também:

- `/SUPABASE_QUICKSTART.md` - Guia rápido
- `/SUPABASE_SETUP_FIXED.md` - Detalhes técnicos da correção
- `/SETUP_GUIDE.md` - Guia completo de setup

---

## ✅ Checklist Final

Antes de continuar, confirme:

- [ ] Acessei o Supabase Dashboard
- [ ] Abri o SQL Editor
- [ ] Copiei TODO o conteúdo de `/supabase/migrations/20241027000001_initial_schema.sql`
- [ ] Colei no SQL Editor
- [ ] Cliquei em RUN
- [ ] Vi mensagem de sucesso verde
- [ ] Voltei para `/setup` e cliquei em "Verificar Status"
- [ ] Sistema está funcionando! 🎉
