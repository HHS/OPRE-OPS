# Boundary Protection
## SC-07 (12) - Boundary Protection | Host-based Protection

Implement [Assignment: organization-defined host-based boundary protection mechanisms] at [Assignment: organization-defined system components].

## OPS Implementation

The application runtime for OPS is deployed as container running on and governed by _______. Container permissions are confined by the host operating system. The relationship between containers and the host operating system is comprehensively covered in [NIST 800-190](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf). For the purposes of this documentation, a container should be specifically thought of as:

* A filesystem housing executable files and configuration files
* A set of running processes based upon items in the container filesystem

TODO: Produce language around use of containers as opposed to VMs and Network Security Groups. TODO: Seek any Azure language around containers and boundaries

### Control Origination

Hybrid inheritance from IaaS provider and OPS

### Related Content
