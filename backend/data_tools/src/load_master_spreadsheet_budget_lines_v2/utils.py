import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from data_tools.src.common.utils import (
    calculate_proc_fee_percentage,
    commit_or_rollback,
    convert_master_budget_amount_string_to_date,
    convert_master_budget_amount_string_to_float,
    get_agreement_class_from_type,
    get_bli_status,
    get_cig_type_mapping,
    get_sc,
)
from models import (
    CAN,
    AABudgetLineItem,
    Agreement,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    DirectObligationBudgetLineItem,
    GrantBudgetLineItem,
    IAABudgetLineItem,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    ProcurementShop,
    ProcurementShopFee,
    User,
    agreement_history_trigger_func,
)
from models.procurement_action import ProcurementActionStatus
from models.procurement_tracker import ProcurementTrackerStatus
from models.procurement_workflow import (
    get_earliest_obligated_date_needed,
    get_or_create_procurement_records_for_modification,
    get_or_create_procurement_records_for_new_award,
    has_obligated_blis,
    link_blis_to_action,
)
from models.utils import generate_events_update


def _strip_or_none(val):
    """Convert a string value to stripped string or None if empty/non-string."""
    if isinstance(val, str):
        return val.strip() or None
    return val


def _to_float_or_none(val):
    """Convert a string value to float using the master budget converter, or pass through."""
    if isinstance(val, str):
        return convert_master_budget_amount_string_to_float(val)
    return val


def _to_int_or_none(val):
    """Convert a string value to int if numeric, or None."""
    if isinstance(val, str):
        return int(val) if val.isdigit() else None
    return val


@dataclass
class BudgetLineItemData:
    """
    Dataclass to represent a BudgetLineItemData data row.
    """

    ID: int
    AGREEMENT_NAME: Optional[str] = field(default=None)
    AGREEMENT_TYPE: Optional[AgreementType] = field(default=None)
    LINE_DESC: Optional[str] = field(default=None)
    DATE_NEEDED: Optional[date] = field(default=None)
    AMOUNT: Optional[float] = field(default=None)
    STATUS: Optional[BudgetLineItemStatus] = field(default=None)
    COMMENTS: Optional[str] = field(default=None)
    CAN: Optional[str] = field(default=None)
    SC: Optional[str] = field(default=None)
    PROC_SHOP: Optional[str] = field(default=None)
    PROC_SHOP_FEE: Optional[float] = field(default=None)
    PROC_SHOP_RATE: Optional[float] = field(default=None)

    def __post_init__(self):
        """
        Post-initialization processing to convert data types.
        """
        self.ID = _to_int_or_none(self.ID)
        self.AGREEMENT_NAME = _strip_or_none(self.AGREEMENT_NAME)
        self.LINE_DESC = _strip_or_none(self.LINE_DESC)
        self.COMMENTS = _strip_or_none(self.COMMENTS)
        self.CAN = _strip_or_none(self.CAN)
        self.SC = _strip_or_none(self.SC)
        self.PROC_SHOP = _strip_or_none(self.PROC_SHOP)
        self.AMOUNT = _to_float_or_none(self.AMOUNT)
        self.PROC_SHOP_FEE = _to_float_or_none(self.PROC_SHOP_FEE)
        self.PROC_SHOP_RATE = _to_float_or_none(self.PROC_SHOP_RATE)

        if isinstance(self.AGREEMENT_TYPE, str):
            self.AGREEMENT_TYPE = get_cig_type_mapping().get(self.AGREEMENT_TYPE.lower(), None)

        if isinstance(self.DATE_NEEDED, str):
            self.DATE_NEEDED = convert_master_budget_amount_string_to_date(self.DATE_NEEDED)

        if isinstance(self.STATUS, str):
            self.STATUS = get_bli_status(self.STATUS)


