FROM oven/bun@sha256:7b3e42e76648052b5d479dee583087402eca986fc185f7023c7779aa9624566a
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
