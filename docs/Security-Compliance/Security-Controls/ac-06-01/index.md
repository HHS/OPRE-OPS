# Access Control
## AC-06 (01) - Least Privilege | Authorize Access to Security Functions

Authorize access for [ACF-defined individuals or roles] to:

(a) [Security functions (deployed in hardware, software, and firmware) including, at a minimum:

* Setting/modifying audit logs and auditing behavior;
* Setting/modifying boundary protection system rules;
* Configuring/modifying access authorizations (i.e., permissions, privileges);
* Setting/modifying authentication parameters; and
* Setting/modifying system configurations and parameters.; and]; and

(b) [Security-relevant information includes filtering rules for routers and firewalls, cryptographic key management details, configurations for security services, and access control lists (ACLs)].

### OPS Implementation

OPS allows users with the System Admin role to enact changes to some of the named security functions of OPS itself. Such changes are recorded in immutable audit logs as with any user-initiated change or transaction.

Implementation details related to hardware and firmware are inherited from cloud.gov and ACF OCIO Infrastructure.

### Related Content

[AC-2](ac-02/index.md)

[AC-5](ac-05/index.md)

[AC-6-7](ac-06-07/index.md)

[AC-6-9](ac-06-09/index.md)

[AU-2](au-2/index.md)
