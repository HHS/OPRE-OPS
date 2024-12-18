FROM oven/bun@sha256:4436601a4d639d036d7a35083c229422f84242f85b8280ff9cf0e0db97181860
# hadolint ignore=DL3008
RUN apt-get update && apt-get -y --no-install-recommends install unzip && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install --production --frozen-lockfile

COPY --chown=app:app index.html /home/app/
COPY --chown=app:app src /home/app/src
COPY --chown=app:app public /home/app/public
COPY --chown=app:app vite.config.mjs /home/app/
COPY --chown=app:app eslint.config.js /home/app/

CMD ["bun", "start"]