def _resolve_procurement_fee(data, proc_shop, agreement, session):
    """Resolve procurement shop assignment and fee lookup. Returns procurement_shop_fee_id."""
    if proc_shop and agreement and proc_shop != agreement.procurement_shop:
        agreement.procurement_shop = proc_shop

    procurement_shop_fee_id = None
    if proc_shop and data.STATUS == BudgetLineItemStatus.OBLIGATED:
        if data.PROC_SHOP_FEE is None or data.AMOUNT is None:
            logger.warning(
                f"OBLIGATED budget line missing PROC_SHOP_FEE or AMOUNT data. "
                f"Agreement: {data.AGREEMENT_NAME}, PROC_SHOP_FEE: {data.PROC_SHOP_FEE}, AMOUNT: {data.AMOUNT}"
            )
        else:
            calc_result = calculate_proc_fee_percentage(Decimal(data.PROC_SHOP_FEE), Decimal(data.AMOUNT))
            fee_percentage = calc_result * 100 if calc_result else 0
            procurement_shop_fee = session.scalar(
                select(ProcurementShopFee).where(
                    ProcurementShopFee.procurement_shop_id == proc_shop.id,
                    ProcurementShopFee.fee.between(fee_percentage - Decimal(0.01), fee_percentage + Decimal(0.01)),
                )
            )
            if procurement_shop_fee:
                procurement_shop_fee_id = procurement_shop_fee.id
                if agreement and not agreement.procurement_shop:
                    agreement.procurement_shop = procurement_shop_fee.procurement_shop
            else:
                logger.warning(
                    f"Procurement shop fee not found for ProcurementShop {proc_shop.name}"
                    f" with fee {data.PROC_SHOP_FEE}."
                )
    return procurement_shop_fee_id


def _find_agreement_and_can(data, session):
    """Find the agreement and CAN for the budget line item."""
    agreement = session.execute(
        select(Agreement)
        .where(Agreement.name == data.AGREEMENT_NAME)
        .where(Agreement.agreement_type == data.AGREEMENT_TYPE)
    ).scalar_one_or_none()

    if not agreement:
        logger.warning(f"Agreement with Agreement Name {data.AGREEMENT_NAME} not found.")

    can_number = data.CAN.split(" ")[0] if data.CAN else None
    can = session.execute(select(CAN).where(CAN.number == can_number)).scalar_one_or_none()

    if not can:
        logger.warning(f"CAN with number {can_number} not found.")

    return agreement, can


_PROCUREMENT_ELIGIBLE_TYPES = {AgreementType.CONTRACT, AgreementType.IAA, AgreementType.AA}


def _sync_procurement_records_for_bli(
    data: "BudgetLineItemData", bli: BudgetLineItem, agreement: Agreement, sys_user: User, session: Session
) -> None:
    """
    Create/update the ProcurementAction(s) and ProcurementTracker(s) implied by this BLI's status.

    - IN_EXECUTION: NEW_AWARD (or MODIFICATION if the agreement already has OBLIGATED BLIs).
    - OBLIGATED: NEW_AWARD, AWARDED — covers agreements imported already-awarded, which skip
      IN_EXECUTION entirely and would otherwise never get a ProcurementAction/Tracker.
    """
    if not agreement or data.AGREEMENT_TYPE not in _PROCUREMENT_ELIGIBLE_TYPES:
        return

    if bli.status == BudgetLineItemStatus.IN_EXECUTION:
        is_mod = has_obligated_blis(session, agreement.id)
        if is_mod:
            action, _, _, _ = get_or_create_procurement_records_for_modification(
                session, agreement, created_by=sys_user.id, source="SpreadsheetIngest"
            )
        else:
            action, _, _, _ = get_or_create_procurement_records_for_new_award(
                session, agreement, created_by=sys_user.id, source="SpreadsheetIngest"
            )
        link_blis_to_action(session, agreement, action, BudgetLineItemStatus.IN_EXECUTION)
        commit_or_rollback(session)
    elif bli.status == BudgetLineItemStatus.OBLIGATED:
        # No fallback if date_needed is null — leave the date unset rather than guessing.
        award_date = get_earliest_obligated_date_needed(session, agreement.id)
        action, _, _, _ = get_or_create_procurement_records_for_new_award(
            session,
            agreement,
            created_by=sys_user.id,
            action_status=ProcurementActionStatus.AWARDED,
            tracker_status=ProcurementTrackerStatus.COMPLETED,
            date_awarded_obligated=award_date,
            source="SpreadsheetIngest",
            include_terminal=True,
        )
        link_blis_to_action(session, agreement, action, BudgetLineItemStatus.OBLIGATED)
        commit_or_rollback(session)


