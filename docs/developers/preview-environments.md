# Preview environments

**TL;DR:** add the `preview` label to a same-repo PR. About 15 minutes later a comment on the PR links to
`https://pr-<N>.ops.opre.acf.gov`, a full copy of OPS (frontend, backend and its own seeded database) running that PR's
code. Log in with FakeAuth. Pushes update it and keep your data. Removing the label or closing the PR deletes it.

Design: [ADR 032](../adr/032-pr-preview-environments.md). Workflows: `preview_create.yml`, `preview_destroy.yml`,
`preview_reap.yml`, all wrappers around `.github/scripts/preview.sh`.

## Getting a preview

| You do | What happens |
|---|---|
| Add the `preview` label | Images build, a fresh `ops_pr_<N>` database is seeded, and the apps deploy |
| Push a commit | The PR's images rebuild and the database is migrated (`alembic upgrade head`); data you entered stays |
| Reopen a closed PR that has the label | Same as a push; the database is seeded again because closing removed it |
| Remove the label, or close the PR | The apps and database are deleted, and the URL shows a 404 page |
| Add or remove any other label | Nothing |

- **Same-repo PRs only.** Fork PRs never get a preview.
- **The status comment** (one per PR, updated in place) shows the URL, the deployed commit, the status and when the
  data was last seeded.

## Using it

- **Log in:** choose *Sign in with FakeAuth* and pick a role: System Owner, Budget Team Member, Procurement Team
  Member, Division Director, User Demo, Administrative Power User or Read Only User.
- **Data** is the same test data as local Docker and dev. Nothing you do on a preview reaches dev or another preview.
- **Reset the data:** **Actions > Preview Create > Run workflow**, enter the PR number. This wipes and reseeds the
  database. The PR must be open and labelled.

## Limits

- **At most 8 previews at once.** Past that, the comment says the cap is reached and nothing deploys. There is no
  automatic retry: once a slot frees up (someone removes their label, or a PR closes), push a commit or remove and
  re-add the label.
- **Lifetime:** a preview with no pushes, deploys or human comments for 5 days is removed by the nightly reaper. A
  warning comment appears after 4 days; a push or any comment keeps it.
- **Not available:** HHS AMS login, `/storybook`, `/docs/*` and document upload.
- **Edited migrations:** if you change a migration that already ran on the preview, `upgrade head` won't rerun it.
  Reseed.

## Troubleshooting

| Symptom | Check |
|---|---|
| No comment after labelling | The PR is from a fork, or the Preview Create run failed; open it from the PR's checks |
| Status says *Deploy failed* | Follow *Latest run* in the comment. Database step failures link to the preview-db job's execution history in the Azure portal |
| URL shows a 404 page | The preview was removed, never deployed (cap), or is still deploying |
| Data looks wrong after a migration change | Reseed (see above) |
| Login fails | Make sure you used FakeAuth; AMS isn't configured on previews |

## How it works (for maintainers)

- **Routing:** the App Gateway's wildcard listener sends `pr-<N>.ops.opre.acf.gov` to the preview router, which
  proxies to `opre-ops-pr<N>-app-{frontend,backend}` in `opre-ops-dev-app-cae`.
- **Database:** CI runners can't reach the private preview server (`opre-ops-dev-db-preview-pg-server`), so every
  database step runs `preview_seed.sh` in the Terraform-managed `opre-ops-dev-app-preview-db` job, started with the
  PR's data-tools image.
- **Secrets:** the deploy identity can't read Key Vault, so the backend's DB password and the preview-only JWT
  keypair are copied from that job's secrets. They're masked in logs and never echoed.
- **Slots:** a PR holds a slot while its backend app (tagged `preview-pr`) exists. Concurrent claims settle by
  creation time, so only the latest claim past the cap backs out.
- **Testing the cap by hand:** set `PREVIEW_MAX_SLOTS=1` in the job env temporarily.
- **Dispatch and schedule** only run from `main`, so reseeding and the reaper use `main`'s workflow and script.
