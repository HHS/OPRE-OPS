import os
from csv import DictReader
from dataclasses import dataclass

from data_tools.src.common.utils import get_cig_type_mapping
from models import *


@dataclass
class AgreementData:
    """
    Dataclass to represent a AgreementData data row.
    """

    AGREEMENT_NAME: str
    AGREEMENT_TYPE: str

    def __post_init__(self):
        if not self.AGREEMENT_NAME or not self.AGREEMENT_TYPE:
            raise ValueError("AGREEMENT_NAME and AGREEMENT_TYPE cannot be empty.")

        self.AGREEMENT_NAME = self.AGREEMENT_NAME.strip()
        self.AGREEMENT_TYPE = self.AGREEMENT_TYPE.strip()


def create_models(data: AgreementData, sys_user: User, session: Session) -> None:
    """
    Delete the Agreement models that match the provided data.

    :param data: The AgreementData instance containing agreement details.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    logger.debug(f"Processing agreement for removal: {data}")

    agreement_type = get_cig_type_mapping().get(data.AGREEMENT_TYPE.lower(), None)

    if not agreement_type:
        logger.warning(f"Invalid agreement type: {data.AGREEMENT_TYPE}")
        return

    agreement = session.scalars(
        select(Agreement).where(Agreement.name == data.AGREEMENT_NAME, Agreement.agreement_type == agreement_type)
    ).one_or_none()

    if not agreement:
        logger.warning(f"No agreement found with name '{data.AGREEMENT_NAME}' and type '{data.AGREEMENT_TYPE}'")
        return

    # Store agreement data for event details
    agreement_data = agreement.to_dict()

    # Check if agreement has budget line items
    if agreement.budget_line_items:
        logger.warning(f"Agreement '{agreement.name}' (ID: {agreement.id}) has budget line items. Skipping deletion.")
        return

    if os.getenv("DRY_RUN"):
        logger.info("Dry run enabled. Rolling back transaction.")
        session.rollback()
    else:
        session.delete(agreement)

        # Create an OPS event for the delete operation
        ops_event = OpsEvent(
            event_type=OpsEventType.DELETE_AGREEMENT,
            event_status=OpsEventStatus.SUCCESS,
            created_by=sys_user.id,
            event_details={"deleted_agreement": agreement_data},
        )

        session.add(ops_event)

        session.commit()


def create_all_models(data: List[AgreementData], sys_user: User, session: Session) -> None:
    """
    Process a list of AgreementData instances to remove matching agreements.

    :param data: The list of AgreementData instances to process.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    for d in data:
        create_models(d, sys_user, session)


def validate_data(data: AgreementData) -> bool:
    """
    Validate the data in an AgreementData instance.

    :param data: The AgreementData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.AGREEMENT_NAME is not None and len(data.AGREEMENT_NAME.strip()) > 0,
            data.AGREEMENT_TYPE is not None and len(data.AGREEMENT_TYPE.strip()) > 0,
        ]
    )


def validate_all(data: List[AgreementData]) -> bool:
    """
    Validate a list of AgreementData instances.

    :param data: The list of AgreementData instances to validate.

    :return: True if all data is valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_agreement_data(data: dict) -> AgreementData:
    """
    Convert a dictionary to an AgreementData dataclass instance.

    :param data: The dictionary to convert.

    :return: An AgreementData dataclass instance.
    """
    return AgreementData(**data)


def create_all_agreement_data(data: List[dict]) -> List[AgreementData]:
    """
    Convert a list of dictionaries to a list of AgreementData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of AgreementData instances.
    """
    return [create_agreement_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the TSV file and process agreements for removal.

    :param data: The data from the TSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.
    :return: None
    """
    if not data or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    agreement_data = create_all_agreement_data(list(data))
    logger.info(f"Created {len(agreement_data)} AgreementData instances.")

    if not validate_all(agreement_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(agreement_data, sys_user, session)
    logger.info("Finished processing agreements for removal.")
