# Secret Key Management Strategy

The goal of these efforts is to help prevent unintended secret key leakage. Though it isn't possible to completely eliminate the possibility of secret key leakage, the strategies documented herein will help improve incident response in the event where keys are leaked.

Herein the following is described:
- [Secret Key Management Strategy](#secret-key-management-strategy)
  - [What are secret keys and how can these be leaked?](#what-are-secret-keys-and-how-can-these-be-leaked)
  - [Mitigation practices](#mitigation-practices)
    - [Manual steps](#manual-steps)
    - [Automated steps](#automated-steps)
  - [Communication protocol if secret keys are leaked](#communication-protocol-if-secret-keys-are-leaked)

## What are secret keys and how can these be leaked?

TODO:
- Describe what secrets are being used

If secret keys are leaked/exposed, this can not only change how the OPS system functions, but this also compromises the security of the data flowing through the system. There are two primary avenues that secret key leakage can happen:
- a security breach in one or more of the project tools (e.g. GitHub, Terraform, Cloud.gov, Docker) that use or rely on secret keys  (*relatively speaking, this is challenging to prevent*), or
- a team member with access to the secret keys leaks them (*this is usually unintentional*).

## Mitigation practices
Below are a list of steps the team is taking to help mitigate the incidence of secret key leakage and stay up-to-date on news that could potentially compromise the security state of our OPS system.

### Manual steps
- Use `git status` terminal command before any commits and pushes to github repo. This should help detect any secret key files that have been modified prior to `git commit`.

- Use `pre-commit` [Hooks](https://pre-commit.com/) specifically [git-leaks](https://github.com/zricethezav/gitleaks), which runs prior to commits, and does an extensive job of looking for specific secret types.

- Secret keys are to be retrieved from cloud.gov for local development purposes. Cloud.gov is a platform that requires these keys, and the dev team has access to the keys stored in the dev environment space. Therefore, this is a more secure approach for retrieving keys than relying on team members to share keys across any other platforms or tools.

- No production keys will be stored on local machines since this is unnecessary for development work.  In the event of unintended secret key leakage, this would have no impact on the production environment. Only people who have access to the production space in Cloud.gov will have access to prod keys.

- Secret keys will be rotated whenever team members rotate off the project.

- As part of OPRE Tech Lead's periodic review of environment variables, secret key rotation will be coordinated. These reviews will take place at defined intervals.

- At a minimum, ACF and vendor Tech Leads should be subscribed to tech tools we use to stay up-to-date on news that could impact project security. This includes: **GitHub, Snyk, Cloud.gov, and Docker.**

### Automated steps

- [GitHub Native Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)

- OPS utilizes [GitHub Push protection for our repository](https://docs.github.com/en/code-security/secret-scanning/push-protection-for-repositories-and-organizations)

- `JWT_PRIVATE_KEY` TODO: say something


## Communication protocol if secret keys are leaked
Any member of the OPS who notices secret key leakage should alert the full OPS project team immediately as follows:

- Send alert via [Slack opre-ops-all Channel](https://flexion.slack.com/archives/C03LS8KGQBS) and be sure to specifically mention: OPRE Product Owner, OPRE Tech Lead, vendor Delivery Manager, vendor Tech Lead.

- Include details of the leakage, which should include:
    - where the leakage ocurred
    - how the leakage occurred (if known)
    - preliminary assessment of the scope of the leakage (e.g. was PII compromised? exposed?)
    - Next steps (e.g. schedule mtg to discuss incident response plan, rotate keys, etc.)
