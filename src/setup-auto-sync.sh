#!/bin/bash

# ============================================
# Script de Setup Automático
# Configura o sistema de sync automático
# ============================================

echo "🚀 Configurando sistema de sync automático..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se Supabase CLI está instalado
echo "📦 Verificando Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI não encontrado!${NC}"
    echo ""
    echo "Por favor, instale o Supabase CLI primeiro:"
    echo ""
    echo "Windows (Chocolatey):"
    echo "  choco install supabase"
    echo ""
    echo "Windows (Scoop):"
    echo "  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    echo "  scoop install supabase"
    echo ""
    echo "Mac/Linux:"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI instalado${NC}"
echo ""

# 2. Login no Supabase
echo "🔐 Fazendo login no Supabase..."
supabase login
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha no login${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Login realizado${NC}"
echo ""

# 3. Link ao projeto
echo "🔗 Fazendo link ao projeto Supabase..."
echo ""
echo -e "${YELLOW}Digite o Project ID (encontre em: Supabase Dashboard → Settings → General):${NC}"
read -p "Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID não pode ser vazio${NC}"
    exit 1
fi

supabase link --project-ref "$PROJECT_ID"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha ao fazer link ao projeto${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Projeto linkado${NC}"
echo ""

# 4. Deploy Edge Functions
echo "🚀 Fazendo deploy das Edge Functions..."
echo ""

echo "  Deployando sync-anime-data..."
supabase functions deploy sync-anime-data
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha ao deployar sync-anime-data${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ sync-anime-data deployada${NC}"
echo ""

echo "  Deployando server..."
supabase functions deploy server
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha ao deployar server${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ server deployada${NC}"
echo ""

# 5. Instruções finais
echo ""
echo "============================================"
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO!${NC}"
echo "============================================"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Rodar as migrations no Supabase Dashboard:"
echo "   → Vá em: SQL Editor"
echo "   → Copie e cole: /supabase/migrations/20241027000001_initial_schema.sql"
echo "   → Clique RUN"
echo "   → Copie e cole: /supabase/migrations/20241027000002_setup_cron.sql"
echo "   → Clique RUN"
echo ""
echo "2. Verificar se o cron job está ativo:"
echo "   → No SQL Editor, rode: SELECT * FROM cron.job;"
echo ""
echo "3. Trigger o primeiro sync (opcional):"
echo "   → O cron job fará isso automaticamente em 10 minutos"
echo "   → Ou force manualmente via SQL (ver documentação)"
echo ""
echo "4. Rodar o site:"
echo "   → npm run dev"
echo ""
echo "============================================"
echo -e "${YELLOW}⚠️  LEMBRE-SE: As migrations precisam ser rodadas manualmente no Dashboard!${NC}"
echo "============================================"
echo ""
echo "📖 Documentação completa: /🎯_SISTEMA_AUTOMÁTICO.md"
echo ""
