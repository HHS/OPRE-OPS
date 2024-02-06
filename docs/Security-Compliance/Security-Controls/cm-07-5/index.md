# Configuration Management
## CM-7-5 - Least Functionality | Authorized Software — Allow-by-exception

(a) Identify [ACF-defined software programs authorized to execute on the system];

(b) Employ a deny-all, permit-by-exception policy to allow the execution of authorized software programs on the system; and

(c) Review and update the list of authorized software programs [at least every 180 days].

## OPS Implementation

TODO: seek hybrid inheritance from cloud.gov.

a. and b. The application runtime for OPS is deployed as container running on and governed by the cloud.gov PaaS. Container permissions are confined by the host operating system. The relationship between containers and the host operating system is comprehensively covered in [NIST 800-190](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf). For the purposes of this documentation, a container should be specifically thought of as:

* A filesystem housing executable files and configuration files
* A set of running processes based upon items in the container filesystem

c. ACF OCIO will conduct a review TODO: seek text from ACF OCIO

### Related Content

* [cm-2](../cm-02/index.md)
* [cm-6](../cm-06/index.md)
* [cm-8](../cm-08/index.md)
* [cm-10](../cm-10/index.md)
* [pl-9](../pl-09/index.md)
* [pm-5](../pm-05/index.md)
* [sa-10](../sa-10/index.md)
* [sc-34](../sc-34/index.md)
* [si-7](../cm-07/index.md)
