FROM node:18-alpine3.16
WORKDIR /frontend
COPY ./package.json ./yarn.lock /frontend/
RUN yarn install && yarn cache clean

COPY ./ /frontend/
ENTRYPOINT ["yarn", "start"]
