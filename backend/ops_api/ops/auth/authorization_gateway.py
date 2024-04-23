class AuthorizationGateway:
    def __init__(self, authorization_provider) -> None:
        self.authorization_provider = authorization_provider

    def is_authorized(self, oidc_id, permission):
        return self.authorization_provider.is_authorized(oidc_id, permission)

    def authorize(self, oidc_id: str, permission: str) -> bool:
        """
        Will do a lookup based on the provided oidc_id, and check whether that
        user's role contains those permissions.
        For now this is simply a basic string lookup/comparison.

        Args:
            oidc_id (str): User OIDC_ID (sub from JWT)
            permission (list[str]): list of strings, for the allowed permissions

        Returns:
            bool: Basic pass/fail check.
        """
        if not self.is_authorized(oidc_id, permission):
            # TODO Perform a logging action, so we can audit this invalid
            # authorization attempt somewhere.
            # raise ValueError("User is not authorized")
            return False
        # If the user is authorized, do any necessary authorization tasks here
        # For example, logging the user in, setting session data, etc.
        # ...

        # Return a success message
        # print(f"User {oidc_id} has been authorized for {permission}")
        return True
