FROM node:19-slim

RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY ./package.json ./yarn.lock /home/app/
RUN yarn install --production --network-timeout 100000 && yarn cache clean

COPY ./ /home/app/
ENTRYPOINT ["yarn", "start"]
