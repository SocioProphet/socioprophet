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
        // Canonical knowledge graph — hellgraph-service (the shared HTTP HellGraph engine).
        // Both this cockpit's Knowledge Graph and the Prophet Studio Graph Explorer read it,
        // so "the graph" is one across every surface. Strip the /svc/hellgraph prefix.
        '/svc/hellgraph': {
          target: env.VITE_HELLGRAPH_BASE || 'http://localhost:8090',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/svc\/hellgraph/, ''),
        },
        // owl-reasoner (RDFS/OWL entailment) + entity-resolution — the Studio Reason & Resolve bench.
        '/svc/reason': {
          target: env.VITE_REASON_BASE || 'http://localhost:8081',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/svc\/reason/, ''),
        },
        '/svc/er': {
          target: env.VITE_ER_BASE || 'http://localhost:8082',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/svc\/er/, ''),
        },
        // algo-engine — REAL backtest + paper-execution for the Algorithmic Trading surface.
        '/svc/algo': {
          target: env.VITE_ALGO_BASE || 'http://localhost:8085',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/svc\/algo/, ''),
        },
        // ie-engine — REAL NLP / information-extraction (spaCy) for the NLP & IE surface.
        '/svc/ie': {
          target: env.VITE_IE_BASE || 'http://localhost:8086',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/svc\/ie/, ''),
        },
        // holmes — REAL claim verification over HellGraph evidence (Go service).
        '/svc/holmes': {
          target: env.VITE_HOLMES_BASE || 'http://localhost:8091',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/svc\/holmes/, ''),
        },
        // synapseiq-bridge — language intelligence: normalization + KKO type classification.
        '/svc/synapse': {
          target: env.VITE_SYNAPSE_BASE || 'http://localhost:8092',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/svc\/synapse/, ''),
        },
        // sherlock-engine — Tantivy (Rust, no-JVM) ontology-driven Discovery search.
        '/svc/sherlock': {
          target: env.VITE_SHERLOCK_BASE || 'http://localhost:8093',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/svc\/sherlock/, ''),
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
