class NotActiveUserError(Exception):
    """
    Exception to raise when the user is not active.
    """

    pass


class ExtraCheckError(Exception):
    """Exception used to handle errors from the extra check function that can be passed
    into @is_authorized().
    """

    def __init__(self, response_data):
        super().__init__()
        self.response_data = response_data
