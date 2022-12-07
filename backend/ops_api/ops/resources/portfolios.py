from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI


class PortfolioItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class PortfolioListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
