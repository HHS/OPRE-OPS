import luigi
from models import *
from sqlalchemy.future import create_engine
from sqlalchemy.orm import Session

engine = create_engine(
    "postgresql://postgres:local_password@localhost:5432/postgres"  # pragma: allowlist secret
)


class OPSTask(luigi.Task):
    def __init__(self, run_date):
        self._engine = engine
        super().__init__(run_date)


@OPSTask.event_handler(luigi.Event.SUCCESS)
def success(task):
    with Session(engine) as session, session.begin():
        session.add(
            ETLTaskStatus(
                workflow_name="etl_data_from_excel",
                task_name=task.task_module,
                run_at=task.run_date,
                task_meta=task.task_meta,
                status="SUCCESS",
            )
        )


@OPSTask.event_handler(luigi.Event.FAILURE)
def fail(task):
    with Session(engine) as session, session.begin():
        session.add(
            ETLTaskStatus(
                workflow_name="etl_data_from_excel",
                task_name=task.task_module,
                run_at=task.run_date,
                task_meta=task.task_meta,
                status="FAIL",
            )
        )
