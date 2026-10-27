# Preview router

A small nginx container that routes every per-PR preview hostname to that PR's container apps. Part of [OPS-6419](https://github.com/HHS/OPRE-OPS/issues/6419); see [ADR 032](../../docs/adr/032-pr-preview-environments.md) for why it exists.

## How it routes

The shared App Gateway has one wildcard listener for `*.ops.opre.acf.gov` whose backend is this app. The gateway rewrites `Host` to this app's own address and passes the original name in `x-original-host`.

| Request | Goes to |
|---|---|
| `pr-<N>.ops.opre.acf.gov` + `/api/*`, `/auth/*`, `/documents/*` | `https://opre-ops-pr<N>-app-backend.<ACA_DOMAIN>` |
| `pr-<N>.ops.opre.acf.gov` + anything else | `https://opre-ops-pr<N>-app-frontend.<ACA_DOMAIN>` |
| `/healthz` (any host) | `200 ok` from the router itself |
| Any other `x-original-host` | `404` |

The router sends `Host: <target>:443`, which the backend's CSRF check requires. It also rewrites redirects that point at internal names back to relative paths.

## Running it (for the Terraform definition)

| Setting | Value |
|---|---|
| Image | `ghcr.io/hhs/opre-ops/ops-preview-router:<commit SHA>`. **Pin the SHA tag.** `latest` is only the build cache, and container apps don't roll out a changed `latest`. A router change means bumping the tag. |
| Registry | The GHCR package is private by default: make it public, or give the app pull credentials. |
| Env `ACA_DOMAIN` | **Required.** The dev container app environment's default domain (e.g. `<name>.eastus.azurecontainerapps.io`). The container exits if it's missing or malformed. |
| Env `RESOLVER` | Optional. Defaults to the first IPv4 `nameserver` in `/etc/resolv.conf`. |
| Ingress | Internal, target port `8080` |
| Replicas | Minimum 1 (it's the only path to every preview) |

**Gateway settings for the wildcard listener:**
- **Module change:** the shared `app-gateway` module only passes `host_name` today, but Azure accepts wildcards only in `host_names`. Its `http_listener` block needs a `host_names` passthrough.
- **Rule priority:** must be a **higher number** than the dev and staging rules (100+i and 200+i), so their hostnames match first. Add a matching IPv6 listener, plus `*` A and AAAA records.
- **Backend HTTP settings:** HTTPS 443, `pick_host_name_from_backend_address = true`, `request_timeout` 60s or more.
- **Health probe:** host = the router's FQDN, `pick_host_name_from_backend_http_settings = false`, path `/healthz`, match 200–399.

## Checks

- **Image build:** fails if the rendered config doesn't pass `nginx -t`.
- **CI** (`.github/workflows/preview_router_build.yml`): smoke-tests `/healthz`, the 404 guard, and the backend/frontend split, using an unresolvable domain.
- **Locally:**

  ```bash
  docker build -t preview-router preview/router
  docker run --rm -p 8080:8080 -e ACA_DOMAIN=preview.invalid preview-router
  curl -i localhost:8080/healthz
  curl -i -H 'x-original-host: pr-12.ops.opre.acf.gov' localhost:8080/api/v1/health/   # 502; log shows target=...-backend...
  ```

**Confirm on the first real preview** (CI can't reach real container apps):
- [ ] The upstream TLS certificate verifies (`proxy_ssl_verify`); a failure shows as a 502 with "upstream SSL certificate verify error".
- [ ] `RESOLVER` resolves `opre-ops-pr<N>-app-*.<ACA_DOMAIN>`.
- [ ] Logging in with FakeAuth and creating an agreement works, which shows `check_csrf` accepts the forwarded Host and Referer.
- [ ] `GET /api/v1/agreements` (no trailing slash) redirects to `pr-<N>.ops.opre.acf.gov`, not an internal name.
