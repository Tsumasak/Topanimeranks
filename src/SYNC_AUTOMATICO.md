# 🚀 SYNC AUTOMÁTICO - FALL 2024

## 📋 O QUE FAZ

Sistema **TOTALMENTE AUTOMÁTICO** que:

1. ✅ Busca todos os animes da temporada **Fall 2024** do Jikan API
2. ✅ Filtra apenas animes com **5000+ membros** (mesma regra do site)
3. ✅ Busca todos os episódios de cada anime
4. ✅ Organiza automaticamente por **semanas** baseado na data de exibição
5. ✅ Calcula **posição no ranking** de cada episódio por semana (baseado em score)
6. ✅ Popula a tabela `weekly_episodes` com TUDO preenchido

---

## ⚡ COMO USAR (2 PASSOS)

### **PASSO 1: Criar Tabela**

No **Supabase SQL Editor**, execute:

```sql
-- Cole o arquivo completo:
/supabase/migrations/20241028000002_weekly_episodes_auto.sql
```

✅ Isso cria a tabela `weekly_episodes` com todas as colunas corretas.

---

### **PASSO 2: Rodar Sync Automático**

**Opção A - Via curl:**

```bash
curl -X POST https://SEU-ID.supabase.co/functions/v1/make-server-c1d1bfd8/sync-fall-2024 \
  -H "Authorization: Bearer SUA-ANON-KEY"
```

**Opção B - Via código JavaScript:**

```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/sync-fall-2024`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  }
);

const result = await response.json();
console.log(`✅ ${result.episodes} episódios sincronizados!`);
console.log(`📊 ${result.animes} animes processados`);
```

**Opção C - Criar um botão no frontend:**

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
  alert(`Sincronizados: ${result.episodes} episódios!`);
}}>
  🔄 Sincronizar Fall 2024
</button>
```

---

## 📊 ESTRUTURA DA TABELA

```sql
weekly_episodes {
  id                    UUID           -- Gerado automaticamente
  
  -- Dados do anime (buscados de /anime/{id})
  anime_id              INTEGER        -- mal_id
  anime_title_english   TEXT           -- titles[type="English"].title
  anime_image_url       TEXT           -- images.jpg.large_image_url
  from_url              TEXT           -- url
  type                  TEXT           -- type (TV, Movie, OVA)
  status                TEXT           -- status (Airing, Finished)
  demographic           JSONB          -- demographics[].name
  genre                 JSONB          -- genres[].name
  theme                 JSONB          -- themes[].name
  
  -- Dados do episódio (buscados de /anime/{id}/episodes)
  episode_number        INTEGER        -- mal_id
  episode_name          TEXT           -- title
  episode_score         NUMERIC(4,2)   -- score
  aired_at              TIMESTAMPTZ    -- aired
  
  -- Organização (calculado automaticamente)
  week_number           INTEGER        -- Calculado pela data aired_at
  position_in_week      INTEGER        -- Ranking por score dentro da semana
  
  -- Metadata
  is_manual             BOOLEAN        -- false (tudo automático)
  created_at            TIMESTAMPTZ
  updated_at            TIMESTAMPTZ
}
```

---

## 🔍 COMO FUNCIONA

### **1. Buscar Animes Fall 2024:**

```
GET https://api.jikan.moe/v4/seasons/2024/fall?page=1&limit=25
```

Retorna todos os animes da temporada.

**Filtro:** Apenas `members >= 5000`

---

### **2. Para cada anime, buscar episódios:**

```
GET https://api.jikan.moe/v4/anime/{anime_id}/episodes
```

Retorna lista de episódios com `mal_id`, `title`, `score`, `aired`.

---

### **3. Calcular semana:**

```typescript
const seasonStart = new Date('2024-10-01'); // Início Fall 2024
const aired = new Date(episode.aired);
const weekNumber = Math.floor((aired - seasonStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
```

Episódios são organizados em **weeks 1-13** baseado na data de exibição.

---

### **4. Calcular posição:**

Após inserir todos os episódios, o sistema ordena por `episode_score` dentro de cada `week_number` e atribui `position_in_week`.

---

## ✅ VERIFICAR RESULTADO

```sql
-- Total de episódios
SELECT COUNT(*) FROM weekly_episodes;

-- Episódios por semana
SELECT week_number, COUNT(*) as total
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;

-- Top 10 episódios da Week 1
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

-- Animes únicos
SELECT COUNT(DISTINCT anime_id) as total_animes
FROM weekly_episodes;
```

---

## 🎯 EXEMPLO DE DADOS

Após rodar o sync, a tabela terá dados assim:

| anime_title_english | episode_number | episode_name | episode_score | week_number | position_in_week |
|---------------------|----------------|--------------|---------------|-------------|------------------|
| My Hero Academia Final Season | 1 | Full Power!! | 8.45 | 1 | 1 |
| Bleach: TYBW - Part 3 | 16 | The Fundamental Virulence | 8.89 | 1 | 2 |
| Dandadan | 1 | That's How Love Starts, Ya Know! | 8.92 | 1 | 3 |
| Blue Lock vs. U-20 Japan | 1 | Tryouts | 7.23 | 1 | 4 |
| Re:ZERO Season 3 | 3 | The King of the Demihuman | 8.11 | 1 | 5 |

---

## ⏱️ TEMPO DE EXECUÇÃO

- **~125 animes** da temporada Fall 2024
- **~50 animes** após filtro de 5000+ membros
- **~10 episódios** por anime em média
- **= ~500 episódios** totais

**Tempo estimado:** 5-10 minutos (por causa do rate limit do Jikan: 3 req/sec)

---

## 🔄 RE-SINCRONIZAR

Para atualizar dados (novos episódios, scores atualizados):

```bash
# Limpar tabela
TRUNCATE weekly_episodes;

# Rodar sync novamente
curl -X POST https://SEU-ID.supabase.co/functions/v1/make-server-c1d1bfd8/sync-fall-2024 \
  -H "Authorization: Bearer SUA-ANON-KEY"
```

---

## 🆘 TROUBLESHOOTING

### **"Erro 429 - Rate Limit"**

O sistema já tem delays automáticos (333ms entre requisições).
Se ainda assim der erro, aguarde 1 minuto e tente novamente.

---

### **"Episódios sem week_number"**

Episódios sem `aired_at` são atribuídos à week 1 por padrão.

---

### **"Poucos episódios retornados"**

Alguns animes podem não ter episódios cadastrados ainda no MAL.
Isso é normal para animes que ainda não estrearam.

---

## 📁 ARQUIVOS

- ✅ `/supabase/migrations/20241028000002_weekly_episodes_auto.sql` - Migration
- ✅ `/supabase/functions/server/sync-fall-2024.tsx` - Função de sync
- ✅ `/supabase/functions/server/index.tsx` - Rota POST
- ✅ `/SYNC_AUTOMATICO.md` - Este arquivo

---

## 🎉 PRONTO!

Você só precisa:

1. ✅ Executar a migration
2. ✅ Chamar o endpoint `/sync-fall-2024`
3. ✅ Aguardar o processamento
4. ✅ Ver os dados preenchidos!

**Tudo automático, nada manual!** 🚀
