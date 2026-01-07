# Client Dockerfile

# pull official base image as build image
FROM node:18-alpine as build

# set working directory
WORKDIR /usr/src/app/

# copy package.json from host to current location in alpine image
COPY package.json .

COPY yarn.lock .

RUN apk add --no-cache --virtual .gyp \
    python3 \
    make \
    g++ \
    && yarn \
    && apk del .gyp

# install dependencies inside image filesystem
# RUN yarn 

COPY . .

# build the source code 
RUN yarn build

# running the container on nginx server
FROM nginx:stable-alpine

# copy build to nginx index.html
COPY --from=build /usr/src/app/build /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf 

COPY nginx/nginx.conf /etc/nginx/conf.d

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]