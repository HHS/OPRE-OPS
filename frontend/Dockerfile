FROM node:18.7.0-alpine3.16
WORKDIR /frontend
COPY ./ /frontend/
RUN yarn install && yarn cache clean
ENTRYPOINT ["yarn", "start"]
