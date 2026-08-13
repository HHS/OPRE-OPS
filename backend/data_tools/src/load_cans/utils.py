import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    CAN,
    CANFundingDetails,
    CANFundingSource,
    CANMethodOfTransfer,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    Portfolio,
    User,
    can_history_trigger_func,
)


@dataclass
class CANData:
    """
    Dataclass to represent a CAN data row.
    """

    FISCAL_YEAR: int
    CAN_NBR: str
    FUND: str
    PORTFOLIO: str
    SYS_CAN_ID: Optional[int] = field(default=None)
    CAN_DESCRIPTION: Optional[str] = field(default=None)
    ALLOWANCE: Optional[str] = field(default=None)
    ALLOTMENT_ORG: Optional[str] = field(default=None)
    SUB_ALLOWANCE: Optional[str] = field(default=None)
    CURRENT_FY_FUNDING_YTD: Optional[float] = field(default=None)
    APPROP_PREFIX: Optional[str] = field(default=None)
    APPROP_POSTFIX: Optional[str] = field(default=None)
    APPROP_YEAR: Optional[str] = field(default=None)
    FUNDING_SOURCE: Optional[str] = field(default=None)
    METHOD_OF_TRANSFER: Optional[str] = field(default=None)
    NICK_NAME: Optional[str] = field(default=None)
    FUNDING_PARTNER: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.FISCAL_YEAR or not self.CAN_NBR:
            raise ValueError("FISCAL_YEAR and CAN_NBR are required.")

        self.FISCAL_YEAR = int(self.FISCAL_YEAR)
        if isinstance(self.SYS_CAN_ID, str):
            self.SYS_CAN_ID = int(self.SYS_CAN_ID) if self.SYS_CAN_ID.isdigit() else None
        self.CAN_NBR = str(self.CAN_NBR)
        self.CAN_DESCRIPTION = str(self.CAN_DESCRIPTION) if self.CAN_DESCRIPTION else None
        self.FUND = str(self.FUND) if self.FUND else None
        self.ALLOWANCE = str(self.ALLOWANCE) if self.ALLOWANCE else None
        self.ALLOTMENT_ORG = str(self.ALLOTMENT_ORG) if self.ALLOTMENT_ORG else None
        self.SUB_ALLOWANCE = str(self.SUB_ALLOWANCE) if self.SUB_ALLOWANCE else None
        self.CURRENT_FY_FUNDING_YTD = float(self.CURRENT_FY_FUNDING_YTD) if self.CURRENT_FY_FUNDING_YTD else None
        self.APPROP_PREFIX = str(self.APPROP_PREFIX) if self.APPROP_PREFIX else None
        self.APPROP_POSTFIX = str(self.APPROP_POSTFIX) if self.APPROP_POSTFIX else None
        self.APPROP_YEAR = str(self.APPROP_YEAR) if self.APPROP_YEAR else None
        self.PORTFOLIO = str(self.PORTFOLIO).upper() if self.PORTFOLIO else None
        self.FUNDING_SOURCE = str(self.FUNDING_SOURCE) if self.FUNDING_SOURCE else None
        self.METHOD_OF_TRANSFER = str(self.METHOD_OF_TRANSFER).upper() if self.METHOD_OF_TRANSFER else None
        self.NICK_NAME = str(self.NICK_NAME) if self.NICK_NAME else None
        self.FUNDING_PARTNER = str(self.FUNDING_PARTNER) if self.FUNDING_PARTNER else None


def create_can_data(data: dict) -> CANData:
    """
    Convert a dictionary to a CanData dataclass instance.

    :param data: The dictionary to convert.

    :return: A CanData dataclass instance.
    """
    return CANData(**data)


