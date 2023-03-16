# Configuration Management
## CM-3 - Configuration Change Control

a. Determine and document the types of changes to the system that are configuration-controlled;<br />
b. Review proposed configuration-controlled changes to the system and approve or disapprove such changes with explicit consideration for security and privacy impact analyses;<br />
c. Document configuration change decisions associated with the system;<br />
d. Implement approved configuration-controlled changes to the system;<br />
e. Retain records of configuration-controlled changes to the system for [no less than twelve (12) months after the change];<br />
f. Monitor and review activities associated with configuration-controlled changes to the system; and<br />
g. Coordinate and provide oversight for configuration change control activities through [change control boards or other control bodies] that convenes [at least once per month]; when [ACF-defined configuration change conditions].

## OPS Implementation

a. Configuration of OPS that is changed by OPS users and is managed within the live running state of the application itself where the configuration state is persistend in the application's persistent storage mechanism would be logged in a transaction as part of OPS's transaction logs. Refer to [au-3](../au-03/index.md), [ac-6-9](../ac-06-9/index.md), [ac-6-1](../ac-06-1/index.md), and [ac-6-2](../ac-06-2/index.md). Other configuration changes to OPS would require changes to configuration stored and managed in its GitHub repository.

b. As part of the OPS Test Plan, security scans are completed on an ongoing basis, throughout the Continuous Integration (CI).  Automated scans are run on every push, pull request, and merge on GitHub.  Additionally, GitHub pull requests for deployment to a production environment require thorough review and approval according to GitHub branch protection rules.

Security scanning is completed using OWASP ZAP dynamic security scans, CodeQL semantic code analysis (SCA) scanning, Semgrep static analysis scanning, and Dependabot vulnerability dependency scanning.  Dependabot will automatically open Pull Requests if there is a vulnerability dependency. If there are no findings, no Pull Requests will be opened.  Semgrep and CodeQL scans are the last step for each CI run.  If vulnerabilities are found in the scan results, the code will be prevented from being deployed until the vulnerabilities are remediated. [cm-4](../cm-04/index.md)

c. Change decisions and justifications would be documented as part of the GitHub pull request facilitating the change. In some cases where the scope and size of changes are larger in nature, an [architecture decision record](https://github.com/HHS/OPRE-OPS/tree/main/docs/adr) may be created or updated accordingly as part of the pull request.

d. OPS utilizes a Continuous Deployment (CD) process using GitHub such that duly-authorized and approved changes, via the mechanism of a GitHub Pull Request, are automatically deployed at the time the requested code branch (changes) are merged to the destiantion branch (environment).

e. GitHub maintains full revision and release history for OPS. [cm-2-3](../cm-02-3/index.md)

f. TODO: who monitors and reviews?  ACF OCIO?

g. TODO: Discuss with ACF OCIO. This seems like a potential anti-pattern to our CI/CD processes.

TODO: Seek hybrid inheritance from cloud.gov and ACF OCIO policies.

### Related Content

* [au-3](../au-03/index.md)
* [ca-7](../ca-07/index.md)
* [cm-2](../cm-02/index.md)
* [cm-4](../cm-04/index.md)
* [cm-5](../cm-05/index.md)
* [cm-6](../cm-06/index.md)
* [cm-9](../cm-09/index.md)
* [cm-11](../cm-11/index.md)
* [ia-3](../ia-03/index.md)
* [ma-2](../ma-02/index.md)
* [ra-8](../ra-08/index.md)
* [sa-8](../sa-08/index.md)
* [sa-10](../sa-10/index.md)
* [sc-28](../sc-25/index.md)
* [sc-34](../sc-34/index.md)
* [sc-37](../sa-37/index.md)
* [si-2](../si-02/index.md)
* [si-3](../si-03/index.md)
* [si-4](../si-04/index.md)
* [si-7](../si-07/index.md)
* [si-10](../si-10/index.md)
