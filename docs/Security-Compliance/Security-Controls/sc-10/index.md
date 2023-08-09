# Network Disconnect
## SC-10 - Network Disconnect

Terminate the network connection associated with a communications session at the end of the session or after [30 minutes or less] of inactivity.

## OPS Implementation

TODO: Seek inherited text

### Control Origination

Inherited from IaaS provider

### Related Content

Network disconnect applies to internal and external networks. Terminating network connections associated with specific communications sessions includes de-allocating TCP/IP address or port pairs at the operating system level and de-allocating the networking assignments at the application level if multiple application sessions are using a single operating system-level network connection. Periods of inactivity may be established by organizations and include time periods by type of network access or for specific network accesses.
