# 32. Per-PR Preview Environments

Date: 2026-10-26

## Status

Accepted

## Context

`dev.ops.opre.acf.gov` is the only deployed environment where QA can test, so QA feedback arrives only after merge,
and each round of fixes needs a new PR, two approvals, a merge and a deploy. Reviewers who want to try a change must
check out the branch and run the full Docker stack locally.

[OPS-6419](https://github.com/HHS/OPRE-OPS/issues/6419) asks for any same-repo PR labelled `preview` to get its own
temporary copy of the full stack at `https://pr-<N>.ops.opre.acf.gov`, so QA can sign off before merge.

Constraints:

- **The App Gateway is shared.** Dev and staging sit behind the same App Gateway (WAF), which DevOps manages in
  Terraform. Changes made outside Terraform are reverted on the next apply. A change to any listener or rule rewrites
  the whole gateway config, which takes several minutes and puts dev and staging at risk.
- **DNS:** the `pr-<N>` names fall in a DNS zone the SDLC deploy pipeline doesn't manage.
- **Cost:** previews should cost a few dollars per open PR, not a new fixed monthly bill.

## Options Considered

| Option | Summary | Decision |
|---|---|---|
| **Script adds per-PR gateway rules** | Each preview adds its own listener, rule and pool to the shared gateway | Rejected: reverted by the next Terraform apply, and every preview rewrites the gateway that dev and staging depend on |
| **Per-PR rules through Terraform** | Each preview adds its rules through a Terraform apply | Rejected: slow (several minutes per change), needs an apply per preview, and still changes the shared gateway each time |
| **Separate gateway for previews** | A dedicated WAF gateway only for previews | Rejected: full isolation, but adds roughly $300+/month of fixed cost |
| **One wildcard listener + preview router** | One permanent Terraform-managed listener for `*.ops.opre.acf.gov` sends preview traffic to a small router app that picks the PR's apps | **Chosen** |

## Decision

1. **The gateway changes once.** DevOps adds one wildcard listener and rule for `*.ops.opre.acf.gov`, matched after the
   dev and staging rules, plus a wildcard DNS record. Both are managed in Terraform. Previews never change the gateway
   or DNS after that.
2. **A preview router does the per-PR routing.** It's an nginx container app (`preview/router/`).
   - It reads the original hostname from the gateway's `x-original-host` header.
   - It accepts only `pr-<digits>.ops.opre.acf.gov`.
   - It proxies `/api`, `/auth` and `/documents` to that PR's backend container app, and everything else to its
     frontend.
3. **Each preview runs the PR's own images** as its own container apps.
   - It uses a database per PR (`ops_pr_<N>`) on one shared, small preview Postgres server.
   - The backend uses `ops/environment/azure/preview.py`: FakeAuth only, and a small connection pool.
   - `backend/data_tools/scripts/preview_seed.sh` seeds the database the first time and only migrates it after that.
4. **Workflows** (create, destroy, nightly reap) manage container apps and databases only. They are delivered
   separately from this ADR.

## Consequences

### Positive

- **No per-preview risk to dev or staging.** Previews never touch the gateway or DNS after the one-time setup.
- **Fast.** A preview is a container-app deploy, not a gateway update.
- **Same security front door.** All preview traffic still passes the gateway's WAF.
- **Cheap.** The router and the small Postgres server are the only fixed costs.

### Negative

- **One more component to run.** If the router is down, every preview is down (dev and staging aren't affected).
- **The gateway only health-checks the router**, not each preview, so the workflows must check each preview after
  deploying it.
- **Wildcard DNS:** any `*.ops.opre.acf.gov` name, typos included, reaches the gateway and gets a 404.
- **Previews are limited:** FakeAuth only, no HHS AMS login, no `/storybook` or `/docs`, and no document upload until
  storage access is set up. Changing a migration that's already applied needs a manual reseed.
- **Anyone can reach a preview and pick any FakeAuth role.** Previews hold only seeded test data, which matches dev.

## Related Issues

- [OPS-6419](https://github.com/HHS/OPRE-OPS/issues/6419): DevEx: Per-PR ephemeral preview environments
- [OPS-2632](https://github.com/HHS/OPRE-OPS/issues/2632): DEVEX: preview/staging deployment per branch (earlier
  proposal using App Service deployment slots)
