FROM oven/bun@sha256:8ede441e7561e2672a3e580cf408cff16830d44cc8bc1ce26ff97d215bd85771
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
#3
