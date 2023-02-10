# Data Pipeline POC

The purpose of this Data Pipeline POC is to experiment with developing a pipeline to securely ingest
data containing proprietary information (and possibly PII) into OPS.

There will be a need in the near future to perform a data migration from the old MAPS system into OPS
and this proposed pipeline could accomplish this.  There has also been an expressed desire by the PO that
OPS could have the capability in the future of ingesting/exporting data via speadsheet -
and proposed pipeline could accomplish this as well.

## Principles, Assumptions, And Constraints

* The pipeline should not introduce additional dependencies unless absolutely necessary and in that case
the dependency should tend towards being more lightweight.

Pandas is an obvious and popular framework for data pipeline work but it is not currently being
used elsewhere in the project.  All of our database operations are currently being done via
SQLAlchemy ORM so this should be used in the data pipeline.

We do not have a Workflow Management Tool or Scheduler available for use as a service in cloud.gov.
Airflow is commonly used for this but the infrastructure may be too complex for a smaller sized project.
Luigi was chosen as it is a very lightweight and popular tool used in the data community as an alternative
to Airflow.

* The pipeline should be highly observable and auditable so that data lineage can be maintained.

Processing should be broken into easily understandable and debuggable steps and not combined all together
into a brittle script.  A history and summary of the events that occurred during processing
using log files and data should be produced.

* The pipeline should provide for data security.

It should support the basic case of periodically polling for files in cloud.gov object storage, processing the
files in stages, and sending a notification of the results in a secure manner.

* The pipeline should easily integrate with BDD and Acceptance Tests to verify the data requirements.

Assumptions in the data should be minimized by writing extensive BDD specifications and unit tests and
reviewed with stakeholders.


### How to run

```
luigi --module data_tools.src.etl_data_from_excel.load_research_projects LoadResearchProjects --local-scheduler --run-date `date -u +%Y-%m-%dT%H%M%S`
```
