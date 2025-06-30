from typing import Type

from models import AgreementChangeRequest, BudgetLineItemChangeRequest, ChangeRequest, ChangeRequestType

CHANGE_REQUEST_MODEL_MAP = {
    ChangeRequestType.CHANGE_REQUEST: ChangeRequest,
    ChangeRequestType.AGREEMENT_CHANGE_REQUEST: AgreementChangeRequest,
    ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST: BudgetLineItemChangeRequest,
}


def get_model_class_by_type(request_type: ChangeRequestType) -> Type[ChangeRequest]:
    model_class = CHANGE_REQUEST_MODEL_MAP.get(request_type)
    if model_class is None:
        raise ValueError(f"Unsupported change request type: {request_type}")
    return model_class
