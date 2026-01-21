
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'hono@4': 'hono',
        'figma:asset/fe8a29349e223eac688d543a304b6373974fba28.png': path.resolve(__dirname, './src/assets/fe8a29349e223eac688d543a304b6373974fba28.png'),
        'figma:asset/fb96d0327370df29ef4df94c21d7ce51117524c4.png': path.resolve(__dirname, './src/assets/fb96d0327370df29ef4df94c21d7ce51117524c4.png'),
        'figma:asset/f686314581c0a4fbd5f282aed19b8a0bebe4df81.png': path.resolve(__dirname, './src/assets/f686314581c0a4fbd5f282aed19b8a0bebe4df81.png'),
        'figma:asset/f25ecd8fe81bf8bfae2dc575d1c3bbfae0496979.png': path.resolve(__dirname, './src/assets/f25ecd8fe81bf8bfae2dc575d1c3bbfae0496979.png'),
        'figma:asset/dd67fcdcbd04f0870763599b2570c39da63817d1.png': path.resolve(__dirname, './src/assets/dd67fcdcbd04f0870763599b2570c39da63817d1.png'),
        'figma:asset/d1bf78770c7f98bf266fa914af596b11453683da.png': path.resolve(__dirname, './src/assets/d1bf78770c7f98bf266fa914af596b11453683da.png'),
        'figma:asset/c5b84c1e47cce2d423a68e935e74f4429a69412b.png': path.resolve(__dirname, './src/assets/c5b84c1e47cce2d423a68e935e74f4429a69412b.png'),
        'figma:asset/c5956f9fad07bb3da268ec81af84d2113d3efab9.png': path.resolve(__dirname, './src/assets/c5956f9fad07bb3da268ec81af84d2113d3efab9.png'),
        'figma:asset/c3d97eba1c6ee53086c0caf4c41da6df4eee2631.png': path.resolve(__dirname, './src/assets/c3d97eba1c6ee53086c0caf4c41da6df4eee2631.png'),
        'figma:asset/c39a479592fd627054ccc4895cb845312a89311e.png': path.resolve(__dirname, './src/assets/c39a479592fd627054ccc4895cb845312a89311e.png'),
        'figma:asset/c24660fe4a19f6fd887ab339e315fbb834fd2f14.png': path.resolve(__dirname, './src/assets/c24660fe4a19f6fd887ab339e315fbb834fd2f14.png'),
        'figma:asset/a5032e35cff8c788e6f5054a81a523294056dd2c.png': path.resolve(__dirname, './src/assets/a5032e35cff8c788e6f5054a81a523294056dd2c.png'),
        'figma:asset/9b38a3f29da042376287e2b2722f6cf0e3e32792.png': path.resolve(__dirname, './src/assets/9b38a3f29da042376287e2b2722f6cf0e3e32792.png'),
        'figma:asset/992084712a4e2993c64d5490fe6491573a5bd7bf.png': path.resolve(__dirname, './src/assets/992084712a4e2993c64d5490fe6491573a5bd7bf.png'),
        'figma:asset/8bfac9a9136b824f211e7817a352a4e0f6dc00d2.png': path.resolve(__dirname, './src/assets/8bfac9a9136b824f211e7817a352a4e0f6dc00d2.png'),
        'figma:asset/6bdad3b4c1d2d8be22539bc9c5bfffb690419146.png': path.resolve(__dirname, './src/assets/6bdad3b4c1d2d8be22539bc9c5bfffb690419146.png'),
        'figma:asset/5c335e4bc4fff959e467beb2c684fd6388a37ce0.png': path.resolve(__dirname, './src/assets/5c335e4bc4fff959e467beb2c684fd6388a37ce0.png'),
        'figma:asset/5b87c8807a8da8e6c62790f790c8127cda9383dc.png': path.resolve(__dirname, './src/assets/5b87c8807a8da8e6c62790f790c8127cda9383dc.png'),
        'figma:asset/31cca807cf831ce2961718577538b2f512f81d63.png': path.resolve(__dirname, './src/assets/31cca807cf831ce2961718577538b2f512f81d63.png'),
        'figma:asset/30bc4d6fe4c1713880624bcaf2d4808de21cc5c4.png': path.resolve(__dirname, './src/assets/30bc4d6fe4c1713880624bcaf2d4808de21cc5c4.png'),
        'figma:asset/2e4965dfacc14bbd0830b70220842fb7c26c722c.png': path.resolve(__dirname, './src/assets/2e4965dfacc14bbd0830b70220842fb7c26c722c.png'),
        'figma:asset/1dbee4b2b191d57cbad938e53e1fa3512b14f739.png': path.resolve(__dirname, './src/assets/1dbee4b2b191d57cbad938e53e1fa3512b14f739.png'),
        'figma:asset/1894942a0f10953246418c0851433f9d4dce87a0.png': path.resolve(__dirname, './src/assets/1894942a0f10953246418c0851433f9d4dce87a0.png'),
        'figma:asset/0e7f38708c9d652f5436dffe7f66536e3beb2043.png': path.resolve(__dirname, './src/assets/0e7f38708c9d652f5436dffe7f66536e3beb2043.png'),
        'figma:asset/023dc6b41eafabdb869df8e99a3d9dc43323e4a8.png': path.resolve(__dirname, './src/assets/023dc6b41eafabdb869df8e99a3d9dc43323e4a8.png'),
        '@supabase/supabase-js@2': '@supabase/supabase-js',
        '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  });