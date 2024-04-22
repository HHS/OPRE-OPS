FROM oven/bun@sha256:ea572eace71acadb17ea5c408550eafd5ab82f2f6f48c04b906a3091e017cf35
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