def validate_data(data: CANData) -> bool:
    """
    Validate the data in a CanData instance.

    A blank SYS_CAN_ID means this row can only create a brand-new CAN (no update fallback is
    possible without a DB lookup), so PORTFOLIO must be present up front — mirroring the hard
    requirement enforced later in _resolve_portfolio for new CANs — so a batch with a bad new-CAN
    row fails atomically here rather than after some rows have already been committed.

    :param data: The CanData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    checks = [
        data.FISCAL_YEAR is not None,
        data.CAN_NBR is not None,
    ]
    if data.SYS_CAN_ID is None:
        checks.append(data.PORTFOLIO is not None)
    return all(checks)


def validate_all(data: List[CANData]) -> bool:
    """
    Validate a list of CanData instances.

    :param data: The list of CanData instances to validate.

    :return: A list of valid CanData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def _find_existing_can(data: CANData, session: Session) -> Optional[CAN]:
    """
    Look up an existing CAN by SYS_CAN_ID, falling back to a lookup by CAN_NBR.

    :param data: The CANData instance to use.
    :param session: The database session to use.

    :return: The existing CAN, or None if not found.
    """
    can = session.get(CAN, data.SYS_CAN_ID) if data.SYS_CAN_ID else None
    if not can:
        can = session.execute(select(CAN).where(CAN.number == data.CAN_NBR)).scalar_one_or_none()
        if can:
            logger.info(f"*** found existing CAN by number {can.number} instead of ID")
    return can


def _resolve_portfolio(data: CANData, is_new: bool, session: Session) -> Optional[Portfolio]:
    """
    Resolve PORTFOLIO to a Portfolio. Required when creating a new CAN; a blank PORTFOLIO on an
    update returns None so the caller can leave the CAN's existing portfolio alone.

    :param data: The CANData instance to use.
    :param is_new: Whether this row is creating a brand-new CAN.
    :param session: The database session to use.

    :return: The resolved Portfolio, or None if PORTFOLIO was blank on an update.
    :raises ValueError: If PORTFOLIO is blank on a new CAN, or doesn't match a known Portfolio.
    """
    if not data.PORTFOLIO:
        if is_new:
            raise ValueError("PORTFOLIO is required when creating a new CAN.")
        return None
    portfolio = session.execute(select(Portfolio).where(Portfolio.abbreviation == data.PORTFOLIO)).scalar_one_or_none()
    if not portfolio:
        raise ValueError(f"Portfolio not found for {data.PORTFOLIO}")
    return portfolio


def _diff_values(pairs: dict, enum_keys: frozenset = frozenset()) -> dict:
    """
    Compare old/new value pairs and build a changes dict for any that differ.

    :param pairs: mapping of change-key -> (old_value, new_value) tuples.
    :param enum_keys: keys whose values are enums and should be serialized via their `.name`.

    :return: {key: {"old_value": ..., "new_value": ...}} for values that differ.
    """
    changes = {}
    for key, (old_value, new_value) in pairs.items():
        if old_value == new_value:
            continue
        if key in enum_keys:
            changes[key] = {
                "old_value": old_value.name if old_value else None,
                "new_value": new_value.name if new_value else None,
            }
        else:
            changes[key] = {"old_value": old_value, "new_value": new_value}
    return changes


