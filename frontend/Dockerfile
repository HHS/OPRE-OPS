FROM node:18-slim
#RUN apt-get update && apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb -y
WORKDIR /frontend
COPY ./package.json ./yarn.lock /frontend/
RUN yarn install && yarn cache clean

COPY ./ /frontend/
ENTRYPOINT ["yarn", "start"]
