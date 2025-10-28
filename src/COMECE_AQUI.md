# 🚀 COMEÇAR AQUI - SISTEMA AUTOMÁTICO

## ⚡ 2 PASSOS SIMPLES

### **PASSO 1: Criar Tabela**

Abra **Supabase SQL Editor** e execute:

```sql
-- Cole o arquivo: /EXECUTAR_AGORA.sql
```

✅ Isso cria a tabela `weekly_episodes` vazia.

---

### **PASSO 2: Popular Automaticamente**

**Via curl:**

```bash
curl -X POST https://SEU-ID.supabase.co/functions/v1/make-server-c1d1bfd8/sync-fall-2024 \
  -H "Authorization: Bearer SUA-ANON-KEY"
```

**Ou crie um botão no frontend:**

```tsx
<button onClick={async () => {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/sync-fall-2024`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    }
  );
  const result = await response.json();
  alert(`✅ ${result.episodes} episódios sincronizados!`);
}}>
  🔄 Sincronizar Fall 2024
</button>
```

---

## 🎯 O QUE ACONTECE

```
1️⃣ Busca animes Fall 2024 do Jikan API
2️⃣ Filtra apenas com 5000+ membros
3️⃣ Busca episódios de cada anime
4️⃣ Organiza por semanas (1-13)
5️⃣ Calcula posição no ranking
6️⃣ Popula tabela AUTOMATICAMENTE
```

**Tempo:** 5-10 minutos (rate limit do Jikan)

---

## 📚 DOCUMENTAÇÃO

- **`/SYNC_AUTOMATICO.md`** - Guia completo
- **`/README_WEEKLY_EPISODES.md`** - Resumo técnico
- **`/EXECUTAR_AGORA.sql`** - Script SQL

---

## ✅ VERIFICAR RESULTADO

```sql
-- Ver total
SELECT COUNT(*) FROM weekly_episodes;

-- Ver episódios da Week 1
SELECT 
  anime_title_english,
  episode_number,
  episode_name,
  episode_score,
  position_in_week
FROM weekly_episodes
WHERE week_number = 1
ORDER BY position_in_week
LIMIT 10;
```

---

## 📋 ESTRUTURA COMPLETA

```sql
weekly_episodes {
  -- Dados do anime (Jikan API)
  anime_id              INTEGER
  anime_title_english   TEXT
  anime_image_url       TEXT
  from_url              TEXT
  type                  TEXT
  status                TEXT
  demographic           JSONB
  genre                 JSONB
  theme                 JSONB
  
  -- Dados do episódio (Jikan API)
  episode_number        INTEGER
  episode_name          TEXT
  episode_score         NUMERIC
  aired_at              TIMESTAMPTZ
  
  -- Organização (calculado automaticamente)
  week_number           INTEGER
  position_in_week      INTEGER
  is_manual             BOOLEAN
}
```

---

**Próximo:** Execute `/EXECUTAR_AGORA.sql` agora! 🚀
