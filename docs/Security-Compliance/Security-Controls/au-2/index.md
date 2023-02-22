# Audit and Accountability
## AU-02 - Audit Events

a. Identify the types of events that the system is capable of logging in support of the audit function: [Assignment: organization-defined event types that the system is capable of logging];
 [i. The following events must be identified within server audit logs:
* Server startup and shutdown;
* Loading and unloading of services;
* Installation and removal of software;
* System alerts and error messages;
* User logon and logoff (successful or unsuccessful);
* System administration activities;
* Accesses to sensitive information, files, and systems
* Account creation, modification, or deletion;
* Modifications of privileges and access controls; and,
* Additional security-related events, as required by the System Owner (SO) or to support the nature of the supported business and applications.

ii. The following events must be identified within application and database audit logs:
* Modifications to the application;
* Application alerts and error messages;
* User logon and logoff (successful or unsuccessful);
* System administration activities;
* Accesses to information and files
* Account creation, modification, or deletion; and,
* Modifications of privileges and access controls.
* (Moderate and High only) Read access to sensitive information
* (Moderate and High only) Modification to sensitive information
* (Moderate and High only) Printing sensitive information

iii. The following events must be identified within network device (e.g., router, firewall, switch, wireless access point) audit logs:
* Device startup and shutdown;
* Administrator logon and logoff (successful or unsuccessful);
* Configuration changes;
* Account creation, modification, or deletion;
* Modifications of privileges and access controls; and,
* System alerts and error messages.];

b. Coordinate the event logging function with other organizational entities requiring audit-related information to guide and inform the selection criteria for events to be logged;
c. Specify the following event types for logging within the system: [Unsuccessful log-on attempts that result in a locked account/node;  Configuration changes;  Application alerts and error messages; System administration activities; Modification of privileges and access; and Account creation, modification, or deletion];
d. Provide a rationale for why the event types selected for logging are deemed to be adequate to support after-the-fact investigations of incidents; and
e. Review and update the event types selected for logging within every 365 days and whenever there is a significant system modification.

## OPS Implementation

OPS inherits audit tools and capabilities from Cloud.gov and login.gov to audit the logs of Developer and OPS user account actions, respectively.

TODO: Get SSP from cloud.gov and login.gov and verify what we can inherit

a.i The following events must be identified within server audit logs:
- a.i.1 | *inherited from Cloud.gov*
- a.i.2 | *inherited from Cloud.gov*
- a.i.3 | *inherited from Cloud.gov*
- a.i.4 | *inherited from Cloud.gov*
- a.i.5 | *inherited from Login.gov*
- a.i.6 | *inherited from Cloud.gov*
- a.i.7 | Access logged in Cloud.gov | OPRE User activity is auditable via logs TODO: refine
- a.i.8 | Account creation through Login.gov. Modification, role assignment(s), and deletion logged in OPS
- a.i.9 | Logged in OPS
- a.i.10 | Uploading and downloading of data files is logged to Cloud.gov system logs

a.ii The following events must be identified within application and database audit logs:
- a.ii.1 | Modifications to the application are tracked in the open source repository hosted within the HHS organization on GitHub.com
- a.ii.2 | Frontend alerts and errors send a logging message to the backend to log to the server. Backend errors are logged to the server. TODO: make sure we are doing the former or update language
- a.ii.3 | inherited from Login.gov in terms of login and explicit log off?  Session expiry/timeout and teardown would also be stored in OPS logs ? TODO:
- a.ii.4 | Logged in OPS, TODO: Any cloud.gov inheritance?
- a.ii.5 | TODO: what exactly are we going to log?
- a.ii.6 | Account creation is inherited from Login.gov. Modification, role assignment(s), and deletion logged in OPS
- a.ii.7 | Logged and auditable withinin OPS
- a.ii.8 | Logged and auditable within OPS
- a.ii.9 | Logged and auditable within OPS
- a.ii.10 | TODO: Printing... ?

a.iii The following events must be identified within network device (e.g., router, firewall, switch, wireless access point) audit logs:

- All are inherited from Cloud.gov

b. Inherited from Cloud.gov

c. Inherited from Cloud.gov

d.
- Log in lockouts are inherited from Login.gov
- Configuration changes are inherited from Cloud.gov
- Application alerts and error messages are logged within OPS.
- System Administration activities are logged within OPS
- Modifications of privileges and access are logged within OPS
- Account creation is inherited from Login.gov
- Account modification, role assignment(s), and deletion is logged within OPS

e. Review and update is the responsibility of the ACF OCIO

### Related Files

TODO: so many screenshots
