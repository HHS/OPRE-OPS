from csv import DictReader
from dataclasses import dataclass, field
from typing import List, Optional

from loguru import logger
from sqlalchemy.orm import Session

from models import OpsEvent, OpsEventStatus, OpsEventType, Role, User


@dataclass
class RoleData:
    NAME: str
    PERMISSIONS: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.NAME:
            raise ValueError("NAME is required.")
        self.NAME = self.NAME.strip()

        if self.PERMISSIONS:
            cleaned = self.PERMISSIONS.strip()
            self.PERMISSIONS = [p.strip() for p in cleaned.split(",") if p.strip()]
        else:
            self.PERMISSIONS = []


def create_role_data(row: dict) -> RoleData:
    return RoleData(**row)


def validate_data(data: RoleData) -> bool:
    return bool(data.NAME)


def validate_all(data: List[RoleData]) -> bool:
    return all(validate_data(d) for d in data)


def upsert_role(data: RoleData, session: Session, sys_user: User) -> None:
    logger.debug(f"Upserting role: {data.NAME}")

    try:
        role = session.query(Role).filter_by(name=data.NAME).first()

        is_new = False

        if not role:
            role = Role(name=data.NAME, created_by=sys_user.id)
            logger.info(f"Creating new role: {data.NAME}")
            is_new = True
        else:
            logger.info(f"Updating existing role: {data.NAME}")
            role.updated_by = sys_user.id

        role.permissions = data.PERMISSIONS

        session.merge(role)
        session.commit()

        event_type = OpsEventType.CREATE_ROLE if is_new else OpsEventType.UPDATE_ROLE

        event = OpsEvent(
            event_type=event_type,
            event_status=OpsEventStatus.SUCCESS,
            created_by=sys_user.id,
            event_details={"role": role.name, "message": "Upserted role"},
        )
        session.add(event)
        session.commit()

    except Exception as e:
        logger.error(f"Error processing role {data.NAME}: {e}")
        session.rollback()
        raise


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    logger.info("Starting role transformation.")

    role_data_list = [create_role_data(row) for row in data]
    logger.info(f"Parsed {len(role_data_list)} role records.")

    if not validate_all(role_data_list):
        raise RuntimeError("Validation failed for some role rows.")

    for role_data in role_data_list:
        upsert_role(role_data, session, sys_user)

    logger.info("Finished processing roles.")
