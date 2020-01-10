FROM node:10.15.3-alpine as build

###### NOTES - TODO REMOVE
# - 92.3 MB - Original
# - 71.8 MB - Using `apk add nodejs` instead of building it
# - 57.6 MB - Removing unwanted depedencies + web3js
# - 33.7 MB - Bundling the code with webpack

# Create app directory
WORKDIR /usr/src/app

RUN apk update && \
    apk add git python make g++ curl && \
    rm -rf /var/cache/apk/*

COPY src/package.json .
COPY src/package-lock.json .
RUN npm install --production

# RUN npm install -D webpack webpack-cli
COPY src .
# RUN npm run bundle

# This results in a single layer image
FROM alpine

WORKDIR /usr/src/app

RUN apk add --update nodejs

COPY --from=build /usr/src/app /usr/src/app
COPY --from=build /usr/src/app/src/views /usr/src/app
ENV HTMLS_PATH=/usr/src/app

ENTRYPOINT node /usr/src/app/src/index.js
