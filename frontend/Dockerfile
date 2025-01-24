FROM oven/bun@sha256:e68d616e9b4b689d57dd51c11b3dab3fd003330f7b7c59e1745cdc542a666d91
FROM oven/bun@sha256:eeb5977d3987150b32d45b493c2fa0d8449065a9feb579cc8d7fcdeeabe6e862
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
