import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_ROUTER_BASE || '/';
  // The builder/auth backend (app-vue's Express server) serves /api/builds,
  // /api/fleet, /api/feed, /api/procybernetica WITH the /api prefix on :5050.
  // The client-vue data backend (:8088) serves everything else and expects
  // the /api prefix stripped. Route the specific builder prefixes first.
  const builderApi = env.VITE_BUILDER_API_BASE || 'http://localhost:5050';
  const dataApi = env.VITE_API_BASE || 'http://localhost:8088';
  const builderProxy = { target: builderApi, changeOrigin: true };

  return {
    base,
    plugins: [vue()],
    server: {
      port: 5174,
      open: true,
      proxy: {
        '/api/builds': builderProxy,
        '/api/fleet': builderProxy,
        '/api/feed': builderProxy,
        '/api/procybernetica': builderProxy,
        '/api': {
          target: dataApi,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        // Same-origin proxy to the live Prophet Mesh (mesh.socioprophet.ai has no CORS).
        '/mesh': {
          target: env.VITE_MESH_BASE || 'https://mesh.socioprophet.ai',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/mesh/, ''),
        },
      },
    },
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['src/__tests__/setup.ts'],
      include: ['src/__tests__/**/*.test.ts'],
    },
  };
});
