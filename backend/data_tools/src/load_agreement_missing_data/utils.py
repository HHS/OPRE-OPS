import os
from csv import DictReader
from dataclasses import dataclass, field
from typing import List, Optional

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models import (
    Agreement,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    User,
    Vendor,
    agreement_history_trigger_func,
)


@dataclass
class AgreementUpdateData:
    """
    Dataclass to represent a row from the missing agreement data TSV.
    """

    agreement_id: int
    agreement_description: Optional[str] = field(default=None)
    agreement_vendor: Optional[str] = field(default=None)
    agreement_project_officer: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.agreement_id:
            raise ValueError("agreement_id is required.")

        self.agreement_id = int(self.agreement_id)
        self.agreement_description = self.agreement_description.strip() if self.agreement_description else None
        self.agreement_vendor = self.agreement_vendor.strip() if self.agreement_vendor else None
        self.agreement_project_officer = (
            self.agreement_project_officer.strip() if self.agreement_project_officer else None
        )

        if not self.agreement_vendor:
            self.agreement_vendor = None
        if not self.agreement_project_officer:
            self.agreement_project_officer = None


def create_agreement_update_data(data: dict) -> AgreementUpdateData:
    """
    Convert a dictionary (TSV row) to an AgreementUpdateData instance.

    :param data: The dictionary to convert.
    :return: An AgreementUpdateData instance.
    """
    return AgreementUpdateData(
        agreement_id=data.get("agreement_id", ""),
        agreement_description=data.get("agreement_description"),
        agreement_vendor=data.get("agreement_vendor"),
        agreement_project_officer=data.get("agreement_project_officer"),
    )


def validate_data(data: AgreementUpdateData) -> bool:
    """
    Validate an AgreementUpdateData instance.

    :param data: The AgreementUpdateData instance to validate.
    :return: True if valid, False otherwise.
    """
    return data.agreement_id is not None


def validate_all(data: List[AgreementUpdateData]) -> bool:
    """
    Validate a list of AgreementUpdateData instances.

    :param data: The list of AgreementUpdateData instances to validate.
    :return: True if all are valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def get_or_create_vendor(vendor_name: str, sys_user: User, session: Session) -> Optional[Vendor]:
    """
    Look up a vendor by name (case-insensitive). Create a new one if not found.

    :param vendor_name: The vendor name to look up.
    :param sys_user: The system user for audit fields.
    :param session: The database session.
    :return: The Vendor instance, or None if vendor_name is empty.
    """
    vendor = session.execute(select(Vendor).where(func.upper(Vendor.name) == vendor_name.upper())).scalar_one_or_none()

    if vendor:
        return vendor

    logger.info(f"Vendor '{vendor_name}' not found — creating new vendor record.")
    vendor = Vendor(
        name=vendor_name,
        active=True,
        created_by=sys_user.id,
        updated_by=sys_user.id,
    )
    session.add(vendor)
    session.flush()
    return vendor


def get_user_by_name(name: str, session: Session) -> Optional[User]:
    """
    Look up a user by full name (case-insensitive first + last).

    :param name: Full name string (e.g. "Jane Doe").
    :param session: The database session.
    :return: The User instance, or None if not found.
    """
    results = (
        session.execute(
            select(User).where(func.upper(func.concat(User.first_name, " ", User.last_name)) == name.upper())
        )
        .scalars()
        .all()
    )

    if len(results) > 1:
        logger.error(
            f"Multiple users found with name '{name}' — skipping project officer update. "
            "Resolve the ambiguity manually."
        )
        return None
    if not results:
        logger.warning(f"User '{name}' not found — skipping project officer update.")
        return None

    return results[0]


def update_agreement(data: AgreementUpdateData, sys_user: User, session: Session) -> None:
    """
    Update description, vendor, and project_officer on an Agreement where values differ.

    :param data: The AgreementUpdateData instance.
    :param sys_user: The system user for audit fields.
    :param session: The database session.
    """
    agreement = session.get(Agreement, data.agreement_id)
    if not agreement:
        logger.warning(f"Skipping row: Agreement not found with id={data.agreement_id}.")
        return

    changes = {}

    if data.agreement_description is not None and agreement.description != data.agreement_description:
        changes["description"] = {
            "old_value": agreement.description,
            "new_value": data.agreement_description,
        }
        agreement.description = data.agreement_description

    if data.agreement_vendor:
        vendor = get_or_create_vendor(data.agreement_vendor, sys_user, session)
        if vendor:
            current_vendor_id = getattr(agreement, "vendor_id", None)
            if current_vendor_id != vendor.id:
                changes["vendor_id"] = {
                    "old_value": current_vendor_id,
                    "new_value": vendor.id,
                }
                agreement.vendor_id = vendor.id

    if data.agreement_project_officer:
        user = get_user_by_name(data.agreement_project_officer, session)
        if user and agreement.project_officer_id != user.id:
            changes["project_officer_id"] = {
                "old_value": agreement.project_officer_id,
                "new_value": user.id,
            }
            agreement.project_officer_id = user.id

    if not changes:
        logger.info(f"No changes needed for Agreement id={data.agreement_id} ('{agreement.name}').")
        return

    agreement.updated_by = sys_user.id

    try:
        ops_event = OpsEvent(
            event_type=OpsEventType.UPDATE_AGREEMENT,
            event_status=OpsEventStatus.SUCCESS,
            created_by=sys_user.id,
            event_details={
                "agreement_updates": {
                    "owner_id": agreement.id,
                    "updated_by": sys_user.id,
                    "changes": changes,
                },
            },
        )
        session.add(ops_event)
        session.flush()

        agreement_history_trigger_func(ops_event, session, sys_user, dry_run=True)

        if os.getenv("DRY_RUN"):
            logger.info(f"Dry run enabled. Rolling back changes for Agreement id={data.agreement_id}.")
            session.rollback()
        else:
            session.commit()
            logger.info(
                f"Updated Agreement id={data.agreement_id} ('{agreement.name}'): "
                + ", ".join(f"{k}: {v['old_value']!r} → {v['new_value']!r}" for k, v in changes.items())
            )
    except Exception:
        logger.exception(f"Error updating Agreement id={data.agreement_id}.")
        session.rollback()
        raise


def update_all_agreements(data: List[AgreementUpdateData], sys_user: User, session: Session) -> None:
    """
    Update all agreements from the data list.

    :param data: The list of AgreementUpdateData instances.
    :param sys_user: The system user for audit fields.
    :param session: The database session.
    """
    for d in data:
        update_agreement(d, sys_user, session)


def create_all_agreement_update_data(data: List[dict]) -> List[AgreementUpdateData]:
    """
    Convert a list of dictionaries to a list of AgreementUpdateData instances.

    :param data: The list of dictionaries to convert.
    :return: A list of AgreementUpdateData instances.
    """
    return [create_agreement_update_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the TSV file and update agreements in the database.

    :param data: The data from the CSV/TSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.
    """
    if not data or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    agreement_data = create_all_agreement_update_data(list(data))
    logger.info(f"Created {len(agreement_data)} agreement update data instances.")

    if not validate_all(agreement_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    update_all_agreements(agreement_data, sys_user, session)
    logger.info("Finished updating agreements.")
