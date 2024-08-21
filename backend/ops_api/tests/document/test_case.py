import unittest

from flask import Flask
from flask_jwt_extended import current_user

from models import Role, User


class BaseDocumentTestCase(unittest.TestCase):
    def setUp(self):
        # Mock Flask app
        self.app = Flask(__name__)
        self.app.config["AUTHLIB_OAUTH_CLIENTS"] = "fakeauth"
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Mock current_user with admin roles
        self.mock_user = User(id=1, roles=[Role(name="admin")])
        self.app.before_request(lambda: setattr(current_user, "id", self.mock_user.id))
        self.app.before_request(lambda: setattr(current_user, "roles", self.mock_user.roles))

    def tearDown(self):
        self.app_context.pop()
