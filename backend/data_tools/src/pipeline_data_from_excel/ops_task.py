import logging

import luigi
from sqlalchemy.future import create_engine


class OPSTask(luigi.Task):
    def __init__(self, run_date):
        self.engine = create_engine(
            "postgresql://postgres:local_password@localhost:5432/postgres"  # pragma: allowlist secret
        )
        self.logger = logging.getLogger("luigi-interface")
        self.task_meta = {"log_messages": []}
        super().__init__(run_date)

    def _log_message(self, message):
        self.logger.info(message)
        self.task_meta["log_messages"].append(message)
