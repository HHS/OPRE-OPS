# 26. Container Apps Jobs for Disabling Inactive Users

Date: 09\30\2024

## Status
Accepted

## Context
We want to set up a process to automatically disable user accounts after 60 days of inactivity.
This pertains to the security compliance Access Control AC-02(03) Disable Accounts.

## Context and explanation of the tech concepts
Each row in the **ops_user** table represents a user account with a status of `ACTIVE, INACTIVE, or LOCKED`.
An `INACTIVE` status indicates a disabled account.

To check for inactivity, we'll use the _last_active_at_ timestamp from the **user_session** table, which is updated whenever a user logs into OPS.
If the timestamp shows that a user hasn't logged in or started a session in 60 days or more, their account will be flagged for disabling.

OPS runs in a Container App that includes a Data Import process executed through a Container Apps Job.
The image deployed to this Container App is built from the Dockerfile.data-tools-import defined in the OPRE-OPS repository.

## Options Considered
- Container Apps Jobs
- [Celery](https://flask.palletsprojects.com/en/3.0.x/patterns/celery/)

### Tradeoffs
#### Container Apps Jobs
- Pros
     - We already have a process in place to run containerized tasks within the OPS environment.
     - The process can be scheduled to run at specific times.
     - The process can be monitored and logged.
     - OPS engineers can be notified if the process fails.
- Cons
     - Container Apps Jobs has limited [metrics](https://learn.microsoft.com/en-us/azure/container-apps/metrics).
     - Creating notifications for Container Apps Jobs is a new feature to OPS.
#### Celery
- Pros
     - Celery is a distributed task queue that can run tasks in the background.
     - It can be used to schedule tasks to run at specific times.
     - It supports various message brokers.
     - Fits well with the python and flask tech stack.
- Cons
    - Getting Celery set up was challenging.
    - Configuring the message broker required multiple attempts to establish communication.
    - Ensuring the tasks executed properly added to the difficulty.

## Decision
* We will use Container Apps Jobs to disable inactive user accounts.
* The process will be scheduled hourly and ignore FakeAuth users.
* Database changes executed by this process will be implemented with a SQLAlchemy script.
* Automatic processes will use the System Admin as the user.
* OPS engineers will be notified if the process fails.


* The following ensures changes in user account status made by this process are recorded and logged in the same way as if a System Admin had manually disabled the user account:
  * A `UPDATE_USER` event record is added to the ops_events table.
  * All user sessions are deactivate by setting the _active_ column to `False`.
  * The **ops_db_history** table is updated with the changes made to the user account.

## Consequences
| **Category**    | **Details**                                                     | **Impact**                                     |
|-----------------|-----------------------------------------------------------------|------------------------------------------------|
| **Benefits**    | Easier to implement                                             | Increases efficiency                           |
| **Benefits**    | Applies access controls consistently with minimal manual work   | Reduces mistakes and adds security             |
| **Benefits**    | Hourly scheduling helps manage user accounts on time            | Reduces potential security risk                |
| **Benefits**    | Notification aspect allows quick responses to process failures  | Improves reliability and response time         |
| **Benefits**    | Uses existing resources                                         | Saves time and money, no upskilling/retraining |
| **Limitations** | Limited metrics might lower effectiveness                       | May make decision-making harder                |
| **Limitations** | Possible issues with setting up new monitoring alerts           | Could result in missing important events       |
| **Limitations** | Dependence on changing infrastructure might create challenges   | Risks stability of operations                  |
