# Risk Assessment
## RA-03-1 - Risk Assessment | Supply Chain Risk Assessment

(a) Assess supply chain risks associated with [ACF-defined systems, system components, and system services in accordance with HHS Policy for Cyber Supply Chain Risk Management or ACF Policy]; and

(b) Update the supply chain risk assessment [ACF-defined frequency], when there are significant changes to the relevant supply chain, or when changes to the system, environments of operation, or other conditions may necessitate a change in the supply chain.

## OPS Implementation

OPS utilizes vulnerability scanning of sotfware dependencies in our supply chain using tools including but not limited to Renovatebot and Dependabot.  Both of these tools will automatically open Pull Requests if there is a dependency to be upgraded as a result of a vulnerability or risk in dependencies in the software supply chain. If there are no findings, no Pull Requests will be opened.  Semgrep and CodeQL scans are the last step for each CI run.  If vulnerabilities are found in the scan results, the code will be prevented from being deployed until the vulnerabilities are remediated.

TODO: Generate any text around supply chain risk assessment. Is the supply chain risk assessment part of the larger RA?

### Control Orgination:

Hybrid with IaaS provider, ACF Tech, and OPS

### Related Content

Supply chain-related events include disruption, use of defective components, insertion of counterfeits, theft, malicious development practices, improper delivery practices, and insertion of malicious code. These events can have a significant impact on the confidentiality, integrity, or availability of a system and its information and, therefore, can also adversely impact organizational operations (including mission, functions, image, or reputation), organizational assets, individuals, other organizations, and the Nation. The supply chain-related events may be unintentional or malicious and can occur at any point during the system life cycle. An analysis of supply chain risk can help an organization identify systems or components for which additional supply chain risk mitigations are required.
