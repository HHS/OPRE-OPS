FROM oven/bun@sha256:ce1b800a070f3a11330a344801d49980854de2e346e344e793d472e71c18581d
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