def _update_can_fields(can: CAN, data: CANData, portfolio: Optional[Portfolio], sys_user: User) -> dict:
    """
    Update an existing CAN's attributes and return a changes dict of whatever differs from before
    the update.

    Blank NICK_NAME/PORTFOLIO leave the existing value untouched. CAN_DESCRIPTION is intentionally
    full-replacement (not blank-preserving) — a description is expected to always be present in
    the source data, so a blank value on an update is treated as a real change, not an omission.

    :param can: The existing CAN to update.
    :param data: The CANData instance to use.
    :param portfolio: The resolved Portfolio, or None to leave the CAN's portfolio alone.
    :param sys_user: The system user to use.

    :return: {field: {"old_value": ..., "new_value": ...}} for fields that changed.
    """
    old_values = {
        "number": can.number,
        "description": can.description,
        "nick_name": can.nick_name,
        "portfolio_id": can.portfolio_id,
    }

    can.number = data.CAN_NBR
    can.description = data.CAN_DESCRIPTION
    if data.NICK_NAME:
        can.nick_name = data.NICK_NAME
    if portfolio:
        can.portfolio = portfolio
    can.updated_by = sys_user.id
    can.updated_on = datetime.now()

    # can.portfolio_id isn't populated until flush, so diff against the resolved portfolio's id
    # directly rather than reading the (still-stale) FK column back off `can`.
    new_portfolio_id = portfolio.id if portfolio else old_values["portfolio_id"]

    return _diff_values(
        {
            "number": (old_values["number"], can.number),
            "description": (old_values["description"], can.description),
            "nick_name": (old_values["nick_name"], can.nick_name),
            "portfolio_id": (old_values["portfolio_id"], new_portfolio_id),
        }
    )


_FUNDING_DETAILS_FIELDS = (
    "fiscal_year",
    "fund_code",
    "allowance",
    "sub_allowance",
    "allotment",
    "appropriation",
    "method_of_transfer",
    "funding_source",
    "funding_partner",
)
_FUNDING_DETAILS_ENUM_FIELDS = frozenset({"method_of_transfer", "funding_source"})


def _capture_funding_details_values(funding_details: Optional[CANFundingDetails]) -> dict:
    """
    Snapshot a CANFundingDetails' comparable fields, or all-None if there is none.

    :param funding_details: The CANFundingDetails to snapshot, or None.

    :return: {field: value} for each of _FUNDING_DETAILS_FIELDS.
    """
    if not funding_details:
        return {field_name: None for field_name in _FUNDING_DETAILS_FIELDS}
    return {field_name: getattr(funding_details, field_name) for field_name in _FUNDING_DETAILS_FIELDS}


def _track_funding_details_changes(can: CAN, old_funding_details: dict, is_new: bool) -> dict:
    """
    Diff a CAN's current funding_details against a prior snapshot, keyed as `funding_details.<field>`.
    When the CAN had no funding_details before (old_funding_details is empty), every field is treated
    as a None -> new_value change, so the first-ever funding_details record for an existing CAN always
    produces an UPDATE_CAN history event.

    :param can: The CAN whose funding_details was just created/updated.
    :param old_funding_details: A snapshot from _capture_funding_details_values, or {} if there was none.
    :param is_new: Whether this row is creating a brand-new CAN.

    :return: {field: {"old_value": ..., "new_value": ...}} for funding_details fields that changed.
    """
    if is_new or not can.funding_details:
        return {}
    if not old_funding_details:
        old_funding_details = _capture_funding_details_values(None)

    fd = can.funding_details
    return _diff_values(
        {
            f"funding_details.{field_name}": (old_funding_details[field_name], getattr(fd, field_name))
            for field_name in _FUNDING_DETAILS_FIELDS
        },
        enum_keys=frozenset(f"funding_details.{field_name}" for field_name in _FUNDING_DETAILS_ENUM_FIELDS),
    )


def _record_can_event(can: CAN, sys_user: User, session: Session, is_new: bool, changes: dict) -> None:
    """
    Create and commit the OpsEvent (CREATE_NEW_CAN or UPDATE_CAN) and fire the history trigger. No
    event is created for an update with no actual changes.

    :param can: The CAN that was just created/updated.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    :param is_new: Whether this row created a brand-new CAN.
    :param changes: The changes dict from updating the CAN and its funding_details.
    """
    if not is_new and not changes:
        logger.info(f"No changes detected for CAN with id {can.id} and number {can.number}, skipping event creation")
        return

    event = OpsEvent(event_status=OpsEventStatus.SUCCESS, created_by=sys_user.id)
    if is_new:
        event.event_type = OpsEventType.CREATE_NEW_CAN
        event.event_details = {"new_can": can.to_dict()}
        session.add(event)
        session.commit()
        logger.info(f"Created Ops Event for new CAN with id {can.id} and number {can.number}")
    else:
        event.event_type = OpsEventType.UPDATE_CAN
        event.event_details = {"can_updates": {"owner_id": can.id, "changes": changes}}
        session.add(event)
        session.commit()
        logger.info(
            f"Created Ops Event for existing CAN with id {can.id} and number {can.number} with {len(changes)} changes"
        )

    can_history_trigger_func(event, session, sys_user)


