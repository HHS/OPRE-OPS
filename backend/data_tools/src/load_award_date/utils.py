import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    Agreement,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    User,
    agreement_history_trigger_func,
)
from models.procurement_action import AwardType, ProcurementAction


@dataclass
class AwardDateData:
    """
    Dataclass to represent an award date data row.
    """

    agreement_name: str
    award_date: date
    agreement_id: Optional[int] = field(default=None)
    project_title: Optional[str] = field(default=None)
    agreement_type: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.agreement_name:
            raise ValueError("agreement_name is required.")
        if not self.award_date:
            raise ValueError("award_date is required.")

        self.agreement_name = self.agreement_name.strip()
        self.project_title = self.project_title.strip() if self.project_title else None
        self.agreement_type = self.agreement_type.strip() if self.agreement_type else None
        self.agreement_id = int(self.agreement_id) if self.agreement_id else None
        self.award_date = (
            datetime.strptime(self.award_date, "%Y-%m-%d").date() if isinstance(self.award_date, str) else self.award_date
        )


def create_award_date_data(data: dict) -> AwardDateData:
    """
    Convert a dictionary to an AwardDateData dataclass instance.

    :param data: The dictionary to convert.
    :return: An AwardDateData dataclass instance.
    """
    return AwardDateData(**data)


def validate_data(data: AwardDateData) -> bool:
    """
    Validate the data in an AwardDateData instance.

    :param data: The AwardDateData instance to validate.
    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.agreement_name is not None,
            data.award_date is not None,
        ]
    )


def validate_all(data: List[AwardDateData]) -> bool:
    """
    Validate a list of AwardDateData instances.

    :param data: The list of AwardDateData instances to validate.
    :return: True if all data is valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def update_award_date(data: AwardDateData, sys_user: User, session: Session) -> None:
    """
    Find the NEW_AWARD ProcurementAction for the Agreement and set date_awarded_obligated.

    :param data: The AwardDateData instance with award date info.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    """
    if not data.agreement_id:
        logger.warning(
            f"Skipping row: No agreement_id provided for '{data.agreement_name}' "
            f"(project_title='{data.project_title}')"
        )
        return

    agreement = session.get(Agreement, data.agreement_id)

    if not agreement:
        logger.warning(
            f"Skipping row: Agreement not found with id={data.agreement_id} "
            f"(name='{data.agreement_name}', project_title='{data.project_title}')"
        )
        return

    procurement_action = session.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == agreement.id,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar_one_or_none()

    if not procurement_action:
        logger.warning(
            f"Skipping row: No NEW_AWARD ProcurementAction found for Agreement "
            f"'{data.agreement_name}' (id={agreement.id})"
        )
        return

    try:
        old_date = procurement_action.date_awarded_obligated
        procurement_action.date_awarded_obligated = data.award_date
        procurement_action.updated_by = sys_user.id

        ops_event = OpsEvent(
            event_type=OpsEventType.UPDATE_AGREEMENT,
            event_status=OpsEventStatus.SUCCESS,
            created_by=sys_user.id,
            event_details={
                "agreement_updates": {
                    "owner_id": agreement.id,
                    "updated_by": sys_user.id,
                    "changes": {
                        "date_awarded_obligated": {
                            "old_value": str(old_date) if old_date else None,
                            "new_value": str(data.award_date),
                        },
                    },
                },
            },
        )
        session.add(ops_event)
        session.flush()

        agreement_history_trigger_func(ops_event, session, sys_user, dry_run=True)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
            logger.info(f"Updated award date to {data.award_date} for Agreement '{data.agreement_name}' (id={agreement.id})")
    except Exception as e:
        logger.error(f"Error updating award date for {data}")
        raise e


def update_all_award_dates(data: List[AwardDateData], sys_user: User, session: Session) -> None:
    """
    Update award dates for all AwardDateData instances.

    :param data: The list of AwardDateData instances.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    """
    for d in data:
        update_award_date(d, sys_user, session)


def create_all_award_date_data(data: List[dict]) -> List[AwardDateData]:
    """
    Convert a list of dictionaries to a list of AwardDateData instances.

    :param data: The list of dictionaries to convert.
    :return: A list of AwardDateData instances.
    """
    return [create_award_date_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the CSV file and update award dates in the database.

    :param data: The data from the CSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.
    """
    if not data or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    award_date_data = create_all_award_date_data(list(data))
    logger.info(f"Created {len(award_date_data)} award date data instances.")

    if not validate_all(award_date_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    update_all_award_dates(award_date_data, sys_user, session)
    logger.info("Finished updating award dates.")
