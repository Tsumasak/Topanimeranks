# ✅ Supabase Setup - Correção Aplicada

## 🔧 Problema Corrigido

O erro `TypeError: supabase.rpc(...).catch is not a function` foi resolvido!

### O que estava errado:

O código tentava usar `.rpc()` seguido de `.catch()`, mas o método `supabase.rpc()` não retorna uma Promise diretamente no Supabase client, causando o erro.

```typescript
// ❌ ANTES (não funcionava)
const { error } = await supabase.rpc('exec', { 
  sql: migration1 
}).catch(() => {
  return supabase.from('_').select('*').limit(0);
});
```

### Solução implementada:

Removemos a tentativa de executar SQL diretamente via Edge Function e simplificamos para apenas verificar se as tabelas existem:

```typescript
// ✅ AGORA (funciona!)
const { data: tablesCheck, error: tablesCheckError } = await supabase
  .from('weekly_episodes')
  .select('count')
  .limit(1);

if (tablesCheckError) {
  // Retorna instruções para o usuário executar migrations manualmente
  return c.json({
    success: false,
    error: "Tables not found. Please run migrations manually.",
    instructions: [...]
  }, 500);
}
```

## 📋 Como Funciona Agora

### 1. **Verificação Automática**
   - O endpoint `/make-server-c1d1bfd8/setup` verifica se as tabelas já existem
   - Se existirem → ✅ Setup completo!
   - Se não existirem → 📝 Retorna instruções para setup manual

### 2. **Setup Manual (se necessário)**
   Se as tabelas ainda não existem, você precisa:
   
   1. Ir ao **Supabase Dashboard** → **SQL Editor**
   2. Criar uma nova query
   3. Copiar o conteúdo de `/supabase/migrations/20241027000001_initial_schema.sql`
   4. Colar e clicar em **RUN**
   5. Copiar o conteúdo de `/supabase/migrations/20241027000002_setup_cron.sql`
   6. Colar e clicar em **RUN**
   7. Atualizar a página de setup

### 3. **Verificação Final**
   - O sistema testa se consegue acessar a tabela `weekly_episodes`
   - Se tudo estiver OK, insere um log de setup bem-sucedido
   - Retorna confirmação de sucesso com lista de tabelas e views criadas

## 🎯 Arquivos Modificados

1. **`/supabase/functions/server/index.tsx`**
   - Removido código problemático com `.rpc().catch()`
   - Simplificada a lógica de verificação de tabelas
   - Melhoradas as mensagens de erro e instruções

2. **`/services/supabase.ts`**
   - Corrigido para usar `projectId` e `publicAnonKey` de `/utils/supabase/info.tsx`
   - Removida dependência de variáveis de ambiente `VITE_SUPABASE_*`
   - Corrigido tipo `AnimeEpisode[]` → `Episode[]`

## 🚀 Próximos Passos

1. **Acesse a página de setup**: `/setup`
2. **Clique em "Run Setup"**
3. **Siga as instruções** se aparecerem
4. **Pronto!** As tabelas estarão prontas para receber dados

## 📚 Documentação Relacionada

- **Setup Guide**: `/SETUP_GUIDE.md`
- **Maintenance**: `/SUPABASE_MAINTENANCE.md`
- **Quick Start**: `/SUPABASE_QUICKSTART.md`
- **Como Fazer Setup**: `/COMO_FAZER_SETUP.md`

## ⚠️ Notas Importantes

- **Não é possível** executar migrations SQL diretamente via Edge Functions
- As migrations **devem ser executadas** via SQL Editor no dashboard do Supabase
- Isso é uma **limitação do Supabase**, não um bug do código
- O setup automático funciona apenas para **verificar** se as tabelas existem

## ✅ Status

- [x] Erro corrigido
- [x] Código refatorado
- [x] Documentação atualizada
- [x] Pronto para uso!
