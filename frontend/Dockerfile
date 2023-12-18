FROM oven/bun@sha256:2705b32a23594adae93d88cd81d3356ae95f8daf8e64387c3e13811c7d0255d0
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
# Comment
