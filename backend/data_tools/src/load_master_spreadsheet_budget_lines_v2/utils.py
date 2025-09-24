from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

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
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    CAN,
    AABudgetLineItem,
    Agreement,
    AgreementType,
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
)


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
        if isinstance(self.ID, str):
            self.ID = int(self.ID) if self.ID.isdigit() else None

        if isinstance(self.AGREEMENT_NAME, str):
            self.AGREEMENT_NAME = self.AGREEMENT_NAME.strip() if self.AGREEMENT_NAME.strip() else None

        if isinstance(self.AGREEMENT_TYPE, str):
            self.AGREEMENT_TYPE = get_cig_type_mapping().get(self.AGREEMENT_TYPE.lower(), None)

        if isinstance(self.LINE_DESC, str):
            self.LINE_DESC = self.LINE_DESC.strip() if self.LINE_DESC.strip() else None

        if isinstance(self.DATE_NEEDED, str):
            self.DATE_NEEDED = convert_master_budget_amount_string_to_date(self.DATE_NEEDED)

        if isinstance(self.AMOUNT, str):
            self.AMOUNT = convert_master_budget_amount_string_to_float(self.AMOUNT)

        if isinstance(self.STATUS, str):
            self.STATUS = get_bli_status(self.STATUS)

        if isinstance(self.COMMENTS, str):
            self.COMMENTS = self.COMMENTS.strip() if self.COMMENTS.strip() else None

        if isinstance(self.CAN, str):
            self.CAN = self.CAN.strip() if self.CAN.strip() else None

        if isinstance(self.SC, str):
            self.SC = self.SC.strip() if self.SC.strip() else None

        if isinstance(self.PROC_SHOP, str):
            self.PROC_SHOP = self.PROC_SHOP.strip() if self.PROC_SHOP.strip() else None

        if isinstance(self.PROC_SHOP_FEE, str):
            self.PROC_SHOP_FEE = convert_master_budget_amount_string_to_float(self.PROC_SHOP_FEE)

        if isinstance(self.PROC_SHOP_RATE, str):
            self.PROC_SHOP_RATE = convert_master_budget_amount_string_to_float(self.PROC_SHOP_RATE)


