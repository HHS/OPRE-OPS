# 26. Container Apps Jobs for Disabling Inactive Users

Date: 09\30\2024

## Status
Accepted

## Context

We want to set up a process to automatically disable user accounts after 60 days of inactivity.
This pertains to the security compliance Access Control AC-02(03) Disable Accounts.

## Context and explanation of the tech concepts

Each row in the ops_user table represents a user account with a status of ACTIVE, INACTIVE, or LOCKED.
An INACTIVE status indicates a disabled account.

To check for inactivity, we'll use the last_active_at timestamp from the user_session table, which is updated whenever a user logs into OPS.
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
* OPS engineers will be notified if the process fails.

* The following ensures changes in user account status made by this process are recorded and logged in the same way as if a System Admin had manually disabled the user account:
  * A UPDATE_USER event record is added to the ops_events table.
  * All user sessions are deactivate by setting the active column to False.
  * The ops_db_history table is updated with the changes made to the user account.

## Consequences
The decision to utilize Container Apps Jobs for managing inactive user accounts presents several positive consequences, such as streamlining the process and improving monitoring capabilities.
This integration will ensure consistent application of access controls with minimal manual intervention, while hourly scheduling will facilitate timely management of user accounts, reducing security risks.
Additionally, implementing a notification system will allow OPS engineers to promptly respond to any process failures, helping to ensure system integrity.
Leveraging the existing infrastructure minimizes the need for retraining and maximizes the use of current resources.

Overall, while using Container Apps Jobs meets immediate operational needs, it’s important to consider its limitations and risks for long-term success.
Issues like limited metrics, potential issues in deploying new monitoring alerts, and reliance on changing infrastructure could pose challenges.
