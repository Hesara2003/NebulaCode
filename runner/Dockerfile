FROM node:20-alpine

RUN addgroup -S runner && adduser -S runner -G runner
USER runner
WORKDIR /home/runner/app

# Timeout wrapper
USER root
RUN apk add --no-cache coreutils
USER runner

# Copy runner scripts
COPY --chown=runner:runner src/ ./src/

ENV NODE_ENV=production
WORKDIR /home/runner/app

CMD ["timeout", "10s", "node", "src/index.js"]
