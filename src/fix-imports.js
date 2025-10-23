const fs = require('fs');
const path = require('path');

// Lista de substituições a fazer
const replacements = [
  { from: /@radix-ui\/react-accordion@[\d.]+/g, to: '@radix-ui/react-accordion' },
  { from: /@radix-ui\/react-alert-dialog@[\d.]+/g, to: '@radix-ui/react-alert-dialog' },
  { from: /@radix-ui\/react-aspect-ratio@[\d.]+/g, to: '@radix-ui/react-aspect-ratio' },
  { from: /@radix-ui\/react-avatar@[\d.]+/g, to: '@radix-ui/react-avatar' },
  { from: /@radix-ui\/react-checkbox@[\d.]+/g, to: '@radix-ui/react-checkbox' },
  { from: /@radix-ui\/react-collapsible@[\d.]+/g, to: '@radix-ui/react-collapsible' },
  { from: /@radix-ui\/react-context-menu@[\d.]+/g, to: '@radix-ui/react-context-menu' },
  { from: /@radix-ui\/react-dialog@[\d.]+/g, to: '@radix-ui/react-dialog' },
  { from: /@radix-ui\/react-dropdown-menu@[\d.]+/g, to: '@radix-ui/react-dropdown-menu' },
  { from: /@radix-ui\/react-hover-card@[\d.]+/g, to: '@radix-ui/react-hover-card' },
  { from: /@radix-ui\/react-label@[\d.]+/g, to: '@radix-ui/react-label' },
  { from: /@radix-ui\/react-menubar@[\d.]+/g, to: '@radix-ui/react-menubar' },
  { from: /@radix-ui\/react-navigation-menu@[\d.]+/g, to: '@radix-ui/react-navigation-menu' },
  { from: /@radix-ui\/react-popover@[\d.]+/g, to: '@radix-ui/react-popover' },
  { from: /@radix-ui\/react-progress@[\d.]+/g, to: '@radix-ui/react-progress' },
  { from: /@radix-ui\/react-radio-group@[\d.]+/g, to: '@radix-ui/react-radio-group' },
  { from: /@radix-ui\/react-scroll-area@[\d.]+/g, to: '@radix-ui/react-scroll-area' },
  { from: /@radix-ui\/react-select@[\d.]+/g, to: '@radix-ui/react-select' },
  { from: /@radix-ui\/react-separator@[\d.]+/g, to: '@radix-ui/react-separator' },
  { from: /@radix-ui\/react-slider@[\d.]+/g, to: '@radix-ui/react-slider' },
  { from: /@radix-ui\/react-slot@[\d.]+/g, to: '@radix-ui/react-slot' },
  { from: /@radix-ui\/react-switch@[\d.]+/g, to: '@radix-ui/react-switch' },
  { from: /@radix-ui\/react-tabs@[\d.]+/g, to: '@radix-ui/react-tabs' },
  { from: /@radix-ui\/react-toggle-group@[\d.]+/g, to: '@radix-ui/react-toggle-group' },
  { from: /@radix-ui\/react-toggle@[\d.]+/g, to: '@radix-ui/react-toggle' },
  { from: /@radix-ui\/react-tooltip@[\d.]+/g, to: '@radix-ui/react-tooltip' },
  { from: /lucide-react@[\d.]+/g, to: 'lucide-react' },
  { from: /class-variance-authority@[\d.]+/g, to: 'class-variance-authority' },
  { from: /sonner@[\d.]+/g, to: 'sonner' },
  { from: /next-themes@[\d.]+/g, to: 'next-themes' },
  { from: /cmdk@[\d.]+/g, to: 'cmdk' },
  { from: /vaul@[\d.]+/g, to: 'vaul' },
  { from: /react-resizable-panels@[\d.]+/g, to: 'react-resizable-panels' },
  { from: /embla-carousel-react@[\d.]+/g, to: 'embla-carousel-react' },
  { from: /recharts@[\d.]+/g, to: 'recharts' },
  { from: /react-day-picker@[\d.]+/g, to: 'react-day-picker' },
  { from: /input-otp@[\d.]+/g, to: 'input-otp' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

console.log('🔧 Fixing imports...\n');
walkDir('./components');
console.log('\n✅ Done!');
