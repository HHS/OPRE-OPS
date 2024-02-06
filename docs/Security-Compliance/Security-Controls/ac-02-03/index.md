# Access Control
## AC-02(03) - DISABLE ACCOUNTS

TODO: What does login.gov provide around disabling inactive accounts? Will we need to build something into our application’s authorization model to track inactivity and disable accordingly.

Disable accounts within 60 days when the accounts: 
(a) Have expired;
(b) Are no longer associated with a user or individual;
(c) Are in violation of organizational policy; or
(d) Have been inactive for 60 days.

### OPS Implementation

The System Admin reviews the list of OPS application users on a monthly basis and/or when the status of a user is changed to inactive or terminated. Inactive accounts are disabled automatically from the system after 60 days.

TODO: Not Django.

The Django Admin interface tells us when a user last logged in to the OPS Application, so we can determine the last date of a user's activity by checking the user's profile there.

#### Related Files
