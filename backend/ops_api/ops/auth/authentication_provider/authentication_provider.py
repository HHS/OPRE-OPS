from abc import ABC, abstractmethod


class AuthenticationProvider(ABC):
    @abstractmethod
    def authenticate(self, auth_code):
        pass

    @abstractmethod
    def get_user_info(self, token):
        pass

    @abstractmethod
    def validate_token(self, token):
        pass
