# 🎠 Guideline: Uniform Card Heights in Carousels

## 📋 CONTEXTO

Este documento estabelece o padrão **OBRIGATÓRIO** para garantir que todos os cards dentro de carrosséis (especialmente no mobile) tenham **ALTURA UNIFORME**, independente do conteúdo variável (títulos longos, tags, descrições, etc).

---

## ⚠️ PROBLEMA QUE RESOLVE

**Antes:**
- Cards com alturas diferentes no mesmo carrossel
- Aparência desorganizada e não profissional
- Elementos (rating, badges) desalinhados
- Experiência visual ruim no mobile

**Depois:**
- Todos os cards têm exatamente a mesma altura
- Aparência consistente e profissional
- Elementos sempre alinhados nas mesmas posições
- Experiência visual perfeita em todas as resoluções

---

## 🎯 SOLUÇÃO TÉCNICA COMPLETA

### **1. CSS Global (`/styles/globals.css`)**

```css
/* CRITICAL FIX: Force carousel items to have uniform height */
@media (max-width: 767px) {
  [data-slot="carousel-item"] {
    height: var(--carousel-item-height) !important;
    display: flex !important;
  }
  
  [data-slot="carousel-item"] > * {
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
  }
}
```

**Por que `!important`?**
- Garante que a altura fixa NUNCA seja sobrescrita por outras classes
- Força a altura uniforme mesmo com conteúdo dinâmico
- Funciona em todos os navegadores e situações

---

### **2. Estrutura do Carrossel (Container)**

```tsx
{/* Mobile: Carousel */}
<div className="md:hidden">
  <AnimatePresence mode="wait">
    <motion.div
      className="w-full flex flex-col gap-4"
      style={{ "--carousel-item-height": "420px" } as React.CSSProperties}
    >
      <div className="-mx-[18px]">
        <Carousel className="w-full" opts={{ align: "start", loop: false }}>
          <CarouselContent className="gap-3 px-[18px] items-stretch">
            {/* Cards aqui */}
          </CarouselContent>
        </Carousel>
      </div>
    </motion.div>
  </AnimatePresence>
</div>
```

**Pontos críticos:**
- `style={{ "--carousel-item-height": "420px" }}` → Define a variável CSS
- `items-stretch` no `CarouselContent` → Força todos os items a terem a mesma altura

---

### **3. Estrutura do CarouselItem**

```tsx
<CarouselItem
  key={`item-${id}`}
  className="pl-0 basis-[280px] h-[420px] flex"
>
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.03 }}
    className="w-full h-full flex"
  >
    <CardComponent data={item} />
  </motion.div>
</CarouselItem>
```

**Pontos críticos:**
- `h-[420px]` no `CarouselItem` → Altura fixa
- `flex` no `CarouselItem` e no `motion.div` → Permite flexbox funcionar
- `w-full h-full` no `motion.div` → Preenche 100% do parent

---

### **4. Estrutura Interna do Card (CRÍTICO)**

```tsx
<Link
  to={url}
  className="block theme-card rounded-lg overflow-hidden flex flex-col w-full h-full"
>
  {/* 1. IMAGEM - ALTURA FIXA */}
  <div className="relative flex-shrink-0 w-full h-[280px]">
    <img src={image} alt={title} className="w-full h-full object-cover" />
  </div>

  {/* 2. CONTEÚDO - ALTURA FLEXÍVEL */}
  <div className="relative flex-1 flex flex-col">
    <div className="p-4 flex flex-col">
      {/* Título - HUG (max 3 linhas) */}
      <h3 className="font-bold text-lg line-clamp-3 leading-[1.2] mb-2">
        {title}
      </h3>

      {/* Subtítulo - HUG (max 2 linhas) - OPCIONAL */}
      {subtitle && (
        <p className="text-sm line-clamp-2 leading-[1.2] mb-2">
          {subtitle}
        </p>
      )}

      {/* Tags - HUG (max 2 linhas) */}
      <div className="flex gap-1 flex-wrap mb-2">
        {tags.slice(0, 4).map((tag) => (
          <span key={tag} className="px-2 py-1 text-xs rounded-full">
            {tag}
          </span>
        ))}
      </div>

      {/* 🎯 ESPAÇO FLEXÍVEL - PREENCHE O RESTANTE */}
      <div className="flex-1" />

      {/* Rating - SEMPRE NO BOTTOM - flex-shrink-0 */}
      <div className="font-bold text-right text-lg flex-shrink-0">
        ★ {score}
      </div>
    </div>
  </div>
</Link>
```

