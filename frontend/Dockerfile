FROM oven/bun@sha256:8a8e4aec3166e38f23584900fb62635c6c40f5aa19915267bc1464da42c93132
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