def _upsert_bli(data, bli_class, existing_bli, agreement, can, sc, procurement_shop_fee_id, sys_user, session):
    """
    Create a new BudgetLineItem or update an existing one.

    Returns (bli, existing_bli_dict), where existing_bli_dict is None for a newly
    created BLI, or the pre-update dict (for the history diff) when updating.
    """
    fields = {
        "line_description": data.LINE_DESC,
        "comments": data.COMMENTS,
        "agreement_id": agreement.id if agreement else None,
        "agreement": agreement if agreement else None,
        "can_id": can.id if can else None,
        "can": can if can else None,
        "amount": data.AMOUNT,
        "status": data.STATUS,
        "date_needed": data.DATE_NEEDED,
        "procurement_shop_fee_id": procurement_shop_fee_id,
        "services_component": sc,
        "service_component_name_for_sort": sc.display_name_for_sort if sc else None,
    }

    if not existing_bli:
        bli = bli_class(
            budget_line_item_type=data.AGREEMENT_TYPE if data.AGREEMENT_TYPE else None,
            **fields,
            created_by=sys_user.id,
            created_on=datetime.now(),
        )
        session.add(bli)
        commit_or_rollback(session)
        logger.info(f"CREATED {bli_class.__name__} model for {bli.to_dict()}")
        return bli, None

    existing_bli_dict = existing_bli.to_dict()  # capture before mutating for diff
    bli = existing_bli
    for field_name, value in fields.items():
        setattr(bli, field_name, value)
    bli.updated_by = sys_user.id
    bli.updated_on = datetime.now()

    session.add(bli)
    commit_or_rollback(session)
    logger.info(f"UPSERTING {bli_class.__name__} model for {bli.to_dict()}")
    return bli, existing_bli_dict


def _build_bli_ops_event(bli, existing_bli_dict, sys_user):
    """Build the CREATE_BLI/UPDATE_BLI OpsEvent for a BLI create-or-update."""
    if existing_bli_dict is None:
        return OpsEvent(
            event_type=OpsEventType.CREATE_BLI,
            event_status=OpsEventStatus.SUCCESS,
            created_by=sys_user.id,
            event_details={"new_bli": bli.to_dict()},
        )

    updates = generate_events_update(existing_bli_dict, bli.to_dict(), bli.id, sys_user.id)
    return OpsEvent(
        event_type=OpsEventType.UPDATE_BLI,
        event_status=OpsEventStatus.SUCCESS,
        created_by=sys_user.id,
        event_details={"bli_updates": updates, "bli": bli.to_dict()},
    )


