FROM oven/bun@sha256:8dcbf3f00e3b4df72c62bffc93e4a5ecca56ef0fe4aa55097f00c0ef7d634a7a
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
