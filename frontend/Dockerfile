FROM oven/bun@sha256:c797130be8cea78ce4c4bca7ac48b6d0e13407770ac224e0e2169b81e831f008
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
