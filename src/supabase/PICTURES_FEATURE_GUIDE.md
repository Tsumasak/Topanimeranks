# 🖼️ Guia de Implementação: Sistema de Múltiplas Imagens

## 📋 Resumo

Este guia descreve a implementação do sistema de múltiplas imagens para animes, permitindo exibir um carrossel de imagens nas páginas internas dos animes.

## 🎯 Funcionalidades Implementadas

### Backend (Edge Functions)
- ✅ Função `fetchAnimePictures()` adicionada em:
  - `/supabase/functions/sync-anime-data/index.ts`
  - `/supabase/functions/server/sync-season.tsx`
- ✅ Busca automática de imagens do endpoint `/pictures` do Jikan API
- ✅ Salvamento das imagens na coluna `pictures` (JSONB array) da tabela `season_rankings`

### Database
- ✅ Migration criada: `/supabase/migrations/20250121000001_add_pictures_to_season_rankings.sql`
- ✅ Adiciona coluna `pictures` (JSONB) na tabela `season_rankings`
- ✅ Índice GIN para buscas otimizadas

### Frontend
- ✅ Componente `AnimeHero.tsx` atualizado com:
  - Carrossel de imagens no lightbox
  - Thumbnails navegáveis abaixo da imagem principal
  - Suporte a fallback (se não houver pictures, usa image_url principal)

## 📦 Estrutura dos Dados

### Formato das Pictures no Banco (JSONB)
```json
[
  {
    "jpg": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1522/145800.jpg",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1522/145800t.jpg",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1522/145800l.jpg"
    },
    "webp": {
      "image_url": "https://cdn.myanimelist.net/images/anime/1522/145800.webp",
      "small_image_url": "https://cdn.myanimelist.net/images/anime/1522/145800t.webp",
      "large_image_url": "https://cdn.myanimelist.net/images/anime/1522/145800l.webp"
    }
  }
]
```

## 🚀 Como Aplicar

### 1. Aplicar Migration no Supabase

Via **Supabase Dashboard**:
1. Acesse o projeto no Supabase Dashboard
2. Vá em `SQL Editor`
3. Clique em `New Query`
4. Copie e cole o conteúdo de `/supabase/migrations/20250121000001_add_pictures_to_season_rankings.sql`
5. Execute a query

Via **Supabase CLI** (se tiver instalado):
```bash
supabase migration up
```

### 2. Verificar se a Coluna Foi Criada

Execute no SQL Editor:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'season_rankings' AND column_name = 'pictures';
```

Deve retornar:
```
column_name | data_type | column_default
------------|-----------|---------------
pictures    | jsonb     | '[]'::jsonb
```

### 3. Re-sincronizar Animes para Buscar Pictures

Após aplicar a migration, você precisa re-sincronizar os animes para buscar as pictures:

**Opção A: Via Admin Sync Page** (Recomendado)
1. Acesse `/admin-sync.html` no navegador
2. Clique em "Sync Season Animes"
3. Escolha a season (ex: Winter 2026)
4. Aguarde o sync completar

**Opção B: Via API Direta**
```bash
# Sync season específica (ex: Winter 2026)
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/make-server-c1d1bfd8/seasons/winter/2026 \
  -H "Authorization: Bearer [ANON_KEY]"
```

### 4. Testar com Anime Específico

Para testar rapidamente com o anime 59978 (conforme seu exemplo):

1. Execute no SQL Editor para verificar se o anime existe:
```sql
SELECT anime_id, title_english, 
       CASE 
         WHEN pictures IS NULL THEN 'NULL'
         WHEN jsonb_array_length(pictures) = 0 THEN 'Empty array'
         ELSE 'Has ' || jsonb_array_length(pictures) || ' pictures'
       END as pictures_status
