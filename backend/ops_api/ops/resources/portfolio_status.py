from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI


class PortfolioStatusItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class PortfolioStatusListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
