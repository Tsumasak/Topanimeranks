# 🖼️ Sistema de Múltiplas Imagens (Pictures)

## 📋 Visão Geral

Sistema implementado para buscar, armazenar e exibir múltiplas imagens de animes obtidas do Jikan API endpoint `/pictures`.

## 🏗️ Arquitetura

### 1. Backend (Edge Functions)

**Função Helper:**
```typescript
async function fetchAnimePictures(animeId: number): Promise<any[]>
```

**Onde está implementada:**
- `/supabase/functions/sync-anime-data/index.ts`
- `/supabase/functions/server/sync-season.tsx`

**Comportamento:**
- Faz request para `https://api.jikan.moe/v4/anime/{id}/pictures`
- Retorna array de objetos com estrutura: `{jpg: {...}, webp: {...}}`
- Inclui delay de 333ms para respeitar rate limit (3 req/sec)
- Em caso de erro, retorna array vazio `[]`

**Integração com Sync:**
```typescript
// 🖼️ Fetch pictures from Jikan API
const pictures = await fetchAnimePictures(anime.mal_id);
await delay(RATE_LIMIT_DELAY);

const seasonAnime = {
  // ... outros campos
  pictures: pictures, // 🖼️ Add pictures array
};
```

### 2. Database

**Schema:**
```sql
ALTER TABLE season_rankings 
ADD COLUMN pictures JSONB DEFAULT '[]'::jsonb;

CREATE INDEX idx_season_rankings_pictures 
ON season_rankings USING GIN (pictures);
```

**Tipo de dado:** JSONB (PostgreSQL)
**Default:** Array vazio `[]`
**Índice:** GIN (otimizado para queries em JSONB)

**Estrutura dos dados:**
```json
[
  {
    "jpg": {
      "image_url": "https://cdn.myanimelist.net/...",
      "small_image_url": "https://cdn.myanimelist.net/...t.jpg",
      "large_image_url": "https://cdn.myanimelist.net/...l.jpg"
    },
    "webp": {
      "image_url": "https://cdn.myanimelist.net/...",
      "small_image_url": "https://cdn.myanimelist.net/...t.webp",
      "large_image_url": "https://cdn.myanimelist.net/...l.webp"
    }
  }
]
```

### 3. Frontend

**Componente:** `/components/anime/AnimeHero.tsx`

**Estado:**
```typescript
const [lightboxOpen, setLightboxOpen] = useState(false);
const [selectedImageIndex, setSelectedImageIndex] = useState(0);
```

**Processamento de Pictures:**
```typescript
const allPictures = anime.pictures && Array.isArray(anime.pictures) && anime.pictures.length > 0
  ? anime.pictures.map((pic: any) => ({
      large: pic.jpg?.large_image_url || pic.webp?.large_image_url || pic.jpg?.image_url || pic.webp?.image_url,
      small: pic.jpg?.small_image_url || pic.webp?.small_image_url || pic.jpg?.image_url || pic.webp?.image_url,
    }))
  : [{ large: anime.image_url, small: anime.image_url }]; // Fallback
```

**UI Components:**
- Imagem principal (large)
- Carrossel de thumbnails (small) usando `<Carousel>` do shadcn/ui
- Botão de fechar
- Navegação prev/next

## 🔄 Fluxo de Dados

```
┌─────────────┐
│ Jikan API   │
│ /pictures   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ fetchAnimePictures()│
│   (Edge Function)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Supabase DB        │
│  season_rankings    │
│  column: pictures   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Frontend           │
│  AnimeHero.tsx      │
│  (Carrossel)        │
└─────────────────────┘
```

## 📊 Queries Úteis

### Buscar anime com pictures:
```sql
SELECT anime_id, title_english, pictures
FROM season_rankings
WHERE anime_id = 59978;
```

### Contar pictures por anime:
```sql
SELECT anime_id, title_english, 
       jsonb_array_length(pictures) as picture_count
FROM season_rankings
WHERE jsonb_array_length(pictures) > 0
ORDER BY picture_count DESC;
```

### Extrair URLs individuais:
```sql
SELECT anime_id, 
       jsonb_array_elements(pictures)->'jpg'->>'large_image_url' as url
FROM season_rankings
WHERE anime_id = 59978;
```

