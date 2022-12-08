from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI


class DivisionsItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class DivisionsListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
