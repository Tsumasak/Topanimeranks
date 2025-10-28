# 🎯 Controller Pattern - Padronização de Comportamento

## 📋 Padrão Estabelecido

Este documento define o padrão oficial para todos os controllers (WeekControl, SeasonControl, etc.) no projeto Top Anime Ranks, garantindo transições suaves sem flickering.

---

## ✅ Regras Obrigatórias

### 1. **Estados Separados para Dados e Animação**

```typescript
// ✅ CORRETO: Estados separados
const [data, setData] = useState<T[]>([]);
const [displayedData, setDisplayedData] = useState<T[]>([]);
const [animationKey, setAnimationKey] = useState(initialKey);
const [userSwitched, setUserSwitched] = useState(false);

// ❌ ERRADO: Usar o mesmo estado para tudo
const [data, setData] = useState<T[]>([]);
```

### 2. **Handler de Mudança de Tab/Filtro**

```typescript
// ✅ CORRETO: Mudança imediata, sem setTimeout
const handleChange = (newValue: string) => {
  if (newValue === activeValue) return;
  console.log(`[Component] 🔄 handleChange: ${activeValue} → ${newValue}`);
  setUserSwitched(true);
  setActiveValue(newValue); // Muda IMEDIATAMENTE
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ❌ ERRADO: setTimeout causa race condition
const handleChange = (newValue: string) => {
  setUserSwitched(true);
  setTimeout(() => setActiveValue(newValue), 150); // ❌ NÃO FAZER
};
```

### 3. **useEffect - Dependências Corretas**

```typescript
// ✅ CORRETO: Só activeValue nas dependências
useEffect(() => {
  const loadData = async () => {
    // userSwitched é LIDO mas NÃO é dependência
    if (!userSwitched) {
      setLoading(true);
    }
    
    const newData = await fetchData(activeValue);
    
    // CRITICAL: Atualizar displayedData e animationKey JUNTOS
    setDisplayedData(newData);
    setAnimationKey(activeValue);
    
    setLoading(false);
    setUserSwitched(false); // Reset imediatamente após fetch
  };
  
  loadData();
}, [activeValue]); // ✅ userSwitched NÃO está aqui!

// ❌ ERRADO: userSwitched nas dependências causa double-trigger
}, [activeValue, userSwitched]); // ❌ Dispara 2x!
```

### 4. **Atualização Atômica de Estados**

```typescript
// ✅ CORRETO: Atualizar displayedData e animationKey JUNTOS
const newData = await fetchData();
setDisplayedData(newData);
setAnimationKey(activeValue); // Logo em seguida

// ❌ ERRADO: Atualizar em momentos diferentes
setDisplayedData(newData);
setTimeout(() => setAnimationKey(activeValue), 100); // ❌ Causa flicker
```

### 5. **Reset de Flag userSwitched**

```typescript
// ✅ CORRETO: Reset no finally, imediatamente após fetch
finally {
  setLoading(false);
  setUserSwitched(false); // Reset imediato
}

// ❌ ERRADO: Reset com setTimeout causa double-trigger
finally {
  setLoading(false);
  setTimeout(() => setUserSwitched(false), 150); // ❌ Effect roda 2x!
}
```

### 6. **Estrutura de Animação com AnimatePresence**

```typescript
// ✅ CORRETO: Container único com animationKey
<AnimatePresence mode="wait">
  <motion.div 
    key={animationKey}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
  >
    {displayedData.map((item, index) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: index * 0.03,
          ease: [0.34, 1.56, 0.64, 1]
        }}
      >
        <Card {...item} />
      </motion.div>
    ))}
  </motion.div>
</AnimatePresence>

// ❌ ERRADO: AnimatePresence sem container ou mode diferente
<div className="grid">
  <AnimatePresence mode="popLayout"> {/* ❌ mode errado */}
    {displayedData.map((item) => (
      <motion.div key={`${animationKey}-${item.id}`}> {/* ❌ key com animationKey */}
        <Card {...item} />
      </motion.div>
    ))}
  </AnimatePresence>
</div>
```

---

## 🔍 Logs de Debug (Obrigatório)

Todos os controllers devem incluir os seguintes logs para debugging:

```typescript
// Handler
console.log(`[Component] 🔄 handleChange: ${oldValue} → ${newValue}`);

// useEffect trigger
console.log(`[Component useEffect] ⚡ Triggered for activeValue: ${activeValue}, userSwitched: ${userSwitched}`);
console.log(`[Component useEffect] 📊 Current state:`, { activeValue, animationKey, dataCount });

// Fetch start
console.log(`[Component] 🔍 Starting to load data for ${activeValue}`);

// Loading decision
console.log(`[Component] 🔃 Setting loading to true (initial load)`);
console.log(`[Component] 🏃 User switched - skipping loading state`);

// Fetch complete
console.log(`[Component] ✅ Fetched ${data.length} items for ${activeValue}`);

// Critical update
console.log(`[Component] 🎬 CRITICAL: Updating displayedData and animationKey`);
console.log(`[Component] 🎬 Previous animationKey: ${old} → New: ${new}`);

// Finally
console.log(`[Component] 🏁 Finally block: setting loading to false`);
console.log(`[Component] 🔄 Resetting userSwitched flag`);

// Render
console.log(`[Component] 🎨 Rendering main content:`, { activeValue, animationKey });
console.log(`[Component] 🚫 Render blocked: loading is true`);

// Animation
onAnimationStart={() => console.log(`[Component] 🎬 Animation START for key: ${key}`)}
onAnimationComplete={() => console.log(`[Component] ✨ Animation COMPLETE for key: ${key}`)}
```