### Estatísticas:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN jsonb_array_length(pictures) > 0 THEN 1 END) as with_pics,
  ROUND(AVG(jsonb_array_length(pictures))::numeric, 2) as avg_pics
FROM season_rankings;
```

## ⚠️ Considerações Importantes

### 1. Rate Limiting
- Jikan API: 3 req/sec, 60 req/min
- Delay implementado: 333ms entre requests
- Em caso de 429 (rate limit), aguarda 3 segundos e retenta

### 2. Fallback Strategy
```typescript
// Se pictures está vazio ou null → usa image_url principal
const allPictures = anime.pictures?.length > 0 
  ? anime.pictures.map(...) 
  : [{ large: anime.image_url, small: anime.image_url }];
```

### 3. Performance
- JSONB com índice GIN = queries rápidas
- Thumbnails usam `small_image_url` (menor tamanho)
- Imagem principal usa `large_image_url` (melhor qualidade)

### 4. Backward Compatibility
- Animes antigos sem pictures funcionam normalmente
- Campo `pictures` tem default `[]`
- Frontend verifica existência antes de renderizar carrossel

## 🧪 Testes

### Teste Manual (Anime 59978)
```sql
-- 1. Inserir pictures de teste
UPDATE season_rankings
SET pictures = '[...]'::jsonb  -- JSON completo no arquivo de teste
WHERE anime_id = 59978;

-- 2. Verificar
SELECT jsonb_array_length(pictures) FROM season_rankings WHERE anime_id = 59978;
-- Deve retornar: 7

-- 3. Frontend
-- Acessar /anime/59978
-- Clicar no poster
-- Verificar carrossel com 7 imagens
```

### Teste Automático (Sync Completo)
```bash
# Via API
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/make-server-c1d1bfd8/seasons/winter/2026

# Via Admin Page
# Acessar /admin-sync.html → Sync Season Animes
```

## 🐛 Troubleshooting

### Pictures não aparecem
**Causa:** Coluna não existe ou pictures está vazio
**Solução:** 
1. Verificar migration aplicada
2. Re-sincronizar season
3. Checar logs da edge function

### Erro de rate limit
**Causa:** Muitos requests ao Jikan
**Solução:**
- Delays já implementados (333ms)
- Aguardar 1-2 minutos entre syncs
- Syncs grandes (Winter 2026) levam 15-30min

### Apenas 1 imagem no carrossel
**Causa:** Anime não tem pictures no MAL (normal)
**Solução:** Isso é esperado. Sistema faz fallback para image_url

## 📝 Checklist de Manutenção

Ao modificar o sistema de pictures, verificar:

- [ ] `fetchAnimePictures()` implementada nas edge functions
- [ ] Delay de rate limit respeitado (333ms)
- [ ] Campo `pictures` incluído no objeto de upsert
- [ ] Fallback para `image_url` implementado no frontend
- [ ] Carrossel só renderiza se `pictures.length > 1`
- [ ] Logs de erro adequados (console.error)

## 🔗 Arquivos Relacionados

**Backend:**
- `/supabase/functions/sync-anime-data/index.ts`
- `/supabase/functions/server/sync-season.tsx`

**Database:**
- `/supabase/migrations/20250121000001_add_pictures_to_season_rankings.sql`

**Frontend:**
- `/components/anime/AnimeHero.tsx`
- `/components/ui/carousel.tsx`

**Documentação:**
- `/supabase/PICTURES_FEATURE_GUIDE.md` (guia completo)
- `/supabase/TEST_PICTURES_ANIME_59978.sql` (script de teste)
- `/PICTURES_IMPLEMENTATION.md` (resumo de implementação)
- `/guidelines/PICTURES_SYSTEM.md` (este arquivo)

## 🎯 Conclusão

Sistema completo e funcional que:
✅ Busca pictures automaticamente do Jikan API
✅ Armazena em JSONB otimizado
✅ Exibe carrossel interativo no frontend
✅ Tem fallback para animes sem pictures
✅ Respeita rate limits da API
✅ É backward compatible

---

**Última atualização:** 2026-01-21
**Status:** ✅ Produção
