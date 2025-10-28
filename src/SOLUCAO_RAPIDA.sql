-- ============================================
-- SOLUÇÃO RÁPIDA - COPIE E COLE TUDO
-- ============================================
-- Este arquivo resolve o erro e configura tudo
-- Execute no Supabase SQL Editor
-- ============================================

-- PASSO 1: Limpar funções antigas (se existirem)
DROP FUNCTION IF EXISTS sync_week(INTEGER);
DROP FUNCTION IF EXISTS sync_all_weeks();
DROP FUNCTION IF EXISTS sync_season(TEXT, INTEGER);
DROP FUNCTION IF EXISTS sync_anticipated();
DROP FUNCTION IF EXISTS sync_everything();
DROP FUNCTION IF EXISTS sync_status();

SELECT '✅ PASSO 1: Funções antigas removidas' as status;

-- ============================================
-- PASSO 2: Agora cole AQUI EMBAIXO o conteúdo completo do arquivo:
-- /supabase/migrations/20241027000010_sync_functions.sql
-- ============================================

-- A migration atualizada já tem proteção contra esse erro!
-- Cole todo o conteúdo do arquivo 20241027000010_sync_functions.sql aqui:

-- [COLE AQUI]

-- ============================================
-- DEPOIS QUE COLAR A MIGRATION 010, 
-- CONFIGURE OS SETTINGS:
-- ============================================

/*
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://SEU-ID.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'SUA-KEY';
SELECT pg_reload_conf();

-- Habilitar HTTP
CREATE EXTENSION IF NOT EXISTS http;

-- Sincronizar
SELECT * FROM sync_everything();
*/
