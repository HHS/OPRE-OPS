#!/bin/sh
set -eu

: "${ACA_DOMAIN:?ACA_DOMAIN must be set to the container app environment default domain}"
echo "$ACA_DOMAIN" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' ||
  { echo "ACA_DOMAIN is not a valid domain: $ACA_DOMAIN" >&2; exit 1; }

# nginx needs an explicit resolver; use the first IPv4 nameserver unless one is given.
RESOLVER="${RESOLVER:-$(awk '$1 == "nameserver" && $2 ~ /^[0-9.]+$/ { print $2; exit }' /etc/resolv.conf)}"
: "${RESOLVER:?no IPv4 nameserver in /etc/resolv.conf; set RESOLVER}"
export ACA_DOMAIN RESOLVER

envsubst '${ACA_DOMAIN} ${RESOLVER}' < /etc/nginx/router.conf.template > /tmp/nginx.conf
exec "$@"
