FROM oven/bun@sha256:e8c63d2231b9a1d58864b29822e61f3b7f6d31385950489c69c1e4af7dbda41a
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
