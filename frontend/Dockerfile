FROM node:18-slim

RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY ./package.json ./yarn.lock /home/app/
RUN yarn install && yarn cache clean

COPY ./ /home/app/
ENTRYPOINT ["yarn", "start"]
