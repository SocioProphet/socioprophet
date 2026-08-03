# sp-server — the sovereign API / delivery producer.
#
# Node 24: the server runs TypeScript directly (`node src/server.ts`) and the
# delivery route dynamically imports `.ts` services, both of which require Node's
# native type-stripping (stable + on-by-default from Node 23.6). Node 18 could not
# run this at all. Matches the delivery-mirror-sync workflow (setup-node 24).
FROM node:24-alpine

# set working directory
WORKDIR /usr/src/app/sp-server

# install dependencies first (cached layer) …
COPY package.json .
RUN yarn

# … then copy the rest of the source.
COPY . .

# serve on 8080 (matches the k8s Deployment PORT env + probes)
EXPOSE 8080
CMD [ "yarn", "start" ]
