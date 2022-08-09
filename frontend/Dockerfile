FROM node:18
WORKDIR /frontend
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN apt-get update && apt-get install chromium=105.0 -y --no-install-recommends \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY ./package.json ./yarn.lock /frontend/
RUN yarn install && yarn cache clean

COPY ./ /frontend/
RUN ls -la /usr/bin/
ENTRYPOINT ["yarn", "start"]
