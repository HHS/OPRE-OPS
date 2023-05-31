from models.base import BaseModel

from ops_api.ops.base_views import BaseItemAPI, BaseListAPI


class DivisionsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)


class DivisionsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
