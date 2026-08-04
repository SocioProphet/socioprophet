# syntax=docker/dockerfile:1.7
# acquire-worker — the governed web-acquisition executor. Runs the plane's real fetch
# (policy → robots → rate → reputation → provenance → SynapseIQ enrich → sink) behind POST /acquire,
# which the Noetica agent-machine dispatches to. It imports the acquisition CORE from the sibling
# client-vue package, so the BUILD CONTEXT IS socioprophet-web/ and both trees are copied at their
# real relative paths (../../client-vue/src/features/acquisition + ../../client-vue/src/data).
#
#   docker build -f acquire-worker/Dockerfile -t acquire-worker .   # run from socioprophet-web/
FROM node:20-alpine
WORKDIR /app

# The core the worker imports (kept minimal): the acquisition feature modules + the two pure data
# files they pull in (dataSources, countries). No browser/Vue code is on this import path.
COPY client-vue/src/features/acquisition /app/client-vue/src/features/acquisition
COPY client-vue/src/data/dataSources.ts  /app/client-vue/src/data/dataSources.ts
COPY client-vue/src/data/countries.ts    /app/client-vue/src/data/countries.ts

# Deps first for layer caching. tsx is the runtime (the worker is authored in TS and run via tsx);
# undici supplies the proxy dispatcher for the T2/T3 transport.
COPY acquire-worker/package.json acquire-worker/package-lock.json /app/acquire-worker/
WORKDIR /app/acquire-worker
RUN npm ci

COPY acquire-worker/src /app/acquire-worker/src

# Governed defaults — the estate wires the sinks/enrichers via env at deploy time:
#   ACQUIRE_SINK   e.g. http://prophet-mesh…/v1/acquire/ingest   (evidence)
#   SYNAPSEIQ_URL  e.g. http://synapseiq-reasoning-api…          (enrichment)
ENV PORT=8790 NODE_ENV=production
EXPOSE 8790
USER node
CMD ["npx", "tsx", "src/server.ts"]