---

## 🎯 Fluxo Correto de Execução

### Sequência Ideal (SEM flicker):

1. **Usuário clica** → `userSwitched = true`, `activeValue = newValue`
2. **useEffect dispara** → `userSwitched = true`, pula loading
3. **Fetch inicia** → Dados antigos ainda mostrados (sem piscar!)
4. **Fetch completa** → Atualiza `displayedData` + `animationKey` JUNTOS
5. **Finally block** → `userSwitched = false` (fetch já terminou)
6. **AnimatePresence** → Fade suave do container
7. **Cards aparecem** → Stagger animation em cascata

### ⚠️ Sequência com Bug (COM flicker):

1. Usuário clica → `userSwitched = true`, setTimeout 150ms
2. useEffect dispara → `userSwitched = true`, pula loading
3. Fetch completa → `userSwitched = false` no setTimeout
4. **useEffect dispara DE NOVO** → `userSwitched = false`, ativa loading ❌
5. **return null** → PISCAR! ⚠️

---

## 🎬 Padrão para Páginas sem Controllers (Carga Inicial)

Para páginas que apenas carregam dados inicialmente sem filtros/tabs (como HomePage, TopSeasonAnimesPage):

### Estrutura:

```typescript
// 1. Importar motion
import { motion, AnimatePresence } from 'motion/react';

// 2. Estado de animação
const [animationKey, setAnimationKey] = useState('initial');

// 3. Atualizar animationKey APÓS carregar dados
useEffect(() => {
  const loadData = async () => {
    console.log('[Page] 🔍 Starting to load data');
    try {
      setLoading(true);
      const data = await fetchData();
      
      // CRITICAL: Update animation key AFTER data is loaded
      console.log('[Page] 🎬 CRITICAL: Data loaded, updating animationKey');
      setAnimationKey('loaded');
      
    } catch (error) {
      console.error('[Page] ❌ Error loading data:', error);
    } finally {
      console.log('[Page] 🏁 Finally block: setting loading to false');
      setLoading(false);
    }
  };
  loadData();
}, []);

// 4. Renderizar com AnimatePresence
<AnimatePresence mode="wait">
  <motion.div 
    key={animationKey}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    onAnimationStart={() => console.log('[Page] 🎬 Animation START')}
    onAnimationComplete={() => console.log('[Page] ✨ Animation COMPLETE')}
  >
    {data.map((item, index) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: index * 0.03,
          ease: [0.34, 1.56, 0.64, 1]
        }}
      >
        <Card {...item} />
      </motion.div>
    ))}
  </motion.div>
</AnimatePresence>
```

**⚠️ Diferenças para Controllers:**
- Não há `userSwitched` (sem filtros/tabs)
- `animationKey` muda de `'initial'` → `'loaded'`
- Animação acontece apenas na carga inicial
- Infinite scroll adiciona cards SEM animação (para fluidez)

---

## 📦 Controllers e Páginas Padronizados

### Controllers:
- ✅ **WeekControl** - Aplicado em 2025-01-28
- ✅ **SeasonControl** - Aplicado em 2025-01-28

### Páginas:
- ✅ **HomePage** - Aplicado em 2025-01-28 (animação inicial)
- ✅ **TopSeasonAnimesPage** - Aplicado em 2025-01-28 (animação inicial)
- ✅ **TopEpisodesPage** - Usa WeekControl (já padronizado)
- ✅ **MostAnticipatedPage** - Usa SeasonControl (já padronizado)

---

## 🚀 Checklist de Implementação

Ao criar um novo controller, verifique:

- [ ] Estados `data`, `displayedData`, `animationKey`, `userSwitched` criados
- [ ] Handler sem `setTimeout` para mudança de valor
- [ ] `useEffect` com apenas `activeValue` nas dependências
- [ ] `displayedData` e `animationKey` atualizados JUNTOS
- [ ] `userSwitched` resetado imediatamente no `finally`
- [ ] `AnimatePresence mode="wait"` com container único
- [ ] Container `motion.div` com `key={animationKey}`
- [ ] Cards com stagger animation (delay baseado em index)
- [ ] Logs de debug em pontos críticos
- [ ] Testado: transição entre tabs sem flicker

---

## 🎓 Conceitos-chave

**Por que `userSwitched` não pode estar nas dependências?**
- Se estiver, quando resetamos `false`, o effect roda de novo
- Isso causa double-fetch e ativa `loading = true` indevidamente
- **Solução**: Ler o valor mas não depender dele

**Por que atualizar `displayedData` e `animationKey` juntos?**
- `AnimatePresence` só anima quando a `key` muda
- Se mudarmos antes dos dados estarem prontos, anima com dados velhos
- **Solução**: Atualizar ambos atomicamente quando dados estão prontos

**Por que não usar `setTimeout` no handler?**
- Cria race condition com o reset de `userSwitched`
- Torna a sincronização imprevisível
- **Solução**: Mudança imediata e síncrona

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0  
**Status:** ✅ Padrão Oficial
