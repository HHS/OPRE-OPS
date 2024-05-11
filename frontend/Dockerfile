FROM oven/bun@sha256:079291a18dd6aa9d0858abab5df925172dbee4f12b938ec51bec650e160a20a0
RUN apt-get --no-install-recommends -y install unzip=6.0-28 && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/

RUN bun install

COPY --chown=app:app ./ /home/app/

CMD ["bun", "start"]
