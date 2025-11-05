# 🚀 Deploy Guide - Auto Week Detection

## 📋 O que precisa ser feito

Você acabou de implementar o sistema de **detecção automática de weeks**. Para que funcione, você precisa fazer o deploy da Edge Function atualizada.

## ✅ Checklist de Deploy

### 1. Deploy da Edge Function (OBRIGATÓRIO)

```bash
# Login no Supabase (se ainda não estiver logado)
supabase login

# Link ao seu projeto (se ainda não estiver linkado)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy da função server (contém o endpoint /available-weeks atualizado)
supabase functions deploy server
```

**Resultado esperado:**
```
Deploying Function server...
Function deployed successfully!
URL: https://YOUR_PROJECT.supabase.co/functions/v1/server
```

### 2. Verificar Deploy (Recomendado)

```bash
# Testar o endpoint
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-c1d1bfd8/available-weeks \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Response esperada:**
```json
{
  "success": true,
  "weeks": [1, 2, 3, 4, 5, 6],
  "latestWeek": 6,
  "weekCounts": [
    { "week": 1, "count": 45 },
    { "week": 2, "count": 42 },
    ...
  ]
}
```

### 3. Verificar Logs da Edge Function

1. Vá para **Supabase Dashboard**
2. **Edge Functions** → **server** (ou make-server-c1d1bfd8)
3. Clique em **Logs**
4. Faça uma chamada ao endpoint `/available-weeks`
5. Veja os logs:

```
[Server] 📊 Weeks with scored episodes: Week 1: 45 episodes, Week 2: 42 episodes, ...
[Server] ✅ Available weeks (5+ episodes with score): 1, 2, 3, 4, 5, 6
[Server] 🎯 Latest week with 5+ scored episodes: Week 6
```

### 4. Testar no Frontend

1. Abra a **HomePage** (`/`)
   - Deve mostrar a latest week automaticamente
   - Console deve mostrar: `[HomePage] 🎯 Using latest week: Week X (auto-detected)`

2. Vá para **Weekly Anime Episodes** (`/ranks`)
   - Controller deve mostrar apenas weeks com 5+ episódios
   - Console deve mostrar: `[WeekControl] 🎯 Latest week detected: Week X`

3. Faça **hard refresh** (Ctrl+Shift+R)
   - Garantir que não está usando cache

## ❌ O que NÃO precisa fazer

- ❌ **Migrations SQL**: Não há mudanças no schema do banco
- ❌ **Deploy no Vercel**: O código frontend não precisa ser deployado (ainda)
- ❌ **Atualizar constantes**: `CURRENT_WEEK_NUMBER` não precisa ser alterado
- ❌ **Reiniciar serviços**: Tudo funciona automaticamente após o deploy

## 🐛 Troubleshooting

### Edge Function não está respondendo

**Verificar:**
```bash
# Ver status da função
supabase functions list

# Ver logs em tempo real
supabase functions logs server --tail
```

### Endpoint retorna erro 500

**Possíveis causas:**
1. Variáveis de ambiente não configuradas
   - Verificar se `SUPABASE_URL` e `SUPABASE_ANON_KEY` existem
   - Dashboard → Settings → API

2. Tabela `weekly_episodes` não existe
   - Rodar migrations primeiro

3. Código com erro de sintaxe
   - Ver logs da função
   - Corrigir e fazer deploy novamente

### Frontend ainda mostra week errada

**Soluções:**
1. **Hard refresh**: Ctrl+Shift+R
2. **Limpar cache**: DevTools → Application → Clear storage
3. **Verificar Network tab**:
   - Procurar chamada para `/available-weeks`
   - Ver o response
   - Verificar se `latestWeek` está correto

### Week 7 não aparece mesmo com 5+ episódios

**Verificar via SQL:**
```sql
-- Ver contagem real
SELECT 
  week_number,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as episodes_with_score
FROM weekly_episodes
WHERE week_number = 7
GROUP BY week_number;
```

**Se retornar < 5:**
- Fazer sync manual: Ver `/supabase/WEEKLY_SYNC_DEBUG.md`
- Aguardar cron job (roda a cada hora)

**Se retornar >= 5 mas não aparece:**
- Edge Function pode não estar deployada
- Fazer deploy novamente
- Verificar logs da função

## 📊 Verificação Final

Execute este checklist para garantir que tudo funcionou:

```sql
-- 1. Ver weeks com 5+ episódios
SELECT 
  week_number,
  COUNT(*) FILTER (WHERE episode_score IS NOT NULL) as episodes_with_score,
  CASE 
    WHEN COUNT(*) FILTER (WHERE episode_score IS NOT NULL) >= 5 THEN '✅ VISIBLE'
    ELSE '❌ HIDDEN'
  END as status
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;
```

```bash
# 2. Testar endpoint
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-c1d1bfd8/available-weeks \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**3. Abrir o site:**
- [ ] HomePage mostra latest week
- [ ] WeekControl mostra apenas weeks com 5+ episódios
- [ ] Latest week está marcada como "current" (fundo amarelo)
- [ ] Logs aparecem no console

## 🎉 Próximos Passos

Após o deploy:

1. **Monitorar**: Verificar logs da Edge Function periodicamente
2. **Testar**: Quando Week 7 atingir 5+ episódios, deve aparecer automaticamente
3. **Documentar**: Compartilhar este guia com a equipe

## 📚 Documentação Relacionada

- **Como funciona**: `/supabase/AUTO_WEEK_DETECTION.md`
- **Testes SQL**: `/supabase/TEST_AUTO_WEEK.sql`
- **README**: `/supabase/AUTO_WEEK_README.md`
- **Forçar week a aparecer**: `/supabase/FORCE_WEEK_TO_APPEAR.md`

## 💡 Comandos Úteis

```bash
# Ver logs em tempo real
supabase functions logs server --tail

# Deploy específico de uma função
supabase functions deploy server

# Ver funções deployadas
supabase functions list

# Invocar função manualmente (teste)
supabase functions invoke server --body '{}' --method GET
```

## ✅ Pronto!

Depois de fazer o deploy da Edge Function:
- ✅ Weeks aparecem automaticamente quando atingem 5+ episódios com score
- ✅ HomePage mostra sempre a latest week
- ✅ Sem necessidade de atualizar código manualmente
- ✅ Sistema totalmente automático
