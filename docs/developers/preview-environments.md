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
- **Linked issues get the link too.** The workflow finds the issue from the `OPS-<N>/` branch prefix, links or
  `#N` references in the PR description's *Issue* section, and the Development sidebar. It posts one short comment
  per PR on each issue, with the URL and status, and updates it in place as the preview deploys, fails or is removed.
  An issue unlinked later keeps its last comment.
- **The "View deployment" button** near the bottom of the PR opens the preview once it's ready. It goes inactive when
  the preview is removed.

## Using it

- **Log in:** choose *Sign in with FakeAuth* and pick a role: System Owner, Budget Team Member, Procurement Team
  Member, Division Director, User Demo, Administrative Power User or Read Only User.
- **Data** is the same test data as local Docker and dev. Nothing you do on a preview reaches dev or another preview.
- **Reset the data:** **Actions > Preview Create > Run workflow**, enter the PR number. This wipes and reseeds the
  database. The PR must be open and labelled.

## Limits

- **At most 8 previews at once (best effort).** Past that, the comment says the cap is reached and nothing deploys.
  Two PRs labelled at almost the same moment can occasionally let a 9th through. There is no automatic retry: once a
  slot frees up (someone removes their label, or a PR closes), push a commit or remove and re-add the label.
- **Lifetime:** a preview with no pushes, deploys or human comments for 5 days is removed by the nightly reaper. A
  warning comment appears after 4 days; a push or any comment keeps it.
- **Not available:** HHS AMS login, `/storybook`, `/docs/*` and document upload.
- **Merge conflicts:** GitHub doesn't run PR workflows while a PR has a merge conflict, so pushes and label changes
  do nothing until it's resolved. The nightly reaper still removes the preview if the PR is closed or unlabelled.
- **Edited migrations:** if you change a migration that already ran on the preview, `upgrade head` won't rerun it.
  Reseed.

## Troubleshooting

| Symptom | Check |
|---|---|
| No comment after labelling | The PR is from a fork or has a merge conflict, or the Preview Create run failed; open it from the PR's checks |
| Status says *Deploy failed* | Follow *Latest run* in the comment. Database step failures link to the preview-db job's execution history in the Azure portal |
| URL shows a 404 page | The preview was removed, never deployed (cap), or is still deploying |
| A push didn't update the preview | The PR has a merge conflict; resolve it and push again |
| Status says the branch is older than the preview workflows | Merge `main` into the branch, then push or re-add the label |
| Data looks wrong after a migration change | Reseed (see above) |
| Login fails | Make sure you used FakeAuth; AMS isn't configured on previews |

## How it works (for maintainers)

- **GitHub deployments:** the deploy job creates a deployment in the `preview` environment for the PR's branch
  through the API, and destroy marks the PR's deployments inactive. GitHub creates the environment on the first
  deployment. Leave it without protection rules or branch policies: those gate jobs that use the `environment` key,
  which these workflows don't, so they'd only mislead.
- **Routing:** the App Gateway's wildcard listener sends `pr-<N>.ops.opre.acf.gov` to the preview router, which
  proxies to `opre-ops-pr<N>-app-{frontend,backend}` in `opre-ops-dev-app-cae`.
- **Database:** CI runners can't reach the private preview server (`opre-ops-dev-db-preview-pg-server`), so every
  database step runs `preview_seed.sh` in the Terraform-managed `opre-ops-dev-app-preview-db` job, started with the
  PR's data-tools image.
- **Secrets:** the deploy identity can't read Key Vault, so the backend's DB password and the preview-only JWT
  keypair are copied from that job's secrets. They're masked in logs and never echoed.
- **Slots:** a PR holds a slot while its backend app (tagged `preview-pr`) exists. Claims are ranked by a
  timestamp taken just before the app is created, so two claims a moment apart can both land inside the cap; the cap
  is best effort.
- **Build cache:** preview builds read the shared `:deps` cache but push their own `:deps-pr-<N>` tag, so they never
  change the cache dev, staging and prod builds use.
- **Testing the cap by hand:** set `PREVIEW_MAX_SLOTS=1` in the job env temporarily.
- **Dispatch and schedule** only run from `main`. The reaper and the reseed's gate job run `main`'s script; the
  reseed's build and deploy jobs check out the PR head and run its copy.
