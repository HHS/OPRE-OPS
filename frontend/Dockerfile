# Use the official Bun image (using a tag version for consistency)
FROM oven/bun:1 AS base
WORKDIR /home/app

# Stage to install only production dependencies
FROM base AS prod-deps
RUN mkdir -p /home/app
COPY package.json bun.lockb /home/app/
WORKDIR /home/app
RUN bun install --frozen-lockfile --production

# Production image – copy only production dependencies and source code (assumes your code is prebuilt)
FROM base AS release
COPY --from=prod-deps /home/app/node_modules ./node_modules
COPY . .
# If you have a build step that does not rely on devDependencies, run it here
CMD ["bun", "start"]
