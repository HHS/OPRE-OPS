FROM oven/bun:latest

RUN useradd -ms /bin/bash app
USER app
WORKDIR /home/app

COPY --chown=app:app ./package.json ./bun.lockb /home/app/
RUN bun install --production --network-timeout 100000 
# && bun cache clean

COPY --chown=app:app . .
CMD ["bun", "start"]







# RUN useradd -ms /bin/bash app
# USER app

# WORKDIR /home/app/

# # Assuming you want to copy the package.json from your host to the container
# COPY --chown=app:app package.json .

# # Uncomment the next line if you want to run bun install
# RUN bun install --production --network-timeout 100000 && bun cache clean

# # Copy the rest of your app's source code from your host to the container
# COPY --chown=app:app . .