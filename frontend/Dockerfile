FROM oven/bun@sha256:27559fe0c5986d9ac7977b5e788472da6ad42611eb06b37843ded64f4f629ee7
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
