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


class PrivateKeyError(Exception):
    """
    Exception to raise when the private key is not set.
    """

    pass


class AuthenticationError(Exception):
    """
    Exception to raise when there is an error with authentication.
    """

    pass


class InvalidUserSessionError(Exception):
    """
    Exception to raise when the user session is invalid.
    """

    pass
