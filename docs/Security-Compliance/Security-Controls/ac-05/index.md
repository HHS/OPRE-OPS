# Access Control
## AC-05 - Separation of Duties

The organization:
a.Identify and document 
[i. Security administration is an independent responsibility and shall not be assigned to a system/application programmer, database administrator, system administrator, system operator, or security auditor. Functions performed by security administrators shall be
entirely separated from the functions performed by system/application programmers, database administrators, system administrators, system operators, and security auditors.
ii. Security administrators’ functions shall be separated security auditors’ functions to reduce the likelihood of fraudulent action (i.e., failing to report on or mitigate security issues).
iii. Security auditors shall have full administrative control over all security audit and log files. These personnel, however, will not have data altering capability for security devices, security management devices, audit and security logs, or ACF infrastructure devices.]; and

b. Define system access authorizations to support separation of duties.

Note: Separation of duties addresses the potential for abuse of authorized privileges and helps to reduce the risk of malevolent activity without collusion. Separation of duties includes, for example: (i) dividing mission functions and information system support functions among different individuals and/or roles; (ii) conducting information system support functions with different individuals (e.g., system management, programming, configuration management, quality assurance and testing, and network security); and (iii) ensuring system administrators do not also perform independent audit functions.

AC-5 Additional FedRAMP Requirements and Guidance:  Guidance: CSPs have the option to provide a separation of duties matrix as an attachment to the SSP.  Directions for attaching the Separation of Duties Matrix document may be found in Section 15.11 ATTACHMENT 11 - Separation of Duties Matrix.

### OPS Implementation

TODO: This is basically documentation of what application roles (System Admin, Final Approver, Editor/Approver, Viewer/Submitter) are expected to be doing what within the application and making what changes with approvals and workflows
**Part a.**
The TANF Data Portal (TDP) system has explicitly defined the roles and responsibilities that accounts perform to operate and maintain the system. This includes data creation and processing, software development, maintenance, and security implementation.

The OPS system has four application roles: System Admin, Final Approver, Editor/Approver, and Viewer/Submitter.
  * System Admin can review and manage user accounts including provisioning new user accounts and role change requests.
  * Final Approver can overseeing all approvals from Editor/Approvers and override, if needed. They can view, submit, edit, and process final approvals.
  * Editor/Approver can view, submit, edit and approve items such as invoices, acquisition pacakges, and spending plans.
  * Viewer/Submitter can view all information by default, submit edits for review and approval.

Developers of the OPS application are responsible for the software development and maintenance of the system.
  * Developers are granted only enough permission in GitHub and Cloud.gov to support their duties.

**Part b.**

TODO: in part b, fill in more detailed version/scenarios with part a as a guide
**System Admin**
The System Admin can access Django Admin and has the ability to manage TDP accounts.  System Admin approves new users, updates profile information, deactivates, and reactivates users (Data Preppers (STTs) do not have access to this).

**Users (OFA Admin and Data Preppers)**
The OFA Admin has the ability to upload data on behalf of Data Preppers and upload data files locally into the web application.

Users from the states, tribes, and territories (STT) who will be uploading data will have the role Data Preppers.  For the OFA MVP, STT will not have access to the TDP system, but OFA Admin will act as Data Prepper roles. Data Preppers are able to upload new TANF reports, replace and resubmit TANF reports, and download their uploaded reports.

**Developers**
Developers are granted only enough permission in GitHub and Cloud.gov in order to support their duties.  All code and documentation committed to HHS has to be approved by the Product Owner and the HHS Tech Lead.


**Part c.**
When new users go to the TDP landing page, they must click on the "Sign in with Login.gov" button.  Once they click on that button, the user is redirected to the Login.gov website.  To gain access to the TDP system, users must first create an account at Login.gov.  By creating an account in Login.gov, the user's profile is created within TDP and they have access to the TDP system without user functionality.  After they are authenticated with Login.gov, the user is redirected to the TDP frontend landing page.  Once a user is logged into the TDP system, they can request user functionality by submitting their information through the request form.  The OFA Admin can view the request through the Django Admin and grants the user the appropriate permissions based on their job responsibilities.


#### Related Files
