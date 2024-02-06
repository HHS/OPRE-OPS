# System and Communications Protection
## SC-04 - Information in Shared Resources

Prevent unauthorized and unintended information transfer via shared system resources.

### OPS Implementation

TODO: Once the roles are identified and named, reiew and Update - as this is just an example placeholder

**Data Files**
- Data files are uploaded to OPS by `<ROLE>` and `OPS Admin` users.
- OPS prevents `<ROLE>` users from uploading or downloading Data

Files for any `<SERVICE>` not associated with that user's profile
  - Frontend
      - Does not give the `<ROLE>` user the choice for which `<SERVICE>` to upload or download files, but gives access to those files based on the `<SERVICE>` indicated in the user's profile.
      - Does not provide a way for the `Data Prepper` user to alter the `<SERVICE>` they are requesting to upload or download Data Files for.
      - Users who do not have either the `Data Prepper` or `OPS Admin` role do not have access to Data File upload or download screens at all, so do not have access to a way to upload or download any files
  - Backend
      - Prevents `<ROLE>` users from uploading or downloading data files not associated with that user's `<SERVICE>` by responding with an `Unauthorized` error if a request comes in for a data file with an `<SERVICE>` that is not indicated in the user's profile.
      - Prevents users without the `<ROLE>` or `OPS Admin` roles from uploading or downloading any Data Files by responding with an `Unauthorized` error when a user attempts to upload or download a file.

 ### Control Origination

 ### Related Content

Preventing unauthorized and unintended information transfer via shared system resources stops information produced by the actions of prior users or roles (or the actions of processes acting on behalf of prior users or roles) from being available to current users or roles (or current processes acting on behalf of current users or roles) that obtain access to shared system resources after those resources have been released back to the system. Information in shared system resources also applies to encrypted representations of information. In other contexts, control of information in shared system resources is referred to as object reuse and residual information protection. Information in shared system resources does not address information remanence, which refers to the residual representation of data that has been nominally deleted; covert channels (including storage and timing channels), where shared system resources are manipulated to violate information flow restrictions; or components within systems for which there are only single users or roles.