FROM season_rankings
WHERE anime_id = 59978;
```

2. Se precisar forçar o fetch manual de pictures para este anime:
```javascript
// Adicione este código temporário em /admin-sync.html ou execute via console do navegador
async function fetchPicturesForAnime(animeId) {
  const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/pictures`);
  const data = await response.json();
  console.log(`Pictures for anime ${animeId}:`, data.data);
  return data.data;
}

// Executar
fetchPicturesForAnime(59978);
```

3. Acesse a página interna do anime:
```
http://localhost:5173/anime/59978
```

4. Clique na imagem do poster
5. Deve abrir o lightbox com a imagem principal e o carrossel de thumbnails abaixo

## 🔍 Troubleshooting

### "Pictures não aparecem no carrossel"

**Causa**: A coluna `pictures` está vazia ou NULL

**Solução**: 
1. Verifique se a migration foi aplicada
2. Re-sincronize a season que contém o anime
3. Verifique os logs da edge function para erros de rate limit do Jikan API

### "Erro de rate limit ao sincronizar"

**Causa**: Jikan API tem limite de 3 req/sec e 60 req/min

**Solução**:
- As edge functions já incluem delays (333ms entre requests)
- Se mesmo assim der erro, aguarde 1-2 minutos e tente novamente
- Para seasons grandes (Winter 2026), o sync pode levar 15-30 minutos

### "Apenas a imagem principal aparece"

**Causa**: Anime não tem pictures cadastradas no MAL

**Solução**: Normal! Nem todos os animes têm múltiplas imagens no MyAnimeList. O sistema faz fallback para `image_url` principal.

## 📊 Monitoramento

### Ver animes COM pictures:
```sql
SELECT anime_id, title_english, jsonb_array_length(pictures) as picture_count
FROM season_rankings
WHERE jsonb_array_length(pictures) > 0
ORDER BY picture_count DESC
LIMIT 20;
```

### Ver animes SEM pictures:
```sql
SELECT anime_id, title_english
FROM season_rankings
WHERE pictures IS NULL OR jsonb_array_length(pictures) = 0
ORDER BY members DESC
LIMIT 20;
```

### Estatísticas gerais:
```sql
SELECT 
  COUNT(*) as total_animes,
  COUNT(CASE WHEN jsonb_array_length(pictures) > 0 THEN 1 END) as with_pictures,
  COUNT(CASE WHEN pictures IS NULL OR jsonb_array_length(pictures) = 0 THEN 1 END) as without_pictures,
  ROUND(AVG(jsonb_array_length(pictures))::numeric, 2) as avg_pictures_per_anime
FROM season_rankings;
```

## 🎨 Customização do Frontend

O carrossel de thumbnails está em `/components/anime/AnimeHero.tsx`.

**Personalizar número de thumbnails visíveis:**
```tsx
// Linha ~408
<CarouselItem 
  className="pl-2 md:pl-4 basis-1/3 md:basis-1/5"  // 1/3 mobile, 1/5 desktop
>
```

**Ajustar altura dos thumbnails:**
```tsx
// Linha ~422
<img
  className="w-full h-[100px] object-cover"  // Altura de 100px
/>
```

## 📝 Notas Importantes

1. **Rate Limiting**: O Jikan API tem limites estritos (3 req/sec). As edge functions já implementam delays adequados.

2. **Pictures vazias**: Alguns animes no MAL não têm pictures extras. Isto é normal e o sistema faz fallback corretamente.

3. **Performance**: A coluna `pictures` usa JSONB com índice GIN, então as queries são otimizadas.

4. **Sincronização**: Novos animes sincronizados já virão com pictures automaticamente.

5. **Backward Compatibility**: Animes antigos sem pictures continuam funcionando normalmente (usam `image_url`).

## ✅ Checklist de Implementação

- [x] Migration criada e documentada
- [x] Edge function `sync-anime-data` atualizada
- [x] Edge function `sync-season` atualizada
- [x] Componente `AnimeHero.tsx` atualizado com carrossel
- [x] Fallback implementado para animes sem pictures
- [x] Documentação completa criada

## 🎯 Próximos Passos (Opcional)

- [ ] Adicionar lazy loading nas thumbnails do carrossel
- [ ] Implementar zoom in/out na imagem principal
- [ ] Adicionar indicador de posição (1/7, 2/7, etc.)
- [ ] Suporte a gestos de swipe em mobile
- [ ] Pre-loading das imagens adjacentes
