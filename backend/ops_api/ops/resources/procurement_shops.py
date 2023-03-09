from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI


class ProcurementShopItemAPI(BaseItemAPI):  # type: ignore [misc]
    def __init__(self, model: BaseModel):
        super().__init__(model)


class ProcurementShopListAPI(BaseListAPI):  # type: ignore [misc]
    def __init__(self, model: BaseModel):
        super().__init__(model)
