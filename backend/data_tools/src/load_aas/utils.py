# flake8: noqa F401, F403, F405
import os
from csv import DictReader
from dataclasses import dataclass, field

from data_tools.src.common.utils import convert_budget_line_item_type, get_cig_type_mapping
from models import *
from models.utils import generate_agreement_events_update


@dataclass
class AAData:
    """
    Dataclass to represent an AA data row.
    """

    PROJECT_NAME: str
    AA_NAME: str
    REQUESTING_AGENCY_NAME: str
    SERVICING_AGENCY_NAME: str
    SERVICE_REQUIREMENT_TYPE: str
    REQUESTING_AGENCY_ABBREVIATION: Optional[str] = field(default=None)
    SERVICING_AGENCY_ABBREVIATION: Optional[str] = field(default=None)
    ORIGINAL_CIG_NAME: Optional[str] = field(default=None)
    ORIGINAL_CIG_TYPE: Optional[str] = field(default=None)

    def __post_init__(self):
        if (
            not self.PROJECT_NAME
            or not self.AA_NAME
            or not self.REQUESTING_AGENCY_NAME
            or not self.SERVICING_AGENCY_NAME
            or not self.SERVICE_REQUIREMENT_TYPE
        ):
            raise ValueError("All fields must be provided.")

        self.PROJECT_NAME = self.PROJECT_NAME.strip()
        self.AA_NAME = self.AA_NAME.strip()
        self.REQUESTING_AGENCY_NAME = self.REQUESTING_AGENCY_NAME.strip()
        self.SERVICING_AGENCY_NAME = self.SERVICING_AGENCY_NAME.strip()
        self.SERVICE_REQUIREMENT_TYPE = self.SERVICE_REQUIREMENT_TYPE.strip()
        self.REQUESTING_AGENCY_ABBREVIATION = (
            self.REQUESTING_AGENCY_ABBREVIATION.strip() if self.REQUESTING_AGENCY_ABBREVIATION else None
        )
        self.SERVICING_AGENCY_ABBREVIATION = (
            self.SERVICING_AGENCY_ABBREVIATION.strip() if self.SERVICING_AGENCY_ABBREVIATION else None
        )
        self.ORIGINAL_CIG_NAME = self.ORIGINAL_CIG_NAME.strip() if self.ORIGINAL_CIG_NAME else None
        self.ORIGINAL_CIG_TYPE = self.ORIGINAL_CIG_TYPE.strip() if self.ORIGINAL_CIG_TYPE else None


def create_aa_data(data: dict) -> AAData:
    """
    Convert a dictionary to an AAData dataclass instance.

    :param data: The dictionary to convert.

    :return: An AAData dataclass instance.
    """
    return AAData(**data)


