-- Passo 1: Remove animes com year = 9999 em season_rankings 
-- se existirem em anticipated_animes_backup com datas VÁLIDAS.

DELETE FROM season_rankings 
WHERE year = 9999 
AND anime_id IN (
    SELECT anime_id FROM anticipated_animes_backup 
    WHERE year IS NOT NULL AND year < 9999
);

-- Passo 2 (Fallback opcional): Caso haja algum outro travado sem estar no backup
-- Isso garantirá que da próxima vez que rodar o sync de verão/outono 2026, 
-- ele sobrescreva qualquer lixo. Se quiser zerar TODOS os 9999 pra baixar tudo limpo:
-- DELETE FROM season_rankings WHERE year = 9999;
-- (Mas é melhor manter apenas a querie do Passo 1 para não perder animes que realmente são "later").
