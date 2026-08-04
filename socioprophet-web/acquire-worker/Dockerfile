# syntax=docker/dockerfile:1.7
# acquire-worker — the governed web-acquisition executor (policy → robots → rate → reputation →
# provenance → SynapseIQ enrich → sink) behind POST /acquire, which the Noetica agent-machine
# dispatches to. The build BUNDLES the worker + the client-vue acquisition core (imported at
# ../../client-vue/src/features/acquisition) + undici into a single self-contained CJS via esbuild,
# so the RUNTIME image is just node + one file — no cross-repo tree, no node_modules, tiny.
# BUILD CONTEXT = socioprophet-web/  (to reach the sibling client-vue core at bundle time):
#   docker build -f acquire-worker/Dockerfile -t acquire-worker .
FROM node:20-alpine AS build
WORKDIR /app
# The core the bundler resolves (kept minimal): the acquisition feature modules + the two pure data
# files they import. No browser/Vue code is on this path.
COPY client-vue/src/features/acquisition /app/client-vue/src/features/acquisition
COPY client-vue/src/data/dataSources.ts  /app/client-vue/src/data/dataSources.ts
COPY client-vue/src/data/countries.ts    /app/client-vue/src/data/countries.ts
COPY acquire-worker/package.json acquire-worker/package-lock.json /app/acquire-worker/
WORKDIR /app/acquire-worker
RUN npm ci
COPY acquire-worker/src /app/acquire-worker/src
RUN npm run bundle    # esbuild → dist/server.cjs (self-contained: inlines the core + undici)

# Runtime: just node + the one bundled file. Governed sinks/enrichers are wired via env at deploy:
#   ACQUIRE_SINK  → prophet-mesh /v1/acquire/ingest (evidence) ; SYNAPSEIQ_URL → synapseiq-reasoning-api
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/acquire-worker/dist/server.cjs /app/server.cjs
ENV PORT=8790 NODE_ENV=production
EXPOSE 8790
USER node
CMD ["node", "server.cjs"]
