#!/usr/bin/env python3
import os
import re

# Padrões de substituição
patterns = [
    (r'@radix-ui/react-(\w+)@[\d.]+', r'@radix-ui/react-\1'),
    (r'lucide-react@[\d.]+', r'lucide-react'),
    (r'class-variance-authority@[\d.]+', r'class-variance-authority'),
    (r'sonner@[\d.]+', r'sonner'),
    (r'next-themes@[\d.]+', r'next-themes'),
    (r'cmdk@[\d.]+', r'cmdk'),
    (r'vaul@[\d.]+', r'vaul'),
    (r'react-resizable-panels@[\d.]+', r'react-resizable-panels'),
    (r'embla-carousel-react@[\d.]+', r'embla-carousel-react'),
    (r'recharts@[\d.]+', r'recharts'),
    (r'react-day-picker@[\d.]+', r'react-day-picker'),
    (r'input-otp@[\d.]+', r'input-otp'),
]

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'✓ Fixed: {filepath}')
        return True
    return False

def walk_directory(directory):
    fixed_count = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                if fix_file(filepath):
                    fixed_count += 1
    return fixed_count

if __name__ == '__main__':
    print('🔧 Fixing imports...\n')
    
    directories = ['./components', '.']
    total_fixed = 0
    
    for directory in directories:
        if os.path.exists(directory):
            total_fixed += walk_directory(directory)
    
    print(f'\n✅ Done! Fixed {total_fixed} files.')
