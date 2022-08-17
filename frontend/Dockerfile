FROM node:18-slim
WORKDIR /frontend
COPY ./package.json ./yarn.lock /frontend/
RUN yarn install && yarn cache clean

COPY ./ /frontend/
ENTRYPOINT ["yarn", "start"]
