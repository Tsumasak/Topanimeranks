# Guia para Adicionar Episódios Manualmente

Este guia explica como adicionar episódios manualmente ao sistema de ranking.

## Estrutura dos Dados

Os episódios são armazenados em arquivos separados por semana em `/data/`:
- `week1.ts` - Semana 1 (29 Set - 05 Out, 2025)
- `week2.ts` - Semana 2 (06 Out - 12 Out, 2025)
- `week3.ts` - Semana 3 (13 Out - 19 Out, 2025)
- `week4.ts` - Semana 4 (20 Out - 26 Out, 2025)

## Formato dos Dados

Cada episódio deve seguir esta estrutura:

```typescript
{
  id: number,              // ID único do episódio (incremental)
  rank: number,            // Posição no ranking (1, 2, 3, 4, etc.)
  title: string,           // Título do anime em inglês
  subtitle: string,        // Informações do episódio: "Episódio X - Título do Episódio"
  rating: number,          // Rating de 1.00 a 5.00
  imageUrl: string,        // URL da imagem do anime
  animeType: string,       // Tipo: "TV", "ONA", "Movie", etc.
  demographics: string[],  // ["Shounen"], ["Seinen"], ["Shoujo"], ["Josei"]
  genres: string[],        // ["Action", "Adventure", "Comedy", etc.]
  themes: string[]         // ["School", "Super Power", "Military", etc.]
}
```

## Método 1: Editar Arquivo Diretamente

1. Abra o arquivo da semana desejada (ex: `/data/week1.ts`)
2. Adicione o novo episódio seguindo o formato acima
3. Certifique-se de:
   - Usar um ID único
   - Ajustar os ranks se necessário (reordenar)
   - Rating entre 1.00 e 5.00
   - Incluir vírgula no final do objeto (exceto o último)

### Exemplo:

```typescript
export const week1Animes: Anime[] = [
  {
    id: 1,
    rank: 1,
    title: "Demon Slayer: Kimetsu no Yaiba",
    subtitle: "Episode 1 - Cruelty",
    rating: 4.85,
    imageUrl: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    animeType: "TV",
    demographics: ["Shounen"],
    genres: ["Action", "Fantasy"],
    themes: ["Historical"]
  },
  // ... mais episódios
];
```

## Método 2: Usar Script Helper

Use o arquivo `/scripts/add-episode.ts` para adicionar episódios de forma mais fácil.

### Como usar:

1. Abra `/scripts/add-episode.ts`
2. Preencha os dados do episódio na seção "CONFIGURAÇÃO"
3. O script irá gerar o código formatado que você pode copiar e colar

## Método 3: Buscar da API Jikan (Automático)

O sistema já busca automaticamente episódios da API Jikan. Para forçar uma atualização:

1. Abra o aplicativo
2. Clique no botão "Debug Panel" (canto inferior direito)
3. Clique em "Clear All Cache"
4. Recarregue a página

Isso forçará o sistema a buscar novamente os episódios da semana atual.

## Dicas Importantes

### IDs Únicos
- Cada episódio precisa de um ID único
- Use números sequenciais: 1, 2, 3, 4, 5...
- Se tiver 10 episódios em week1, comece week2 com ID 11

### Ratings
- Valores de 1.00 a 5.00
- Use casas decimais: 4.85, 4.72, 4.50
- Episódios com rating mais alto ficam em posições melhores

### Rankings
- Rank 1, 2, 3 terão badges especiais (ouro, prata, bronze)
- Rank 4+ terá pills numerados
- Organize por ordem decrescente de rating

### Imagens
- Use URLs diretas de imagens
- Recomendado: MyAnimeList (cdn.myanimelist.net)
- Alternativa: Unsplash para imagens genéricas
- Tamanho recomendado: 225x350px (proporção 3:4)

### Demographics
- Valores válidos: "Shounen", "Seinen", "Shoujo", "Josei"
- Use apenas um demographic por anime
- Afeta a cor da tag no card

### Anime Type
- Valores comuns: "TV", "ONA", "Movie", "OVA", "Special"
- Afeta a cor da tag no card

## Validação de Dados

Antes de salvar, verifique:

- [ ] Todos os campos obrigatórios preenchidos
- [ ] IDs são únicos dentro do arquivo
- [ ] Ratings entre 1.00 e 5.00
- [ ] imageUrl é uma URL válida
- [ ] Vírgulas corretas (exceto no último item)
- [ ] Arrays de demographics, genres, themes estão entre colchetes
- [ ] Strings estão entre aspas

## Exemplo Completo de Arquivo

```typescript
export interface Anime {
  id: number;
  rank: number;
  title: string;
  subtitle: string;
  rating: number;
  imageUrl: string;
  animeType?: string;
  demographics?: string[];
  genres?: string[];
  themes?: string[];
}

export const week1Animes: Anime[] = [
  {
    id: 1,
    rank: 1,
    title: "Attack on Titan",
    subtitle: "Episode 75 - The Final Season",
    rating: 4.92,
    imageUrl: "https://cdn.myanimelist.net/images/anime/1000/110531.jpg",
    animeType: "TV",
    demographics: ["Shounen"],
    genres: ["Action", "Drama"],
    themes: ["Military", "Survival"]
  },
  {
    id: 2,
    rank: 2,
    title: "Jujutsu Kaisen",
    subtitle: "Episode 24 - Accomplish",
    rating: 4.88,
    imageUrl: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
    animeType: "TV",
    demographics: ["Shounen"],
    genres: ["Action", "Fantasy"],
    themes: ["School"]
  },
];
```

## Troubleshooting

### Erro: "Unexpected token"
- Verifique se todas as vírgulas estão corretas
- Certifique-se de que strings estão entre aspas
- Verifique se arrays estão entre colchetes []

### Episódios não aparecem
- Limpe o cache (Debug Panel > Clear All Cache)
- Verifique se o arquivo está sendo importado corretamente
- Confirme que a semana está configurada em `/config/weeks.ts`

### Imagens não carregam
- Verifique se a URL está acessível
- Use URLs HTTPS
- Teste a URL no navegador primeiro

## Recursos Úteis

- **MyAnimeList**: https://myanimelist.net/ (para buscar informações de animes)
- **Jikan API**: https://jikan.moe/ (documentação da API)
- **Unsplash**: https://unsplash.com/ (imagens genéricas de anime)

## Contato e Suporte

Se tiver dúvidas ou encontrar problemas, consulte:
- `/DEBUG_GUIDE.md` - Guia de debug do sistema
- `/API_INTEGRATION.md` - Documentação da integração com a API
