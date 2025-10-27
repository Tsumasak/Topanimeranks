# ============================================
# Script de Setup Automático (PowerShell)
# Configura o sistema de sync automático
# ============================================

Write-Host "🚀 Configurando sistema de sync automático..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se Supabase CLI está instalado
Write-Host "📦 Verificando Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale o Supabase CLI primeiro:"
    Write-Host ""
    Write-Host "Windows (Chocolatey):" -ForegroundColor Cyan
    Write-Host "  choco install supabase"
    Write-Host ""
    Write-Host "Windows (Scoop):" -ForegroundColor Cyan
    Write-Host "  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    Write-Host "  scoop install supabase"
    Write-Host ""
    exit 1
}
Write-Host "✅ Supabase CLI instalado" -ForegroundColor Green
Write-Host ""

# 2. Login no Supabase
Write-Host "🔐 Fazendo login no Supabase..." -ForegroundColor Yellow
supabase login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha no login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Login realizado" -ForegroundColor Green
Write-Host ""

# 3. Link ao projeto
Write-Host "🔗 Fazendo link ao projeto Supabase..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Digite o Project ID (encontre em: Supabase Dashboard → Settings → General):" -ForegroundColor Cyan
$ProjectId = Read-Host "Project ID"

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    Write-Host "❌ Project ID não pode ser vazio" -ForegroundColor Red
    exit 1
}

supabase link --project-ref $ProjectId
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao fazer link ao projeto" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Projeto linkado" -ForegroundColor Green
Write-Host ""

# 4. Deploy Edge Functions
Write-Host "🚀 Fazendo deploy das Edge Functions..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Deployando sync-anime-data..." -ForegroundColor Cyan
supabase functions deploy sync-anime-data
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Falha ao deployar sync-anime-data" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ sync-anime-data deployada" -ForegroundColor Green
Write-Host ""

Write-Host "  Deployando server..." -ForegroundColor Cyan
supabase functions deploy server
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Falha ao deployar server" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ server deployada" -ForegroundColor Green
Write-Host ""

# 5. Instruções finais
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:"
Write-Host ""
Write-Host "1. Rodar as migrations no Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "   → Vá em: SQL Editor"
Write-Host "   → Copie e cole: /supabase/migrations/20241027000001_initial_schema.sql"
Write-Host "   → Clique RUN"
Write-Host "   → Copie e cole: /supabase/migrations/20241027000002_setup_cron.sql"
Write-Host "   → Clique RUN"
Write-Host ""
Write-Host "2. Verificar se o cron job está ativo:" -ForegroundColor Cyan
Write-Host "   → No SQL Editor, rode: SELECT * FROM cron.job;"
Write-Host ""
Write-Host "3. Trigger o primeiro sync (opcional):" -ForegroundColor Cyan
Write-Host "   → O cron job fará isso automaticamente em 10 minutos"
Write-Host "   → Ou force manualmente via SQL (ver documentação)"
Write-Host ""
Write-Host "4. Rodar o site:" -ForegroundColor Cyan
Write-Host "   → npm run dev"
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "⚠️  LEMBRE-SE: As migrations precisam ser rodadas manualmente no Dashboard!" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Documentação completa: /🎯_SISTEMA_AUTOMÁTICO.md" -ForegroundColor Cyan
Write-Host ""
