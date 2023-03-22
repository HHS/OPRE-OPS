# Configuration Management
## CM-4 - Impact Analyses

Analyze changes to the system to determine potential security and privacy impacts prior to change implementation.

## OPS Implementation

As part of the OPS Test Plan, security scans are completed on an ongoing basis, throughout the Continuous Integration (CI).  Automated scans are run on every push, pull request, and merge on GitHub.

Security scanning is completed using OWASP ZAP dynamic security scans, CodeQL semantic code analysis (SCA) scanning, Semgrep static analysis scanning, and Dependabot vulnerability dependency scanning.  Dependabot will automatically open Pull Requests if there is a vulnerability dependency. If there are no findings, no Pull Requests will be opened.  Semgrep and CodeQL scans are the last step for each CI run.  If vulnerabilities are found in the scan results, the code will be prevented from being deployed until the vulnerabilities are remediated.
### Control Orgination
ACF OCIO, Cloud.gov and OPS
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
ACF OCIO designated personnel with security or privacy responsibilities conduct impact analyses. Individuals conducting impact analyses possess the necessary skills and technical expertise to analyze the changes to systems as well as the security or privacy ramifications. Impact analyses include reviewing security and privacy plans, policies, and procedures to understand control requirements; reviewing system design documentation and operational procedures to understand control implementation and how specific system changes might affect the controls; reviewing the impact of changes on organizational supply chain partners with stakeholders; and determining how potential changes to a system create new risks to the privacy of individuals and the ability of implemented controls to mitigate those risks. Impact analyses also include risk assessments to understand the impact of the changes and determine if additional controls are required.
