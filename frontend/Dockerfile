FROM oven/bun@sha256:93de4e1020e594af410ab16a4563274836793357a820bf857435eb8b569f4445
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
