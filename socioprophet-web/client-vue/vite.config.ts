import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_ROUTER_BASE || '/';

  return {
    base,
    plugins: [vue()],
    server: {
      port: 5174,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE || 'http://localhost:8088',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
