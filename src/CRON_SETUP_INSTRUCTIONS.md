# 🚀 INSTRUÇÕES: Configuração de Crons no Supabase

## ✅ MUDANÇAS IMPLEMENTADAS

As seguintes Edge Functions foram atualizadas para suportar processamento dinâmico de weeks:
- ✅ `/supabase/functions/insert-weekly-episodes/index.ts`
- ✅ `/supabase/functions/update-weekly-episodes/index.ts`

Ambas agora aceitam `week_number` via POST body com os seguintes valores:
- `"current"` - Processa a week atual
- `"current-1"` - Processa a week anterior
- `"current-2"` - Processa 2 weeks atrás
- `1`, `2`, `3`, etc. - Processa week específica (número)
- `undefined` - Auto-detecta week atual (comportamento padrão)

---

## 📋 PASSO A PASSO: O QUE FAZER NO SUPABASE

### **PASSO 1: Deploy das Edge Functions** 🚀

1. Abra o terminal na raiz do projeto
2. Execute os comandos de deploy:

```bash
# Deploy insert-weekly-episodes
supabase functions deploy insert-weekly-episodes

# Deploy update-weekly-episodes
supabase functions deploy update-weekly-episodes
```

3. Aguarde até ver a mensagem de sucesso:
   ```
   ✅ Deployed Function insert-weekly-episodes
   ✅ Deployed Function update-weekly-episodes
   ```

---

### **PASSO 2: Deletar Crons Antigas** 🗑️

Antes de criar as novas crons, você precisa **DELETAR as crons antigas** que processam múltiplas weeks.

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"Edge Functions"**
4. Clique na aba **"Cron Jobs"**
5. **DELETE as seguintes crons** (se existirem):

| Nome da Cron | Ação |
|-------------|------|
| `insert-weekly-episodes-daily` | ❌ DELETAR |
| `insert-weekly-episodes-hourly` | ❌ DELETAR |
| `update-weekly-episodes-hourly` | ❌ DELETAR |
| `update-weekly-episodes-daily` | ❌ DELETAR |
| Qualquer outra cron relacionada a `insert` ou `update` | ❌ DELETAR |

**⚠️ IMPORTANTE:** Certifique-se de deletar TODAS as crons antigas relacionadas a insert/update antes de criar as novas!

---

### **PASSO 3: Criar Novas Crons** ⏰

Agora você vai criar **6 novas crons** (3 para insert, 3 para update).

#### **📥 CRONS DE INSERT (3 crons)**

##### **Cron 1: Insert Current Week (Diário - 6:00 AM)**
```
Nome: insert-current-week
Function: insert-weekly-episodes
Schedule (Cron): 0 6 * * *
HTTP Request Method: POST
HTTP Headers: 
  Content-Type: application/json
HTTP Body:
  {"week_number":"current"}
```

##### **Cron 2: Insert Previous Week (Diário - 8:00 AM)**
```
Nome: insert-previous-week
Function: insert-weekly-episodes
Schedule (Cron): 0 8 * * *
HTTP Request Method: POST
HTTP Headers: 
  Content-Type: application/json
HTTP Body:
  {"week_number":"current-1"}
```

##### **Cron 3: Insert 2 Weeks Ago (Domingos - 10:00 AM)**
```
Nome: insert-2-weeks-ago
Function: insert-weekly-episodes
Schedule (Cron): 0 10 * * 0
HTTP Request Method: POST
HTTP Headers: 
  Content-Type: application/json
HTTP Body:
  {"week_number":"current-2"}
```

---

#### **🔄 CRONS DE UPDATE (3 crons)**

##### **Cron 4: Update Current Week (A cada 2 horas)**
```
Nome: update-current-week
Function: update-weekly-episodes
Schedule (Cron): 0 */2 * * *
HTTP Request Method: POST
HTTP Headers: 
  Content-Type: application/json
HTTP Body:
  {"week_number":"current"}
```

##### **Cron 5: Update Previous Week (A cada 6 horas)**
```
Nome: update-previous-week
Function: update-weekly-episodes
Schedule (Cron): 0 */6 * * *
HTTP Request Method: POST
HTTP Headers: 
  Content-Type: application/json
HTTP Body:
  {"week_number":"current-1"}
```

##### **Cron 6: Update 2 Weeks Ago (Diário - Meia-noite)**
```
Nome: update-2-weeks-ago
Function: update-weekly-episodes
Schedule (Cron): 0 0 * * *
HTTP Request Method: POST
HTTP Headers: 
  Content-Type: application/json
HTTP Body:
  {"week_number":"current-2"}
```

---

### **PASSO 4: Como Criar Cada Cron no Dashboard** 🖱️

Para CADA cron listada acima:

1. No Supabase Dashboard, vá em **Edge Functions > Cron Jobs**
2. Clique no botão **"Create a new Cron Job"**
3. Preencha os campos:
   - **Name:** (nome da cron, ex: `insert-current-week`)
   - **Function:** Selecione a function no dropdown (ex: `insert-weekly-episodes`)
   - **Schedule:** Digite o cron schedule (ex: `0 6 * * *`)
   - **HTTP Request:**
     - Method: `POST`
     - Headers: Clique em "Add Header"
       - Key: `Content-Type`
       - Value: `application/json`
     - Body: Cole o JSON (ex: `{"week_number":"current"}`)
4. Clique em **"Create Cron Job"**
5. Repita para todas as 6 crons

---

### **PASSO 5: Verificar Configuração** ✅

Após criar todas as crons, verifique se tudo está correto:

1. No dashboard, vá em **Edge Functions > Cron Jobs**
2. Você deve ver **6 crons ativas**:
   - ✅ `insert-current-week`
   - ✅ `insert-previous-week`
   - ✅ `insert-2-weeks-ago`
   - ✅ `update-current-week`
   - ✅ `update-previous-week`
   - ✅ `update-2-weeks-ago`

3. Clique em cada uma e verifique:
   - ✅ Function correta selecionada
   - ✅ Schedule correto
   - ✅ Body com JSON correto

---

### **PASSO 6: Testar Manualmente (Opcional)** 🧪

Para testar se está funcionando:

1. No dashboard, vá em **Edge Functions > Cron Jobs**
2. Clique em uma das crons (ex: `insert-current-week`)
3. Clique no botão **"Run Now"** ou **"Trigger Manually"**
4. Aguarde a execução
5. Vá em **Edge Functions > Logs** para ver os resultados
6. Procure por logs como:
   ```
   📅 Using current week: 5
   📅 Processing week: 5
   ✅ Week 5 INSERT completed!
   ```

---

## 📊 RESUMO DAS CRONS

| Nome | Function | Frequência | Week | Propósito |
|------|----------|-----------|------|-----------|
| `insert-current-week` | `insert-weekly-episodes` | Diário 6AM | `current` | Insere episódios da semana atual |
| `insert-previous-week` | `insert-weekly-episodes` | Diário 8AM | `current-1` | Pega atrasos da semana passada |
| `insert-2-weeks-ago` | `insert-weekly-episodes` | Domingo 10AM | `current-2` | Pega atrasos de 2 weeks atrás |
| `update-current-week` | `update-weekly-episodes` | A cada 2h | `current` | Atualiza scores da semana atual |
| `update-previous-week` | `update-weekly-episodes` | A cada 6h | `current-1` | Atualiza scores da semana passada |
| `update-2-weeks-ago` | `update-weekly-episodes` | Diário 0:00 | `current-2` | Atualiza scores de 2 weeks atrás |

---

## 🎯 BENEFÍCIOS DESSA CONFIGURAÇÃO

✅ **Zero Timeouts:** Cada cron processa apenas 1 week = ~50-80 segundos  
✅ **Pega Atrasos:** Episódios adicionados tardiamente no Jikan são sincronizados  
✅ **Scores Atualizados:** Weeks antigas também recebem updates de scores  
✅ **Flexível:** Fácil adicionar ou remover weeks sem mexer no código  
✅ **Logs Claros:** Cada cron tem seus próprios logs independentes  

---

## 🐛 TROUBLESHOOTING

### **Problema: Cron não está executando**
- Verifique se o schedule está correto (formato cron: `minuto hora dia mês dia-da-semana`)
- Certifique-se que a cron está **habilitada** (toggle verde)

### **Problema: Erro "Function not found"**
- Certifique-se que fez o **deploy** das functions (Passo 1)
- Verifique se selecionou a function correta no dropdown

### **Problema: Erro "Invalid JSON"**
- Verifique se o HTTP Body está no formato correto: `{"week_number":"current"}`
- Certifique-se que o Header `Content-Type: application/json` está configurado

### **Problema: Week errada sendo processada**
- Verifique se o `week_number` no Body está correto
- Vá em **Edge Functions > Logs** e procure por linhas como:
  ```
  📅 Using current week: X
  ```

---

## 📝 MANUTENÇÃO FUTURA

### **Para adicionar uma nova week:**
1. Crie uma nova cron no dashboard
2. Escolha a function (`insert-weekly-episodes` ou `update-weekly-episodes`)
3. Configure o schedule
4. No HTTP Body, use: `{"week_number":"current-3"}` (ou qualquer offset)

### **Para remover uma week:**
1. Vá em **Edge Functions > Cron Jobs**
2. Encontre a cron
3. Clique nos 3 pontinhos (...) > **Delete**

---

**✅ Configuração Completa! Suas crons estão prontas para rodar! 🎉**