def create_models(data: BudgetLineItemData, sys_user: User, session: Session) -> None:
    """
    Create and persist the models to the database.
    """
    logger.debug(f"Creating models for {data}.")

    try:
        # is_not_in_execution = data.STATUS != BudgetLineItemStatus.IN_EXECUTION
        # is_contract = data.AGREEMENT_TYPE == AgreementType.CONTRACT

        # Find the associated Agreement
        agreement = session.execute(
            select(Agreement)
            .where(Agreement.name == data.AGREEMENT_NAME)
            .where(Agreement.agreement_type == data.AGREEMENT_TYPE)
        ).scalar_one_or_none()

        if not agreement:
            logger.warning(f"Agreement with Agreement Name {data.AGREEMENT_NAME} not found.")

        # Get CAN if it exists
        can_number = data.CAN.split(" ")[0] if data.CAN else None
        can = session.execute(select(CAN).where(CAN.number == can_number)).scalar_one_or_none()

        if not can:
            logger.warning(f"CAN with number {can_number} not found.")

        # Get the Procurement Shop if it exists
        proc_shop = session.scalar(select(ProcurementShop).where(ProcurementShop.abbr == data.PROC_SHOP))

        # Update the procurement shop on the agreement if it has changed
        if proc_shop and agreement and proc_shop != agreement.procurement_shop:
            agreement.procurement_shop = proc_shop

        procurement_shop_fee_id = None
        if proc_shop and data.STATUS == BudgetLineItemStatus.OBLIGATED:
            calc_result = calculate_proc_fee_percentage(Decimal(data.PROC_SHOP_FEE), Decimal(data.AMOUNT))
            fee_percentage = calc_result * 100 if calc_result else 0
            procurement_shop_fee_id = session.scalar(
                select(ProcurementShopFee.id).where(
                    ProcurementShopFee.procurement_shop_id == proc_shop.id,
                    ProcurementShopFee.fee.between(fee_percentage - Decimal(0.01), fee_percentage + Decimal(0.01)),
                )
            )
        if proc_shop and data.STATUS == BudgetLineItemStatus.OBLIGATED and not procurement_shop_fee_id:
            logger.warning(
                f"Procurement shop fee not found for ProcurementShop {proc_shop.name} with fee {data.PROC_SHOP_FEE}."
            )

        if agreement:
            sc = get_sc(data.SC, agreement.id, get_agreement_class_from_type(data.AGREEMENT_TYPE), session, sys_user)
            if sc:
                session.add(sc)

        # Determine which subclass to instantiate
        bli_class = {
            AgreementType.CONTRACT: ContractBudgetLineItem,
            AgreementType.GRANT: GrantBudgetLineItem,
            AgreementType.DIRECT_OBLIGATION: DirectObligationBudgetLineItem,
            AgreementType.IAA: IAABudgetLineItem,
            AgreementType.AA: AABudgetLineItem,
        }.get(data.AGREEMENT_TYPE, None)

        # Handle the case where the bli subclass is not found
        if not bli_class:
            logger.warning(f"Unable to map AgreementType={data.AGREEMENT_TYPE} to a BudgetLineItem subclass.")
            return

        existing_budget_line_item = session.execute(
            select(bli_class).where(bli_class.id == data.ID)
        ).scalar_one_or_none()

        if not existing_budget_line_item and data.ID:
            logger.warning(f"BudgetLineItem with SYS_BUDGET_ID {data.ID} not found.")
            return

        if not existing_budget_line_item:
            # Create a new BudgetLineItem subclass
            bli = bli_class(
                budget_line_item_type=data.AGREEMENT_TYPE if data.AGREEMENT_TYPE else None,
                line_description=data.LINE_DESC,
                comments=data.COMMENTS,
                agreement_id=agreement.id if agreement else None,
                agreement=agreement if agreement else None,
                can_id=can.id if can else None,
                can=can if can else None,
                amount=data.AMOUNT,
                status=data.STATUS,
                date_needed=data.DATE_NEEDED,
                procurement_shop_fee_id=procurement_shop_fee_id,
                created_by=sys_user.id,
                created_on=datetime.now(),
            )

            session.add(bli)
            commit_or_rollback(session)

            logger.info(f"CREATED {bli_class.__name__} model for {bli.to_dict()}")

        else:
            bli = existing_budget_line_item
            bli.line_description = data.LINE_DESC
            bli.comments = data.COMMENTS
            bli.agreement_id = agreement.id if agreement else None
            bli.agreement = agreement if agreement else None
            bli.can_id = can.id if can else None
            bli.can = can if can else None
            bli.amount = data.AMOUNT
            bli.status = data.STATUS
            bli.date_needed = data.DATE_NEEDED
            bli.procurement_shop_fee_id = procurement_shop_fee_id
            bli.updated_by = sys_user.id
            bli.updated_on = datetime.now()

            session.add(bli)
            commit_or_rollback(session)

            logger.info(f"UPSERTING {bli_class.__name__} model for {bli.to_dict()}")

        # Record the new SYS_BUDGET_ID to manually update the spreadsheet later
        if not existing_budget_line_item:
            logger.warning(
                f"***Manually update BudgetLineItem.id in Budget Spreadsheet: original Agreement "
                f"Name={data.AGREEMENT_NAME}, Agreement Type={data.AGREEMENT_TYPE}"
                f"original LINE_DESC={data.LINE_DESC}, created SYS_BUDGET_ID = {bli.id}.***"
            )

        commit_or_rollback(session)

        # Create an OPSEvent record for the new BLI
        ops_event = OpsEvent(
            event_type=OpsEventType.CREATE_BLI if not existing_budget_line_item else OpsEventType.UPDATE_BLI,
            event_status=OpsEventStatus.SUCCESS,
            created_by=sys_user.id,
            event_details={"new_bli": bli.to_dict()},
        )
        session.add(ops_event)
        commit_or_rollback(session)

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
