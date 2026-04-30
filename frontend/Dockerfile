# Use the official Bun image (using a tag version for consistency)
FROM oven/bun:1 AS base
# Patch OS packages so CVEs fixed upstream (e.g. OpenSSL) are picked up on rebuild
# even before oven/bun refreshes the :1 tag.
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
WORKDIR /home/app

# Stage to install only production dependencies
FROM base AS prod-deps
RUN mkdir -p /home/app
COPY package.json bun.lock /home/app/
WORKDIR /home/app
# Install production dependencies
RUN bun install --frozen-lockfile --production

# Production image - copy only production dependencies and source code (assumes your code is prebuilt)
FROM base AS release
COPY --from=prod-deps /home/app/node_modules ./node_modules
COPY . .
# If you have a build step that does not rely on devDependencies, run it here
CMD ["bun", "start"]
