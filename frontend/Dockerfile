FROM oven/bun@sha256:ac1ec47df7c97eb8dfc235dc9f9b9c25f42d0bfa7627c38e9322f25d5a5b08f9
# hadolint ignore=DL3008
RUN apt-get update && apt-get -y --no-install-recommends install unzip && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app index.html /home/app/
COPY --chown=app:app src /home/app/src
COPY --chown=app:app public /home/app/public
COPY --chown=app:app vite.config.mjs /home/app/
COPY --chown=app:app eslint.config.js /home/app/

CMD ["bun", "start"]
