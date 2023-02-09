# Access Control
## AC-06 - Least Privilege

The organization employs the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) which are necessary to accomplish assigned tasks in accordance with organizational missions and business functions.

AC-6 (2) Additional FedRAMP Requirements and Guidance: Examples of security functions include but are not limited to: establishing system accounts, configuring access authorizations (i.e., permissions, privileges), setting events to be audited, and setting intrusion detection parameters, system programming, system and security administration, other privileged functions.

### OPS Implementation

In order to access the OPS application, users must login through the chosen and approved authentication provider using Multi-Factor Authentication (MFA).  Only authorized users can access OPS.

AC-6 (2)
Once users are logged in the application, users can only perform tasks associated to their role as described in [AC-5, Part (b)](docs/controls/access_control/ac-05.md).  Privileged functions can only be performed by System Admins.  New user accounts are established with no privileges upon creation and only System Admins can assign a role(s) or permissions to those users.

#### Related Files
[AC-5 | Separation of Duties](docs/controls/access_control/ac-05.md)