def create_models(data: BudgetLineItemData, sys_user: User, session: Session) -> None:
    """
    Create and persist the models to the database.
    """
    logger.debug(f"Creating models for {data}.")

    try:
        agreement, can = _find_agreement_and_can(data, session)

        # Get the Procurement Shop if it exists
        proc_shop = session.scalar(select(ProcurementShop).where(ProcurementShop.abbr == data.PROC_SHOP))
        procurement_shop_fee_id = _resolve_procurement_fee(data, proc_shop, agreement, session)

        bli_class = {
            AgreementType.CONTRACT: ContractBudgetLineItem,
            AgreementType.GRANT: GrantBudgetLineItem,
            AgreementType.DIRECT_OBLIGATION: DirectObligationBudgetLineItem,
            AgreementType.IAA: IAABudgetLineItem,
            AgreementType.AA: AABudgetLineItem,
        }.get(data.AGREEMENT_TYPE)
        if not bli_class:
            logger.warning(f"Unable to map AgreementType={data.AGREEMENT_TYPE} to a BudgetLineItem subclass.")
            return

        sc = None
        if agreement:
            sc = get_sc(data.SC, agreement.id, get_agreement_class_from_type(data.AGREEMENT_TYPE), session, sys_user)
            if sc:
                session.add(sc)

        existing_budget_line_item = session.execute(
            select(bli_class).where(bli_class.id == data.ID)
        ).scalar_one_or_none()

        if not existing_budget_line_item and data.ID:
            logger.warning(f"BudgetLineItem with SYS_BUDGET_ID {data.ID} not found.")
            return

        bli, existing_bli_dict = _upsert_bli(
            data, bli_class, existing_budget_line_item, agreement, can, sc, procurement_shop_fee_id, sys_user, session
        )

        # Record the new SYS_BUDGET_ID to manually update the spreadsheet later
        if existing_bli_dict is None:
            logger.warning(
                f"***Manually update BudgetLineItem.id in Budget Spreadsheet: original Agreement "
                f"Name={data.AGREEMENT_NAME}, Agreement Type={data.AGREEMENT_TYPE}"
                f"original LINE_DESC={data.LINE_DESC}, created SYS_BUDGET_ID = {bli.id}.***"
            )

        commit_or_rollback(session)

        _sync_procurement_records_for_bli(data, bli, agreement, sys_user, session)

        # Create an OPSEvent record for the BLI create/update with the correct payload shape for each case.
        ops_event = _build_bli_ops_event(bli, existing_bli_dict, sys_user)
        session.add(ops_event)
        session.flush()  # populate ops_event.id and created_on before the history trigger reads them
        agreement_history_trigger_func(ops_event, session, sys_user, dry_run=True)
        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()

    except Exception as err:
        logger.error(f"Error creating models for {data}: {err}")
        session.rollback()
        raise err


def create_all_models(data: List[BudgetLineItemData], sys_user: User, session: Session) -> None:
    """
    Convert a list of BudgetLineItemData instances to a list of BaseModel instances.

    :param data: The list of BudgetLineItemData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    for d in data:
        create_models(d, sys_user, session)


def validate_data(data: BudgetLineItemData) -> bool:
    """
    Validate the data in a BudgetLineItemData instance.

    N.B. This is a stub function and always returns True.
    The budget line id is assumed to be valid if it exists in the spreadsheet since it will either
    be an integer or None.

    :param data: The BudgetLineItemData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return True


def validate_all(data: List[BudgetLineItemData]) -> bool:
    """
    Validate a list of BudgetLineItemData instances.

    :param data: The list of BudgetLineItemData instances to validate.

    :return: A list of valid BudgetLineItemData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_budget_line_item_data(data: dict) -> BudgetLineItemData:
    """
    Convert a dictionary to a BudgetLineItemData dataclass instance.

    :param data: The dictionary to convert.

    :return: A BudgetLineItemData dataclass instance.
    """
    return BudgetLineItemData(
        ID=data.get("BL ID #"),
        AGREEMENT_NAME=data.get("Agreement"),
        AGREEMENT_TYPE=data.get("Agreement Type"),
        LINE_DESC=data.get("Description"),
        DATE_NEEDED=data.get("Obligate By"),
        AMOUNT=data.get("SubTotal"),
        STATUS=data.get("Status"),
        COMMENTS=data.get("Comments"),
        CAN=data.get("CAN"),
        SC=data.get("SC"),
        PROC_SHOP=data.get("Procurement shop"),
        PROC_SHOP_FEE=data.get("Procurement shop fee"),
        PROC_SHOP_RATE=data.get("Procurement shop fee rate"),
    )


def create_all_budget_line_item_data(data: List[dict]) -> List[BudgetLineItemData]:
    """
    Convert a list of dictionaries to a list of BudgetLineItemData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of BudgetLineItemData instances.
    """
    return [create_budget_line_item_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the TSV file and persist the models to the database.

    :param data: The data from the TSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.
    :return: None
    """
    if not data or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    budget_line_item_data = create_all_budget_line_item_data(list(data))
    logger.info(f"Created {len(budget_line_item_data)} BudgetLineItemData instances.")

    if not validate_all(budget_line_item_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(budget_line_item_data, sys_user, session)
    logger.info("Finished loading models.")
