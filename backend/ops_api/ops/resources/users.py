from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI


class UsersItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class UsersListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
