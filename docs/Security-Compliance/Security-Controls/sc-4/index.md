# System and Communications Protection
## SC-04 - Information in Shared Resources

The information system prevents unauthorized and unintended information transfer via shared system resources.

### OPS Implementation

TODO: Review and Update - as this is just an example placeholder

**Data Files**
- Data files are uploaded to OPRE by `<ROLE>` and `OPRE Admin` users.
- OPS prevents `<ROLE>` users from uploading or downloading Data 

Files for any `<SERVICE>` not associated with that user's profile
  - Frontend
      - Does not give the `<ROLE>` user the choice for which `<SERVICE>` to upload or download files, but gives access to those files based on the `<SERVICE>` indicated in the user's profile.  
      - Does not provide a way for the `Data Prepper` user to alter the `<SERVICE>` they are requesting to upload or download Data Files for.
      - Users who do not have either the `Data Prepper` or `OFA Admin` role do not have access to Data File upload or download screens at all, so do not have access to a way to upload or download any files
  - Backend
      - Prevents `<ROLE>` users from uploading or downloading data files not associated with that user's `<SERVICE>` by responding with an `Unauthorized` error if a request comes in for a data file with an `<SERVICE>` that is not indicated in the user's profile. 
      - Prevents users without the `<ROLE>` or `OPRE Admin` roles from uploading or downloading any Data Files by responding with an `Unauthorized` error when a user attempts to upload or download a file.
      
 **User Information**
 
 System user profile information is only accessible via the Django Admin interface. Access to this
 interface is restricted to `System Admin` users. All other users will receive an error if they attempt
 to access it.
