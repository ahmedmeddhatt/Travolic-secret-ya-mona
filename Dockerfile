FROM node:18

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .
RUN yarn build

ENV NODE_OPTIONS='--max-old-space-size=8192'
EXPOSE 8080
CMD [ "node", "dist/index.js" ]
