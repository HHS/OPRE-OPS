FROM oven/bun@sha256:5707c7133c2aed32f30c8c2ba08d11a3b7c10609209c34e2b5f634a2da327886
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
