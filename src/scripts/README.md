# Scripts para Gerenciar Episódios

Esta pasta contém scripts auxiliares para facilitar a adição manual de episódios ao sistema.

## 📁 Arquivos Disponíveis

### 1. `add-episode.ts` - Adicionar Um Episódio
Script para adicionar um único episódio de forma fácil e formatada.

**Quando usar:**
- Adicionar um episódio específico
- Fazer ajustes pontuais
- Testar novos episódios

**Como usar:**
1. Abra o arquivo `add-episode.ts`
2. Edite a seção `NOVO_EPISODIO` com os dados do episódio
3. Defina `WEEK_NUMBER` (1, 2, 3, ou 4)
4. Execute ou apenas leia o console log para copiar o código gerado
5. Cole o código no arquivo de semana apropriado

### 2. `bulk-add-episodes.ts` - Adicionar Múltiplos Episódios
Script para adicionar vários episódios de uma vez.

**Quando usar:**
- Popular uma semana inteira
- Adicionar múltiplos episódios de diferentes animes
- Fazer updates em lote

**Como usar:**
1. Abra o arquivo `bulk-add-episodes.ts`
2. Edite o array `EPISODIOS` com todos os episódios
3. Defina `WEEK_NUMBER`, `START_ID` e `START_RANK`
4. Execute ou leia o console log para copiar o código gerado
5. Cole o código no arquivo de semana apropriado

## 🎯 Exemplo de Uso Rápido

### Cenário 1: Adicionar 1 episódio na Week 2

```typescript
// Em add-episode.ts

const NOVO_EPISODIO = {
  id: 15,
  rank: 8,
  title: "Frieren: Beyond Journey's End",
  episodeNumber: 10,
  episodeTitle: "A Powerful Mage",
  rating: 4.82,
  animeType: "TV",
  imageUrl: "https://cdn.myanimelist.net/images/anime/1015/138006.jpg",
  demographics: ["Shounen"],
  genres: ["Adventure", "Drama"],
  themes: ["Fantasy"]
};

const WEEK_NUMBER = 2;
```

Execute e copie o código gerado!

### Cenário 2: Popular Week 3 com 5 episódios

```typescript
// Em bulk-add-episodes.ts

const WEEK_NUMBER = 3;
const START_ID = 20;
const START_RANK = 1;

const EPISODIOS = [
  {
    title: "One Piece",
    episodeNumber: 1071,
    episodeTitle: "Luffy's Peak - Attained! Gear Five",
    rating: 4.95,
    // ... resto dos dados
  },
  {
    title: "Jujutsu Kaisen",
    episodeNumber: 41,
    episodeTitle: "Thunderclap",
    rating: 4.90,
    // ... resto dos dados
  },
  // ... mais 3 episódios
];
```

Execute e copie o código gerado!

## 📝 Template de Episódio

Use este template como referência:

```typescript
{
  title: "Nome do Anime",           // Nome em inglês
  episodeNumber: 1,                 // Número do episódio
  episodeTitle: "Título do Ep",     // Título do episódio
  rating: 4.50,                     // 1.00 a 5.00
  animeType: "TV",                  // TV, ONA, Movie, OVA
  imageUrl: "https://...",          // URL da imagem
  demographics: ["Shounen"],        // Shounen, Seinen, Shoujo, Josei
  genres: ["Action", "Drama"],      // Gêneros
  themes: ["School"]                // Temas
}
```

## 🔍 Onde Encontrar Informações

### MyAnimeList (MAL)
- **URL**: https://myanimelist.net/
- **Encontrar**: Título em inglês, gêneros, demographics, temas
- **Imagens**: Use a URL da capa (cdn.myanimelist.net)

### Jikan API
- **URL**: https://api.jikan.moe/v4/anime/{id}
- **Encontrar**: Dados completos em formato JSON
- **Útil para**: Validar informações, pegar múltiplos dados

### Exemplo de busca no MAL:
1. Acesse https://myanimelist.net/
2. Busque o anime (ex: "Demon Slayer")
3. Clique na imagem com botão direito > "Copiar endereço da imagem"
4. Role até "Information" para ver Type, Demographics, Genres, Themes

## ⚠️ Checklist Antes de Adicionar

- [ ] ID é único (não existe em nenhuma semana)
- [ ] Rank está correto (baseado no rating)
- [ ] Rating entre 1.00 e 5.00
- [ ] Título em inglês (não japonês)
- [ ] Subtitle no formato "Episode X - Título"
- [ ] imageUrl é válida e acessível
- [ ] animeType é um dos valores válidos
- [ ] demographics contém apenas 1 valor
- [ ] genres e themes são arrays válidos
- [ ] Vírgulas estão corretas

## 🐛 Problemas Comuns

### "Duplicate ID"
**Causa:** ID já está sendo usado em outra semana
**Solução:** Escolha o próximo ID disponível (ex: se week1 tem até ID 10, use 11)

### "Invalid rating"
**Causa:** Rating fora do range 1.00-5.00
**Solução:** Ajuste o rating para estar entre 1.00 e 5.00

### "Image not loading"
**Causa:** URL da imagem inválida ou bloqueada
**Solução:** Use URLs do MyAnimeList (cdn.myanimelist.net)

### "Syntax error"
**Causa:** Vírgula faltando ou sobrando
**Solução:** Verifique se há vírgula entre objetos, mas NÃO no último objeto

## 💡 Dicas Pro

1. **IDs Organizados**: Use ranges de 100 para cada semana
   - Week 1: 1-99
   - Week 2: 100-199
   - Week 3: 200-299
   - Week 4: 300-399

2. **Ratings Realistas**: 
   - Top 3: 4.80-5.00
   - Top 10: 4.50-4.79
   - Top 20: 4.00-4.49
   - Demais: 3.50-3.99

3. **Backup Antes de Editar**:
   - Sempre faça uma cópia do arquivo antes de editar
   - Use Git para versionar as mudanças

4. **Teste Localmente**:
   - Adicione 1 episódio primeiro
   - Verifique se aparece corretamente
   - Depois adicione os demais

## 📚 Recursos Adicionais

- [Guia Manual Completo](/MANUAL_EPISODES_GUIDE.md)
- [Debug Guide](/DEBUG_GUIDE.md)
- [API Integration](/API_INTEGRATION.md)
- [MyAnimeList](https://myanimelist.net/)
- [Jikan API Docs](https://docs.api.jikan.moe/)

## 🤝 Contribuindo

Se criar scripts úteis adicionais, adicione nesta pasta e atualize este README!
