import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-static-scripts',
      writeBundle() {
        // Copy regular scripts that Vite can't bundle
        copyFileSync('script.js', 'dist/script.js');
        copyFileSync('staggered-menu.js', 'dist/staggered-menu.js');

        // Copy full-resolution images referenced by data-full attributes
        const fullDir = 'dist/assets/full';
        if (!existsSync(fullDir)) mkdirSync(fullDir, { recursive: true });
        if (existsSync('assets/full')) cpSync('assets/full', fullDir, { recursive: true });

        const newAssetsDir = 'dist/assets/新素材';
        if (!existsSync(newAssetsDir)) mkdirSync(newAssetsDir, { recursive: true });
        const srcNewAssets = 'assets/新素材';
        if (existsSync(srcNewAssets)) cpSync(srcNewAssets, newAssetsDir, { recursive: true });
      },
    },
  ],
  appType: 'mpa',
  assetsInclude: ['**/*.glb'],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});
