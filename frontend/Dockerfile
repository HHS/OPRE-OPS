FROM oven/bun@sha256:efd679699a2c7d69e4ad21e07e5ac62d100f8e04a482911919be259c8a4b1da9
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/
RUN bun install --production --network-timeout 100000 

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]