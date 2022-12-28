from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI
from ops.models.base import BaseModel


class ProtectedItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)


class ProtectedListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
