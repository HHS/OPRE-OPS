# Use the official Bun image (using a tag version for consistency)
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Stage to install only production dependencies
FROM base AS prod-deps
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
WORKDIR /temp/prod
RUN bun install --frozen-lockfile --production

# Production image – copy only production dependencies and source code (assumes your code is prebuilt)
FROM base AS release
COPY --from=prod-deps /temp/prod/node_modules ./node_modules
COPY . .
# If you have a build step that does not rely on devDependencies, run it here
CMD ["bun", "start"]
