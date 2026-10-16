// Demo build: one self-contained HTML file with an in-browser fake backend.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, '..'),
  base: './',
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'demo-no-pwa',
      resolveId(id) {
        if (id === 'virtual:pwa-register') return '\0demo-pwa';
        return null;
      },
      load(id) {
        if (id === '\0demo-pwa') return 'export function registerSW() { return () => undefined; }';
        return null;
      }
    }
  ],
  resolve: {
    alias: { '@supabase/supabase-js': path.resolve(__dirname, 'mockSupabase.ts') }
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://demo.local'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('demo'),
    'import.meta.env.VITE_ENABLE_POSE_AI': JSON.stringify('false'),
    'import.meta.env.VITE_ENABLE_PUSHUP_AI': JSON.stringify('false'),
    'import.meta.env.VITE_DEMO_TOOLS': JSON.stringify('true')
  },
  build: { outDir: path.resolve(__dirname, 'dist'), emptyOutDir: true }
});