def validate_data(data: AAData) -> bool:
    """
    Validate the data in an AAData instance.

    :param data: The AAData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.PROJECT_NAME is not None,
            data.AA_NAME is not None,
            data.REQUESTING_AGENCY_NAME is not None,
            data.SERVICING_AGENCY_NAME is not None,
            data.SERVICE_REQUIREMENT_TYPE is not None,
        ]
    )


def validate_all(data: List[AAData]) -> bool:
    """
    Validate a list of AAData instances.

    :param data: The list of AAData instances to validate.

    :return: True if all data is valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: AAData, sys_user: User, session: Session) -> None:
    """
    Create and persist the AA models.

    :param data: The AAData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    logger.debug(f"Creating models for {data}")

    # Find project by name
    project = session.execute(select(Project).where(Project.title == data.PROJECT_NAME)).scalar_one_or_none()

    if not project:
        raise ValueError(f"Project with name {data.PROJECT_NAME} not found.")

    # Find or create agencies - check only by name
    requesting_agency = session.execute(
        select(AgreementAgency).where(AgreementAgency.name == data.REQUESTING_AGENCY_NAME)
    ).scalar_one_or_none()

    if not requesting_agency:
        logger.info(f"Creating new requesting agency: {data.REQUESTING_AGENCY_NAME}")
        requesting_agency = AgreementAgency(
            name=data.REQUESTING_AGENCY_NAME,
            abbreviation=data.REQUESTING_AGENCY_ABBREVIATION,
            requesting=True,
            servicing=False,
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )
        session.add(requesting_agency)
    else:
        # Update the existing agency to ensure it has requesting role
        if not requesting_agency.requesting:
            requesting_agency.requesting = True
            requesting_agency.updated_by = sys_user.id
            requesting_agency.updated_on = datetime.now()

    servicing_agency = session.execute(
        select(AgreementAgency).where(AgreementAgency.name == data.SERVICING_AGENCY_NAME)
    ).scalar_one_or_none()

    if not servicing_agency:
        logger.info(f"Creating new servicing agency: {data.SERVICING_AGENCY_NAME}")
        servicing_agency = AgreementAgency(
            name=data.SERVICING_AGENCY_NAME,
            abbreviation=data.SERVICING_AGENCY_ABBREVIATION,
            requesting=False,
            servicing=True,
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )
        session.add(servicing_agency)
    else:
        # Update the existing agency to ensure it has servicing role
        if not servicing_agency.servicing:
            servicing_agency.servicing = True
            servicing_agency.updated_by = sys_user.id
            servicing_agency.updated_on = datetime.now()

    session.commit()  # Commit to ensure agencies are created/updated before creating the agreement

    # If there is an existing agreement, we will delete it and move its budget lines to the new one
    # This is to ensure we don't have duplicate agreements with the same name
    existing_agreement = None
    if data.ORIGINAL_CIG_NAME and data.ORIGINAL_CIG_TYPE:
        agreement_type = get_cig_type_mapping().get(data.ORIGINAL_CIG_TYPE.lower(), None)
        existing_agreement = session.execute(
            select(Agreement).where(
                Agreement.name == data.ORIGINAL_CIG_NAME, Agreement.agreement_type == agreement_type
            )
        ).scalar_one_or_none()

    try:
        aa = AaAgreement(
            name=data.AA_NAME,
            project=project,
            requesting_agency=requesting_agency,
            servicing_agency=servicing_agency,
            service_requirement_type=ServiceRequirementType[data.SERVICE_REQUIREMENT_TYPE],
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )

        # Check if agreement already exists
        existing_aa = session.execute(select(AaAgreement).where(AaAgreement.name == data.AA_NAME)).scalar_one_or_none()

        if existing_aa:
            logger.info(f"Found existing AA with ID {existing_aa.id} for {data.AA_NAME}")
            aa.id = existing_aa.id
            aa.created_on = existing_aa.created_on
            aa.created_by = existing_aa.created_by

            updates = generate_agreement_events_update(
                existing_aa.to_dict(),
                aa.to_dict(),
                existing_aa.id,
                sys_user.id,
            )
            ops_event = OpsEvent(
                event_type=OpsEventType.UPDATE_AGREEMENT,
                event_status=OpsEventStatus.SUCCESS,
                created_by=sys_user.id,
                event_details={
                    "agreement_updates": updates,
                },
            )
            session.add(ops_event)
        else:
            session.add(aa)
            session.flush()
            # Entirely new AA created
            ops_event = OpsEvent(
                event_type=OpsEventType.CREATE_NEW_AGREEMENT,
                event_status=OpsEventStatus.SUCCESS,
                created_by=sys_user.id,
                event_details={
                    "New Agreement": aa.to_dict(),
                },
            )
            session.add(ops_event)

        logger.debug(f"Created AA model: {aa.to_dict()}")

        session.merge(aa)
        session.flush()
        # Set Dry Run true so that we don't commit at the end of the function
        # This allows us to rollback the session if dry_run is enabled or not commit changes
        # if something errors after this point
        agreement_history_trigger_func(ops_event, session, sys_user, dry_run=True)
        session.commit()

        # Refresh aa to ensure we have the ID (important!)
        aa = session.execute(select(AaAgreement).where(AaAgreement.name == data.AA_NAME)).scalar_one()

        # remove the existing agreement if it exists and re-assign its budget lines to the new agreement
        if existing_agreement:
            # Reassign budget lines to the new agreement
            logger.info(
                f"Reassigning budget lines from existing agreement {existing_agreement.name} to new AA {aa.name}"
            )

            for budget_line in existing_agreement.budget_line_items:
                # Check if budget line still exists
                current_budget_line = session.get(type(budget_line), budget_line.id)
                if current_budget_line:
                    new_budget_line_item, old_budget_line_item = convert_budget_line_item_type(
                        getattr(current_budget_line, "id"), AgreementType.AA, session
                    )
                    new_budget_line_item.agreement_id = aa.id
                    session.delete(old_budget_line_item)
                    session.commit()

                    session.add(new_budget_line_item)

            logger.info(f"Removing existing agreement {existing_agreement.name} with ID {existing_agreement.id}")
            session.delete(existing_agreement)
            session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[AAData], sys_user: User, session: Session) -> None:
    """
    Convert a list of AAData instances to a list of BaseModel instances.

    :param data: The list of AAData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_aa_data(data: List[dict]) -> List[AAData]:
    """
    Convert a list of dictionaries to a list of AAData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of AAData instances.
    """
    return [create_aa_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the CSV file and persist the models to the database.

    :param data: The data from the CSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.

    :return: None
    """
    if not data or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    aa_data = create_all_aa_data(list(data))
    logger.info(f"Created {len(aa_data)} AA data instances.")

    if not validate_all(aa_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(aa_data, sys_user, session)
    logger.info("Finished loading models.")
