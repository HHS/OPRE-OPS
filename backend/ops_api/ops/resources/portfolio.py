from ops.views import BaseItemAPI
from ops.views import BaseListAPI


class PortfolioItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class PortfolioListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
