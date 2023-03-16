# Configuration Management
## CM-4 - Impact Analyses

Analyze changes to the system to determine potential security and privacy impacts prior to change implementation.

## OPS Implementation

As part of the OPS Test Plan, security scans are completed on an ongoing basis, throughout the Continuous Integration (CI).  Automated scans are run on every push, pull request, and merge on GitHub.

Security scanning is completed using OWASP ZAP dynamic security scans, CodeQL semantic code analysis (SCA) scanning, Semgrep static analysis scanning, and Dependabot vulnerability dependency scanning.  Dependabot will automatically open Pull Requests if there is a vulnerability dependency. If there are no findings, no Pull Requests will be opened.  Semgrep and CodeQL scans are the last step for each CI run.  If vulnerabilities are found in the scan results, the code will be prevented from being deployed until the vulnerabilities are remediated.

### Related Content

* [ca-7](../ca-07/index.md)
* [cm-3](../cm-03/index.md)
* [cm-8](../cm-08/index.md)
* [cm-9](../cm-09/index.md)
* [ra-5](../ra-05/index.md)
* [sa-5](../sa-05/index.md)
* [sa-8](../sa-08/index.md)
* [sa-10](../sa-10/index.md)
* [si-2](../si-02/index.md)
