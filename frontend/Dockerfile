FROM node:18
WORKDIR /frontend
COPY ./ /frontend/
RUN yarn install && yarn cache clean
ENTRYPOINT ["yarn", "start"]