def create_models(data: CANData, sys_user: User, session: Session) -> None:
    """
    Upsert a CAN and its associated CANFundingDetails.

    :param data: The CanData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    """
    logger.debug(f"Creating models for {data}")

    try:
        base_date = datetime(data.FISCAL_YEAR - 1, 10, 1)

        can = _find_existing_can(data, session)
        is_new = can is None

        portfolio = _resolve_portfolio(data, is_new, session)

        changes = {}
        old_funding_details = {}

        if can:
            if can.funding_details:
                old_funding_details = _capture_funding_details_values(can.funding_details)
            changes = _update_can_fields(can, data, portfolio, sys_user)
        else:
            can = CAN(
                id=data.SYS_CAN_ID if data.SYS_CAN_ID else None,
                number=data.CAN_NBR,
                description=data.CAN_DESCRIPTION,
                nick_name=data.NICK_NAME,
                portfolio=portfolio,
                created_by=sys_user.id,
                updated_by=sys_user.id,
                created_on=base_date,
                updated_on=base_date,
            )

        try:
            validate_fund_code(data)
            can.funding_details = get_or_create_funding_details(data, sys_user, can.funding_details)
            changes.update(_track_funding_details_changes(can, old_funding_details, is_new))
        except ValueError as e:
            # Intentional: a new CAN with an invalid fund code, or missing required
            # METHOD_OF_TRANSFER/FUNDING_SOURCE, still gets created with funding_details=None
            # rather than failing the whole row. See test_create_models_new_can_blank_*.
            logger.warning(
                f"Skipping creating funding details for {data} due to invalid or missing required funding data. {e}"
            )

        if is_new:
            session.add(can)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
            logger.info(f"Upserted CAN {can.number} with id {can.id}")
            _record_can_event(can, sys_user, session, is_new, changes)

    except Exception as e:
        session.rollback()
        logger.error(f"Error creating models for {data}")
        raise e


