# Secret Key Management Strategy

Moving forward, the dev team will be taking additional precautions to protect the OPS system from unauthorized access. 

The goal of these efforts is to help prevent unintended secret key leakage. Though it isn't possible to completely eliminate the possibility of secret key leakage, the strategies documented herein will help improve incident response in the event where keys are leaked. 

_See [secret key leakage post-mortem summary](https://hhsgov.sharepoint.com/sites/TANFDataPortalOFA/_layouts/15/Doc.aspx?sourcedoc={cbce2e75-17b2-4e70-b422-60d034fcd4af}&action=edit&wd=target%28Dev%20Notes.one%7C3dbb7d3a-694d-4f1c-a656-f907991c1f7d%2FSecret%20Key%20Leakage%20Post-Mortem%20Synthesis%7C0496800f-8810-4159-95e4-9fc605dc86d4%2F%29) for more details on how this strategy was informed._  

Herein the following is described:
- [what secret keys are and how these can be leaked](#What-are-secret-keys-and-how-can-these-be-leaked)
- [steps we are taking to minimize potential for secret key leakage](#Mitigation-practices)
- [incident response protocol if secret keys are leaked or at risk of exposure](#Communication-protocol-if-secret-keys-are-leaked)

## What are secret keys and how can these be leaked?

TODO:
- Describe what secrets are being used

If secret keys are leaked/exposed, this can not only change how the OPS system functions, but this also compromises the security of the data files flowing through the system (and the individuals and families represented in these data). There are two primary avenues that secret key leakage can happen: 
- a security breach in one or more of the project tools (e.g. GitHub, Terraform, Cloud.gov, Docker) that use or rely on secret keys  (*relatively speaking, this is challenging to prevent*), or 
- a team member with access to the secret keys leaks them (*this is usually unintentional*).

## Mitigation practices
Below are a list of steps the team is taking to help mitigate the incidence of secret key leakage and stay up-to-date on news that could potentially compromise the security state of our OPS system. 

This may be updated over time, as additional or alternative solutions are adopted. 

### Manual steps
- Use `git status` terminal command before any commits and pushes to github repo. This should help detect any secret key files that have been modified prior to `git commit`. 

- Use `pre-commit` [Hooks](https://pre-commit.com/) specifically [IBM Detect-Secrets](https://github.com/ibm/detect-secrets), which runs prior to commits, and does an extensive job of looking for specific secret types.

- Secret keys are to be retrieved from cloud.gov for local development purposes. Cloud.gov is a platform that requires these keys, and the dev team has access to the keys stored in the dev environment space. Therefore, this is a more secure approach for retrieving keys than relying on team members to share keys across other platforms/tools.  

- No production keys will be stored on local machines, since this is unnecessary for development work.  In the event of unintended secret key leakage, this would have no impact on the production environment. Only people who have access to the production space in Cloud.gov will have access to prod keys.

- Secret keys will be rotated whenever team members rotate off the project.

- As part of ACF Tech Lead's periodic review of environment variables, secret key rotation will be coordinated. These reviews will take place _quarterly_ or _prior to each release_ (whichever is sooner).

- At a minimum, ACF and vendor Tech Leads should be subscribed to tech tools we use to stay up-to-date on news that could impact project security. This includes: **GitHub, Snyk, Cloud.gov, and Docker.**

### Automated steps

- detect-secrets 

- `DJANGO_SECRET_KEY` is [now](https://github.com/raft-tech/TANF-app/pull/1151) automatically generated for initial deployments to Cloud.gov. This ensures that the key is not shared across any environments and never needs to be exposed to developers or stored outside of Cloud.gov.

- The `JWT_KEY (JWT_CERT_TEST)` that is used for unit testing is [now](https://github.com/raft-tech/TANF-app/pull/1243) dynamically generated to allow us to reduce the number of keys stored in CI/CD environment variables.


## Communication protocol if secret keys are leaked
Any member of the OPS who notices secret key leakage should alert the full OPS project team immediately as follows:

- Send alert via [Slack opre-ops-all Channel](https://flexion.slack.com/archives/C03LS8KGQBS) and be sure to cc: Product Owner, ACF Tech Lead, Product Manager, vendor Tech Lead. If Mattermost isn't available, please send an email. 

- Include details of the leakage, which should include:
    - where the leakage ocurred
    - how the leakage occurred (if known)
    - preliminary assessment of the scope of the leakage (e.g. was PII compromised? exposed?)
    - Next steps (e.g. schedule mtg to discuss incident response plan, rotate keys, etc.)
