-- ============================================
-- FIX PARA MIGRATION 010
-- ============================================
-- Execute este script se der erro de "cannot change return type"
-- ============================================

-- PASSO 1: Limpar funções antigas
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();

SELECT '✅ Funções antigas removidas!' as status;

-- ============================================
-- PASSO 2: Agora execute a Migration 010
-- ============================================
-- Copie e cole o arquivo completo:
-- /supabase/migrations/20241027000010_sync_functions.sql
-- ============================================

-- Ou continue abaixo com as funções corretas...