---

## 📐 ANATOMIA DO CARD - COMO FUNCIONA

```
┌─────────────────────────┐ ← CarouselItem: h-[420px] (ALTURA FIXA)
│                         │
│  ┌───────────────────┐  │
│  │   Imagem 280px    │  │ ← flex-shrink-0 (NÃO ENCOLHE)
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🏆 Badge          │  │
│  │                   │  │
│  │ Título (3 lines)  │  │ ← HUG (line-clamp-3)
│  │ Subtítulo (2)     │  │ ← HUG (line-clamp-2)
│  │ Tags (2 lines)    │  │ ← HUG (flex-wrap)
│  │                   │  │
│  │ ~~~~ FLEX-1 ~~~~  │  │ ← ESPAÇO FLEXÍVEL (cresce/encolhe)
│  │                   │  │   - Card com pouco conteúdo = MAIS espaço
│  │                   │  │   - Card com muito conteúdo = MENOS espaço
│  │                   │  │
│  │         ★ 8.5     │  │ ← flex-shrink-0 (SEMPRE NO BOTTOM)
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

---

## 📏 ALTURAS PADRÃO POR TIPO DE CARD

| Tipo de Card           | Altura Mobile | Altura Desktop | Variável CSS               |
|------------------------|---------------|----------------|----------------------------|
| **Weekly Episodes**    | 420px         | Auto (grid)    | `--carousel-item-height: 420px` |
| **Top Season Animes**  | 480px         | Auto (grid)    | `--carousel-item-height: 480px` |
| **Most Anticipated**   | 480px         | Auto (grid)    | `--carousel-item-height: 480px` |

**Por que alturas diferentes?**
- Weekly Episodes têm subtítulo (episódio) → precisam de menos espaço
- Top Animes têm season tag → precisam de mais espaço

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Ao criar ou modificar um carrossel com cards, **SEMPRE** siga esta checklist:

### **1. CSS Global**
- [ ] Adicionei as regras `!important` no `/styles/globals.css`
- [ ] Testei que o CSS está sendo aplicado no mobile

### **2. Container do Carrossel**
- [ ] Adicionei `style={{ "--carousel-item-height": "XXXpx" }}`
- [ ] Usei `items-stretch` no `CarouselContent`

### **3. CarouselItem**
- [ ] Usei `h-[XXXpx]` (mesma altura da variável CSS)
- [ ] Adicionei `flex` no `CarouselItem`
- [ ] Usei `w-full h-full flex` no wrapper interno (motion.div)

### **4. Estrutura do Card**
- [ ] Card tem `flex flex-col w-full h-full`
- [ ] Imagem tem altura fixa com `flex-shrink-0`
- [ ] Conteúdo tem `flex-1 flex flex-col`
- [ ] Elementos de conteúdo usam `line-clamp` (HUG)
- [ ] Adicionei `<div className="flex-1" />` antes do elemento final
- [ ] Elemento final (rating) tem `flex-shrink-0`

---

## 🚫 ERROS COMUNS A EVITAR

### **❌ ERRO 1: Não usar `!important` no CSS**
```css
/* ERRADO */
[data-slot="carousel-item"] {
  height: var(--carousel-item-height); /* Pode ser sobrescrito */
}

/* CORRETO */
[data-slot="carousel-item"] {
  height: var(--carousel-item-height) !important; /* Força a altura */
}
```

### **❌ ERRO 2: Não adicionar `flex` no CarouselItem**
```tsx
{/* ERRADO */}
<CarouselItem className="pl-0 basis-[280px] h-[420px]">

{/* CORRETO */}
<CarouselItem className="pl-0 basis-[280px] h-[420px] flex">
```

### **❌ ERRO 3: Esquecer o `flex-1` spacer**
```tsx
{/* ERRADO - Rating não fica no bottom */}
<div className="p-4">
  <h3>Título</h3>
  <div>★ 8.5</div>
</div>

{/* CORRETO - Rating sempre no bottom */}
<div className="p-4 flex flex-col">
  <h3>Título</h3>
  <div className="flex-1" /> {/* SPACER CRÍTICO */}
  <div>★ 8.5</div>
</div>
```

### **❌ ERRO 4: Não usar `line-clamp` nos textos**
```tsx
{/* ERRADO - Texto cresce infinitamente */}
<h3 className="font-bold">{title}</h3>

