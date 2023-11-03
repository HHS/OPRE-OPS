FROM oven/bun:latest

RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/
RUN bun install --production --network-timeout 100000 
# && bun cache clean

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]