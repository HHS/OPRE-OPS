FROM oven/bun@sha256:489fa7b8b7a2f1dd58968bdf5b360fa144ac1d30bdcfdd98cdda33e33e6fbf22
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/
RUN bun install --production --network-timeout 100000 

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]