{/* CORRETO - Texto limitado a 3 linhas */}
<h3 className="font-bold line-clamp-3">{title}</h3>
```

### **❌ ERRO 5: Usar `min-height` ao invés de `height`**
```tsx
{/* ERRADO - Cards podem ter alturas diferentes */}
<CarouselItem className="min-h-[420px]">

{/* CORRETO - Todos os cards têm exatamente 420px */}
<CarouselItem className="h-[420px]">
```

---

## 🎨 EXEMPLO COMPLETO DE IMPLEMENTAÇÃO

```tsx
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

function MyCarousel() {
  const items = [...]; // Seus dados

  return (
    <div className="md:hidden">
      <AnimatePresence mode="wait">
        <motion.div
          className="w-full flex flex-col gap-4"
          style={{ "--carousel-item-height": "420px" } as React.CSSProperties}
        >
          <div className="-mx-[18px]">
            <Carousel className="w-full" opts={{ align: "start", loop: false }}>
              <CarouselContent className="gap-3 px-[18px] items-stretch">
                {items.map((item, index) => (
                  <CarouselItem
                    key={item.id}
                    className="pl-0 basis-[280px] h-[420px] flex"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="w-full h-full flex"
                    >
                      <MyCard data={item} />
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MyCard({ data }) {
  return (
    <Link
      to={data.url}
      className="block theme-card rounded-lg overflow-hidden flex flex-col w-full h-full"
    >
      {/* Imagem - ALTURA FIXA */}
      <div className="relative flex-shrink-0 w-full h-[280px]">
        <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
      </div>

      {/* Conteúdo - ALTURA FLEXÍVEL */}
      <div className="relative flex-1 flex flex-col">
        <div className="p-4 flex flex-col">
          {/* Título - HUG (max 3 linhas) */}
          <h3 className="font-bold text-lg line-clamp-3 leading-[1.2] mb-2">
            {data.title}
          </h3>

          {/* Tags - HUG (max 2 linhas) */}
          <div className="flex gap-1 flex-wrap mb-2">
            {data.tags?.slice(0, 4).map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* ESPAÇO FLEXÍVEL - CRÍTICO! */}
          <div className="flex-1" />

          {/* Rating - SEMPRE NO BOTTOM */}
          <div className="font-bold text-right text-lg flex-shrink-0">
            ★ {data.score}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

---

## 🔍 DEBUGGING

Se os cards ainda não estão com altura uniforme:

### **1. Verificar CSS Global**
```bash
# Abra DevTools → Inspect no CarouselItem
# Procure por: [data-slot="carousel-item"]
# Confirme que height está aplicado com !important
```

### **2. Verificar Variável CSS**
```tsx
// Adicione console.log para verificar
<motion.div
  style={{ "--carousel-item-height": "420px" } as React.CSSProperties}
>
```

### **3. Verificar Classes do CarouselItem**
```tsx
// Deve ter TODAS essas classes:
<CarouselItem className="pl-0 basis-[280px] h-[420px] flex">
//                                            ^^^^^^^^^  ^^^^
//                                            ALTURA    FLEX
```

### **4. Verificar Estrutura Flexbox**
```tsx
// Cada nível deve ter flex:
<CarouselItem className="flex">         {/* ✅ */}
  <motion.div className="flex">         {/* ✅ */}
    <Link className="flex flex-col">    {/* ✅ */}
      <div className="flex-1">          {/* ✅ Container de conteúdo */}
        <div className="flex flex-col"> {/* ✅ Conteúdo interno */}
          <div className="flex-1" />    {/* ✅ Spacer */}
```

---

## 📚 REFERÊNCIAS

- **Implementação Original:** `/pages/HomePage.tsx`
- **CSS Global:** `/styles/globals.css`
- **Componente Carousel:** `/components/ui/carousel.tsx`

---

## ⚠️ REGRA DE OURO

> **NUNCA crie carrosséis com cards sem seguir este padrão.**
> 
> **SEMPRE use altura fixa + flexbox + spacer flex-1.**
> 
> **Este é o ÚNICO método garantido para alturas uniformes.**

---

## 📅 Última Atualização

**Data:** 26 de Janeiro de 2026  
**Autor:** Sistema Top Anime Ranks  
**Status:** ✅ **PADRÃO OBRIGATÓRIO**
