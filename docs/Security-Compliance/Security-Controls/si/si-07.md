# System and Information Integrity
## SI-07 - Software, Firmware, and Information Integrity

a. Employ integrity verification tools to detect unauthorized changes to the following software, firmware, and information: [ACF-defined software, firmware, and information]; and

b. Take the following actions when unauthorized changes to the software, firmware, and information are detected: [system software, firmware, and information deemed to be critical to the integrity or functionality of the system].

## OPS Implementation

TODO: Seek inherited text. OPS dependencies are pinned to certain versions and where possible, sha signature of versions. container signing in place and used as part of CD processes. Other controls around configuration, protection. and logging of IaaS resources would apply as well

### Control Origination

Hybrid with IaaS vendor and OPS. Inherited from ACF Tech (AMS)

### Related Content

Unauthorized changes to software, firmware, and information can occur due to errors or malicious activity. Software includes operating systems (with key internal components, such as kernels or drivers), middleware, and applications. Firmware interfaces include Unified Extensible Firmware Interface (UEFI) and Basic Input/Output System (BIOS). Information includes personally identifiable information and metadata that contains security and privacy attributes associated with information. Integrity-checking mechanisms—including parity checks, cyclical redundancy checks, cryptographic hashes, and associated tools—can automatically monitor the integrity of systems and hosted applications.