def get_or_create_funding_details(
    data: CANData,
    sys_user: User,
    existing: Optional[CANFundingDetails],
) -> CANFundingDetails:
    """
    Update the existing CANFundingDetails if present, or create a new one.

    The CAN-to-FundingDetails relationship is 1:1, so lookup is done via
    the CAN's existing funding_details rather than a field-based query.

    :param data: The CANData instance to use.
    :param sys_user: The system user to use.
    :param existing: The CAN's current funding_details, or None.

    :return: A CANFundingDetails instance.
    """
    fiscal_year = int(data.FUND[6:10])
    fund_code = data.FUND
    allowance = data.ALLOWANCE
    sub_allowance = data.SUB_ALLOWANCE
    allotment = data.ALLOTMENT_ORG

    appropriation = "-".join([data.APPROP_PREFIX or "", data.APPROP_YEAR or "", data.APPROP_POSTFIX or ""])

    if existing:
        # Blank METHOD_OF_TRANSFER/FUNDING_SOURCE leave the existing value alone.
        method_of_transfer = (
            CANMethodOfTransfer[data.METHOD_OF_TRANSFER] if data.METHOD_OF_TRANSFER else existing.method_of_transfer
        )
        funding_source = (
            (CANFundingSource[data.FUNDING_SOURCE] if data.FUNDING_SOURCE != "ACF - MOU" else CANFundingSource.ACF_MOU)
            if data.FUNDING_SOURCE
            else existing.funding_source
        )
    else:
        if not data.METHOD_OF_TRANSFER:
            raise ValueError("METHOD_OF_TRANSFER is required to create funding details.")
        if not data.FUNDING_SOURCE:
            raise ValueError("FUNDING_SOURCE is required to create funding details.")
        method_of_transfer = CANMethodOfTransfer[data.METHOD_OF_TRANSFER]
        funding_source = (
            CANFundingSource[data.FUNDING_SOURCE] if data.FUNDING_SOURCE != "ACF - MOU" else CANFundingSource.ACF_MOU
        )
    # Blank FUNDING_PARTNER leaves the existing value alone; it's never required.
    funding_partner = data.FUNDING_PARTNER if data.FUNDING_PARTNER else (existing.funding_partner if existing else None)

    if existing:
        existing.fiscal_year = fiscal_year
        existing.fund_code = fund_code
        existing.allowance = allowance
        existing.sub_allowance = sub_allowance
        existing.allotment = allotment
        existing.appropriation = appropriation
        existing.method_of_transfer = method_of_transfer
        existing.funding_source = funding_source
        existing.funding_partner = funding_partner
        existing.updated_by = sys_user.id
        existing.updated_on = datetime.now()
        return existing

    funding_details = CANFundingDetails(
        fiscal_year=fiscal_year,
        fund_code=fund_code,
        allowance=allowance,
        sub_allowance=sub_allowance,
        allotment=allotment,
        appropriation=appropriation,
        method_of_transfer=method_of_transfer,
        funding_source=funding_source,
        funding_partner=funding_partner,
        created_by=sys_user.id,
        updated_by=sys_user.id,
        created_on=datetime(data.FISCAL_YEAR - 1, 10, 1),
        updated_on=datetime(data.FISCAL_YEAR - 1, 10, 1),
    )
    return funding_details


def validate_fund_code(data: CANData) -> None:
    """
    Validate the fund code in a CANData instance.

    :param data: The CANData instance to validate.

    :return: None
    :raises ValueError: If the fund code is invalid.
    """
    if not data.FUND:
        raise ValueError("Fund code is required.")
    if len(data.FUND) != 14:
        raise ValueError(f"Invalid fund code length {data.FUND}")
    int(data.FUND[6:10])
    length_of_appropriation = data.FUND[10]
    if length_of_appropriation not in ["0", "1", "2", "5", "3", "8"]:
        raise ValueError(f"Invalid length of appropriation {length_of_appropriation}")

    direct_or_reimbursable = data.FUND[11]
    if direct_or_reimbursable not in ["D", "R"]:
        raise ValueError(f"Invalid direct or reimbursable {direct_or_reimbursable}")
    category = data.FUND[12]
    if category not in ["A", "B", "C"]:
        raise ValueError(f"Invalid category {category}")
    discretionary_or_mandatory = data.FUND[13]
    if discretionary_or_mandatory not in ["D", "M"]:
        raise ValueError(f"Invalid discretionary or mandatory {discretionary_or_mandatory}")


def create_all_models(data: List[CANData], sys_user: User, session: Session) -> None:
    """
    Convert a list of CanData instances to a list of BaseModel instances.

    :param data: The list of CanData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_can_data(data: List[dict]) -> List[CANData]:
    """
    Convert a list of dictionaries to a list of CanData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of CanData instances.
    """
    return [create_can_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the CSV file and persist the models to the database.

    :param data: The data from the CSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.

    :return: None
    """
    portfolios = list(session.execute(select(Portfolio)).scalars().all())
    logger.info(f"Retrieved {len(portfolios)} portfolios.")

    if not data or not portfolios or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    can_data = create_all_can_data(list(data))
    logger.info(f"Created {len(can_data)} CAN data instances.")

    if not validate_all(can_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(can_data, sys_user, session)
    logger.info("Finished loading models.")
