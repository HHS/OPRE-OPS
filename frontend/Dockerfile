FROM oven/bun@sha256:1bb6296da61eff6bb0dea696f91f563c4758f946c1f1b4b94154179c8d08c2da
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
