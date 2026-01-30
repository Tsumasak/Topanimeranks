# 📚 Top Anime Ranks - Development Guidelines

---

## 🚨 **CRITICAL PATTERNS - READ FIRST**

### **⚠️ 0. REACT ROUTER - MANDATORY RULE (READ THIS FIRST!)**
**❌ NEVER EVER use `react-router` package**  
**✅ ALWAYS use `react-router-dom` package**

```tsx
// ✅ CORRECT - Use react-router-dom
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

// ❌ WRONG - NEVER use react-router
import { Link } from "react-router"; // THIS WILL BREAK IN PRODUCTION
```

**CRITICAL RULES:**
1. `react-router` is ONLY the core library - it does NOT work in web browsers alone
2. `react-router-dom` is the CORRECT package for ALL web applications
3. Using `react-router` causes deployment errors on Vercel and production builds
4. **IF YOU SEE ROUTER ERRORS:** DO NOT switch to `react-router` - debug the actual root cause instead
5. **NEVER suggest using `react-router` when fixing errors - investigate the real issue**

**Common error scenarios:**
- ❌ "useNavigate() may be used only in context of Router" → Check Router wrapper, NOT the import
- ❌ "Module has no export" → Verify component structure, NOT the package name
- ❌ Build fails with router errors → Check for typos/missing components, NOT the package

**This rule is NON-NEGOTIABLE and must NEVER be violated!**

---

### **1. Carousel Cards MUST Have Uniform Heights**
**📄 Full Documentation:** [CAROUSEL_UNIFORM_CARDS.md](./CAROUSEL_UNIFORM_CARDS.md)

**ALWAYS follow this pattern when implementing carousels:**

```tsx
// 1. Container with CSS variable
<motion.div
  style={{ "--carousel-item-height": "420px" } as React.CSSProperties}
>
  <Carousel>
    <CarouselContent className="items-stretch">
      {/* 2. CarouselItem with fixed height + flex */}
      <CarouselItem className="pl-0 basis-[280px] h-[420px] flex">
        {/* 3. Card structure */}
        <Link className="flex flex-col w-full h-full">
          <div className="h-[280px] flex-shrink-0">{/* Image */}</div>
          <div className="flex-1 flex flex-col">
            <div className="p-4 flex flex-col">
              <h3 className="line-clamp-3">{/* Title */}</h3>
              <div className="flex-wrap">{/* Tags */}</div>
              <div className="flex-1" /> {/* CRITICAL SPACER */}
              <div className="flex-shrink-0">{/* Rating */}</div>
            </div>
          </div>
        </Link>
      </CarouselItem>
    </CarouselContent>
  </Carousel>
</motion.div>
```

**CSS Global Required:**
```css
@media (max-width: 767px) {
  [data-slot="carousel-item"] {
    height: var(--carousel-item-height) !important;
    display: flex !important;
  }
}
```

**❌ NEVER:**
- Skip the `flex-1` spacer div
- Use `min-height` instead of `height`
- Forget `line-clamp` on text elements
- Remove `!important` from CSS

---

## 🎨 **General Guidelines**

### **Layout Best Practices**
- Use Flexbox and Grid for responsive layouts
- Only use absolute positioning when necessary
- Keep components modular and reusable
- Prefer Tailwind CSS classes over custom CSS

### **Code Organization**
- Keep file sizes small
- Extract helper functions into separate files
- Create shared components in `/components`
- Use TypeScript interfaces for all data structures

### **Performance**
- Optimize images using WebP format
- Lazy load components when appropriate
- Use React.memo for expensive components
- Minimize re-renders with proper key usage

---

## 🎯 **Design System Guidelines**

### **Typography**
- Base font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`
- Headings: Bold weight
- Body text: Regular weight
- Use `line-clamp` for text truncation

### **Spacing**
- Container padding: `px-[24px]`
- Section gaps: `gap-[32px]`
- Card padding: `p-4` or `p-6`
- Element gaps: `gap-2`, `gap-3`, `gap-4`

### **Colors**
- Use CSS variables from `/styles/globals.css`
- Support both light and dark themes
- Primary: `var(--foreground)`
- Background: `var(--background)`
- Cards: `var(--card-background)`
- Ratings: `var(--rating-yellow)`

### **Cards**
- Border radius: `rounded-lg`
- Border: `border` with `var(--card-border)`
- Hover effects: `transition-all duration-300`
- Shadow: Use theme-card class

### **Buttons**
- Primary: Yellow accent color
- Secondary: Gray/neutral colors
- Border radius: `rounded` or `rounded-full`
- Padding: `px-3 py-1` (small), `px-4 py-2` (medium)

---

## 📱 **Responsive Design**

### **Breakpoints**
- Mobile: `< 768px` (default)
- Tablet: `md:` (≥ 768px)
- Desktop: `lg:` (≥ 1024px)
- Large Desktop: `xl:` (≥ 1280px)

### **Mobile-First Approach**
```tsx
// Default: Mobile
<div className="text-sm">
  
