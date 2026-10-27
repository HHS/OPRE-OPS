# Preview router: routes pr-<N>.ops.opre.acf.gov to that PR's container apps. See README.md.

FROM alpine:3.24.3 AS deps

# hadolint ignore=DL3018
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache nginx gettext-envsubst ca-certificates && \
    rm -rf /var/cache/apk/*

FROM deps AS release

COPY nginx.conf.template /etc/nginx/router.conf.template
COPY --chmod=0755 docker-entrypoint.sh /docker-entrypoint.sh

# Fail the build if the rendered config is invalid.
RUN ACA_DOMAIN=build.invalid RESOLVER=127.0.0.1 /docker-entrypoint.sh \
      nginx -t -e stderr -c /tmp/nginx.conf && \
    rm /tmp/nginx.conf

USER nginx

EXPOSE 8080/tcp

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-e", "stderr", "-c", "/tmp/nginx.conf", "-g", "daemon off;"]
