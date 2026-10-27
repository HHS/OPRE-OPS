# Preview router: routes pr-<N>.ops.opre.acf.gov to that PR's container apps. See README.md.

FROM alpine:3.24.3 AS deps

# hadolint ignore=DL3018
RUN apk upgrade --no-cache && \
    apk add --no-cache nginx gettext-envsubst ca-certificates

FROM deps AS release

COPY nginx.conf.template /etc/nginx/router.conf.template
COPY --chmod=0755 docker-entrypoint.sh /docker-entrypoint.sh

USER nginx

# Fail the build if the rendered config is invalid. Runs as nginx, like the
# container, so it leaves nothing root-owned in /tmp.
RUN ACA_DOMAIN=build.invalid RESOLVER=127.0.0.1 /docker-entrypoint.sh \
      nginx -t -e stderr -c /tmp/nginx.conf && \
    rm -rf /tmp/*

EXPOSE 8080/tcp

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-e", "stderr", "-c", "/tmp/nginx.conf", "-g", "daemon off;"]