// Tablet and up
<div className="text-sm md:text-base">
  
// Desktop and up
<div className="text-sm md:text-base lg:text-lg">
```

### **Layout Patterns**
- Mobile: Single column, carousels
- Desktop: Grid layouts (2-4 columns)
- Use `hidden md:block` and `md:hidden` for conditional rendering

---

## 🔄 **Animation Guidelines**

### **Framer Motion**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.03 }}
>
```

### **Timing**
- Fast interactions: 0.15s
- Standard animations: 0.3s
- Slow animations: 0.5s - 1.5s
- Stagger delay: `index * 0.03`

### **Easing**
- Default: `ease-out`
- Bouncy: `[0.34, 1.56, 0.64, 1]`
- Smooth: `ease-in-out`

---

## 🗄️ **Data Management**

### **State Management**
- Use React hooks (useState, useEffect)
- Fetch data from Supabase backend
- Use AnimatePresence for data transitions

### **API Calls**
```tsx
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-c1d1bfd8/endpoint`,
  {
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
    },
  }
);
```

### **Error Handling**
- Always wrap API calls in try-catch
- Log errors to console with context
- Show user-friendly error messages

---

## 🏷️ **Tag Helpers**

### **Anime Type Tags**
Use `getTypeClass()` from `/utils/tagHelpers.ts`:
- TV → Green
- Movie → Blue
- OVA → Purple
- Special → Orange

### **Demographic Tags**
Use `getDemographicClass()`:
- Shounen → Blue
- Seinen → Red
- Shoujo → Pink
- Josei → Purple

### **Season Tags**
- Winter → Light blue
- Spring → Pink
- Summer → Orange
- Fall → Brown/orange

---

## 🎭 **Theme System**

### **CSS Variables Structure**
```css
:root {
  --background: #ffffff;
  --foreground: #000000;
  --card-background: #f9f9f9;
  --card-border: #e0e0e0;
  --rating-yellow: #fbbf24;
}

.dark {
  --background: #0a0a0a;
  --foreground: #ffffff;
  --card-background: #1a1a1a;
  --card-border: #2a2a2a;
}
```

### **Theme Toggle**
- Button in header
- Persisted to localStorage
- Smooth transition between themes

---

## 🚀 **Performance Optimization**

### **Image Optimization**
- Use WebP format when possible
- Lazy load images below the fold
- Use `object-cover` for consistent sizing
- Preload critical images

### **Code Splitting**
- Use dynamic imports for large components
- Lazy load routes
- Keep bundle size under control

### **Rendering**
- Use React.memo for pure components
- Avoid inline functions in render
- Use proper key props in lists
- Minimize state updates

---

## 📋 **Code Style**

### **Component Structure**
```tsx
// 1. Imports
import { useState } from "react";

// 2. Types/Interfaces
interface Props {
  data: AnimeData;
}

// 3. Component
export function Component({ data }: Props) {
  // State
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {}, []);
  
  // Handlers
  const handleClick = () => {};
  
  // Render
  return <div />;
}
```

### **Naming Conventions**
- Components: PascalCase (`AnimeCard`)
- Functions: camelCase (`fetchData`)
- Constants: UPPER_SNAKE_CASE (`API_URL`)
- CSS classes: kebab-case (`anime-card`)

### **Comments**
- Use comments for complex logic
- Document critical sections
- Explain "why" not "what"

---

## 🔗 **Related Documentation**

- **[CAROUSEL_UNIFORM_CARDS.md](./CAROUSEL_UNIFORM_CARDS.md)** - Mandatory carousel pattern
- **[CRITICAL_SYSTEM_LOGIC.md](./CRITICAL_SYSTEM_LOGIC.md)** - Week calculation logic
- **[CONTROLLER_PATTERN.md](./CONTROLLER_PATTERN.md)** - Architecture patterns
- **[PICTURES_SYSTEM.md](./PICTURES_SYSTEM.md)** - Pictures feature guide

---

**⚠️ These guidelines are mandatory for all development work!**